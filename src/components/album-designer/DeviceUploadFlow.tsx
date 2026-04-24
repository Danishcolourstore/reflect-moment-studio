import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import pLimit from "p-limit";
import exifr from "exifr";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useDeviceDetect } from "@/hooks/use-device-detect";

const MAX_FILES = 500;
const ACCEPT = "image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif";

interface Props {
  albumId: string;
  /** Called after the new event is fully created and at least one photo is uploaded.
   *  The parent should switch to source="events" and link this eventId to the album. */
  onEventReady: (eventId: string, eventName: string) => void;
  /** Called as each photo finishes so the panel can show progress + early thumbnails */
  onPhotoUploaded?: (photo: { id: string; url: string; file_name: string }) => void;
}

type Phase = "idle" | "naming" | "uploading" | "done";

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
}

async function convertHeicIfNeeded(file: File): Promise<File> {
  const isHeic = /\.(heic|heif)$/i.test(file.name) || /heic|heif/i.test(file.type);
  if (!isHeic) return file;
  try {
    const heic2any = (await import("heic2any")).default;
    const blob = (await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 })) as Blob;
    const newName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
    return new File([blob], newName, { type: "image/jpeg", lastModified: file.lastModified });
  } catch (e) {
    console.warn("HEIC conversion failed, sending original", e);
    return file;
  }
}

async function readShootDate(file: File): Promise<string | null> {
  try {
    const exif = await exifr.parse(file, { pick: ["DateTimeOriginal", "CreateDate"] });
    const d: Date | undefined = exif?.DateTimeOriginal || exif?.CreateDate;
    if (d instanceof Date && !isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }
  } catch {}
  return null;
}

export default function DeviceUploadFlow({ albumId, onEventReady, onPhotoUploaded }: Props) {
  const { user } = useAuth();
  const device = useDeviceDetect();
  const isMobile = device.isPhone;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const wakeLockRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [pending, setPending] = useState<File[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [shake, setShake] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(0);
  const [createdEventName, setCreatedEventName] = useState("");

  /* ─── Wake Lock ─── */
  useEffect(() => {
    if (phase !== "uploading") return;
    let cancelled = false;
    (async () => {
      try {
        // @ts-ignore
        if (navigator.wakeLock?.request) {
          // @ts-ignore
          const lock = await navigator.wakeLock.request("screen");
          if (!cancelled) wakeLockRef.current = lock;
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
      if (wakeLockRef.current?.release) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [phase]);

  /* ─── File selection ─── */
  const handleFiles = async (fileList: FileList | File[] | null) => {
    if (!fileList) return;
    const arr = Array.from(fileList).filter((f) => /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name) || f.type.startsWith("image/"));
    if (arr.length === 0) return;
    const limited = arr.slice(0, MAX_FILES);
    if (arr.length > MAX_FILES) {
      toast.error(`Only the first ${MAX_FILES} photos will be uploaded.`);
    }
    setPending(limited);
    setPhase("naming");

    // Try to prefill date from first file's EXIF
    const guessed = await readShootDate(limited[0]);
    if (guessed) setEventDate(guessed);
  };

  const onPickClick = () => fileInputRef.current?.click();

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  /* ─── Create event + upload pipeline ─── */
  const beginUpload = async () => {
    if (!user) return;
    if (!eventName.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      inputRef.current?.focus();
      return;
    }

    const baseSlug = generateSlug(eventName) || "album-import";
    const finalSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    const dateForDb = eventDate || new Date().toISOString().slice(0, 10);

    const { data: eventRow, error: eventErr } = await (supabase
      .from("events")
      .insert({
        name: eventName.trim(),
        slug: finalSlug,
        event_date: dateForDb,
        user_id: user.id,
        source: "device_upload",
      } as any)
      .select("id, name")
      .single());

    if (eventErr || !eventRow) {
      console.error(eventErr);
      toast.error("Could not create event");
      return;
    }

    const eventId = eventRow.id as string;
    const eventLabel = eventRow.name as string;
    setCreatedEventName(eventLabel);
    setTotal(pending.length);
    setDone(0);
    setPhase("uploading");

    // Tell parent immediately so it can switch source + link album
    onEventReady(eventId, eventLabel);

    const limit = pLimit(4);
    let completed = 0;

    await Promise.all(
      pending.map((rawFile) =>
        limit(async () => {
          try {
            const file = await convertHeicIfNeeded(rawFile);
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
            const path = `${user.id}/${eventId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safeName}`;
            const { error: upErr } = await supabase.storage.from("gallery-photos").upload(path, file, {
              contentType: file.type || "image/jpeg",
              upsert: false,
            });
            if (upErr) throw upErr;
            const { data: { publicUrl } } = supabase.storage.from("gallery-photos").getPublicUrl(path);

            const { data: inserted, error: rowErr } = await (supabase
              .from("photos")
              .insert({
                event_id: eventId,
                user_id: user.id,
                url: publicUrl,
                file_name: file.name,
              } as any)
              .select("id, url, file_name")
              .single());

            if (rowErr) throw rowErr;
            if (inserted) {
              onPhotoUploaded?.({
                id: (inserted as any).id,
                url: (inserted as any).url,
                file_name: (inserted as any).file_name ?? file.name,
              });
            }
          } catch (e) {
            console.error("Photo upload failed", e);
          } finally {
            completed += 1;
            setDone(completed);
          }
        })
      )
    );

    setPhase("done");
  };

  const cancelNaming = () => {
    setPending([]);
    setEventName("");
    setEventDate("");
    setPhase("idle");
  };

  /* ─── RENDER ─── */

  // Drop zone
  if (phase === "idle") {
    return (
      <div className="px-3 py-3">
        <div
          onClick={onPickClick}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={cn(
            "w-full cursor-pointer flex flex-col items-center justify-center text-center transition-colors",
            "border border-dashed",
            isDragging ? "border-[#C8A97E] bg-[#F0EBE0]" : "border-[#E8E5E0] bg-[#F3F1EE]"
          )}
          style={{ borderRadius: 4, padding: "44px 20px" }}
        >
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#1A1917", lineHeight: 1.2 }}>
            Drop photos here
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6B6760", marginTop: 6 }}>
            or tap to select from your device
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    );
  }

  // Uploading / done — show inline progress
  if (phase === "uploading" || phase === "done") {
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const isDone = phase === "done";
    return (
      <div className="px-3 py-3 space-y-2">
        <div
          className={cn("h-[2px] w-full overflow-hidden transition-opacity duration-[400ms]", isDone && "opacity-0")}
          style={{ background: "#E8E5E0" }}
        >
          <div
            className="h-full transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%`, background: "#C8A97E" }}
          />
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6B6760" }}>
          {isDone
            ? `${createdEventName} — ${done} photos ready`
            : `${done} of ${total} photos uploaded`}
        </div>
        {isDone && (
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6B6760" }}>
            Saved to Events as &lsquo;{createdEventName}&rsquo;
          </div>
        )}
      </div>
    );
  }

  // Naming — Vaul on mobile, raw overlay on desktop
  const NamingBody = (
    <div className="space-y-4">
      <div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "#1A1917", lineHeight: 1.15 }}>
          Name this event
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6B6760", marginTop: 4 }}>
          {pending.length} photos selected
        </p>
      </div>

      <input
        ref={inputRef}
        type="text"
        autoFocus
        value={eventName}
        onChange={(e) => setEventName(e.target.value)}
        placeholder="e.g. Arjun & Priya — Mehendi"
        className={cn("w-full transition-transform", shake && "animate-[shake_0.4s_ease-in-out]")}
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          color: "#1A1917",
          height: 48,
          padding: "0 16px",
          border: "1px solid #E8E5E0",
          borderRadius: 4,
          background: "#FFFFFF",
          outline: "none",
        }}
      />

      <div>
        <label
          style={{
            display: "block",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            color: "#6B6760",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 6,
          }}
        >
          Event date (optional)
        </label>
        <input
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="w-full"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: "#1A1917",
            height: 48,
            padding: "0 16px",
            border: "1px solid #E8E5E0",
            borderRadius: 4,
            background: "#FFFFFF",
            outline: "none",
          }}
        />
      </div>

      <button
        onClick={beginUpload}
        className="w-full transition-opacity hover:opacity-90 active:opacity-80"
        style={{
          height: 48,
          background: "#C8A97E",
          color: "#1A1917",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          fontWeight: 500,
          borderRadius: 4,
          border: "none",
          cursor: "pointer",
        }}
      >
        Upload &amp; Create Event
      </button>

      <button
        onClick={cancelNaming}
        className="w-full"
        style={{
          background: "transparent",
          border: "none",
          color: "#6B6760",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          padding: "8px 0",
          cursor: "pointer",
        }}
      >
        Cancel
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <style>{`@keyframes shake {0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}`}</style>
        <Drawer open={phase === "naming"} onOpenChange={(o) => { if (!o) cancelNaming(); }}>
          <DrawerContent className="bg-[#FAFAF8]">
            <div className="p-5 pb-8">{NamingBody}</div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop overlay
  return (
    <>
      <style>{`@keyframes shake {0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}`}</style>
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center"
        style={{ background: "rgba(10,10,10,0.55)" }}
        onClick={cancelNaming}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-[#FAFAF8] w-full"
          style={{ maxWidth: 480, borderRadius: 4, padding: 28 }}
        >
          {NamingBody}
        </div>
      </div>
    </>
  );
}
