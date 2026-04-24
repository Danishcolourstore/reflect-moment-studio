/**
 * CheetahQuickUpload — drag/drop or pick photos in the browser and stream them
 * straight into the active Cheetah session via the cheetah-camera-upload edge
 * function. No camera config, no FTP — for photographers who AirDrop / SD-read
 * to phone or laptop and want them live in seconds.
 *
 * Each file is POSTed in parallel (max 3 in-flight) so a 30-photo batch finishes
 * fast on 4G/5G. The session realtime channel handles UI updates — this file
 * only worries about getting bytes in.
 */
import { useCallback, useRef, useState } from 'react';
import { UploadCloud, Loader2, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  uploadEndpoint: string;
  sessionCode: string;
  uploadToken: string;
  isLive: boolean;
}

type FileStatus = 'queued' | 'uploading' | 'done' | 'failed';
interface QueueItem {
  id: string;
  file: File;
  status: FileStatus;
  error?: string;
}

const CONCURRENCY = 3;
const MAX_FILE_SIZE = 80 * 1024 * 1024;

async function uploadOne(
  endpoint: string,
  code: string,
  token: string,
  file: File,
): Promise<void> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'x-session-code': code, 'x-upload-token': token },
    body: fd,
  });
  if (!res.ok) {
    let msg = `Upload failed (${res.status})`;
    try { const j = await res.json(); if (j?.error) msg = j.error; } catch {}
    throw new Error(msg);
  }
}

export function CheetahQuickUpload({ uploadEndpoint, sessionCode, uploadToken, isLive }: Props) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const runningRef = useRef(false);

  const runQueue = useCallback(
    async (initial: QueueItem[]) => {
      if (runningRef.current) return;
      runningRef.current = true;
      // We work off a mutable list reference so concurrent workers see updates.
      const list = [...initial];
      const inFlight = new Set<string>();

      const next = () => list.find((q) => q.status === 'queued' && !inFlight.has(q.id));

      const worker = async () => {
        let item = next();
        while (item) {
          inFlight.add(item.id);
          setQueue((prev) => prev.map((q) => (q.id === item!.id ? { ...q, status: 'uploading' } : q)));
          try {
            await uploadOne(uploadEndpoint, sessionCode, uploadToken, item.file);
            setQueue((prev) => prev.map((q) => (q.id === item!.id ? { ...q, status: 'done' } : q)));
            // Mark in local list too so next() advances
            const idx = list.findIndex((q) => q.id === item!.id);
            if (idx >= 0) list[idx] = { ...list[idx], status: 'done' };
          } catch (err: any) {
            const msg = err?.message || 'Upload failed';
            setQueue((prev) => prev.map((q) => (q.id === item!.id ? { ...q, status: 'failed', error: msg } : q)));
            const idx = list.findIndex((q) => q.id === item!.id);
            if (idx >= 0) list[idx] = { ...list[idx], status: 'failed', error: msg };
          }
          inFlight.delete(item.id);
          item = next();
        }
      };

      await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
      runningRef.current = false;

      const failed = list.filter((q) => q.status === 'failed').length;
      const ok = list.filter((q) => q.status === 'done').length;
      if (failed === 0) toast.success(`${ok} photo${ok === 1 ? '' : 's'} live`);
      else toast.error(`${failed} of ${list.length} failed — tap retry on each`);
    },
    [uploadEndpoint, sessionCode, uploadToken],
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      if (!isLive) {
        toast.error('Session is ended — start a new one to upload');
        return;
      }
      const arr = Array.from(files).filter((f) => {
        if (!f.type.startsWith('image/') && !/\.(jpe?g|png|heif|heic|tiff?|cr2|cr3|nef|arw|orf|rw2|dng)$/i.test(f.name)) {
          toast.error(`${f.name} — unsupported file type`);
          return false;
        }
        if (f.size > MAX_FILE_SIZE) {
          toast.error(`${f.name} — over 80MB limit`);
          return false;
        }
        return true;
      });
      if (arr.length === 0) return;

      const items: QueueItem[] = arr.map((file, i) => ({
        id: `${Date.now()}-${i}-${file.name}`,
        file,
        status: 'queued',
      }));
      setQueue((prev) => [...prev, ...items]);
      runQueue([...queue.filter((q) => q.status === 'queued' || q.status === 'uploading'), ...items]);
    },
    [isLive, queue, runQueue],
  );

  const retryOne = useCallback(
    (id: string) => {
      const item = queue.find((q) => q.id === id);
      if (!item) return;
      setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, status: 'queued', error: undefined } : q)));
      runQueue([{ ...item, status: 'queued' }]);
    },
    [queue, runQueue],
  );

  const clearDone = useCallback(() => {
    setQueue((prev) => prev.filter((q) => q.status !== 'done'));
  }, []);

  const stats = {
    queued: queue.filter((q) => q.status === 'queued').length,
    uploading: queue.filter((q) => q.status === 'uploading').length,
    done: queue.filter((q) => q.status === 'done').length,
    failed: queue.filter((q) => q.status === 'failed').length,
  };
  const isWorking = stats.queued > 0 || stats.uploading > 0;

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-[var(--ink)] leading-relaxed">
        Drop photos here from your phone, laptop, or SD card reader. They land in the live gallery within seconds.
        For mid-shoot drops use AirDrop / "Send to" → drag here.
      </p>

      {/* Dropzone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
        }}
        disabled={!isLive}
        className={[
          'w-full border-2 border-dashed transition-all px-6 py-10 flex flex-col items-center justify-center gap-2 cursor-pointer',
          isDragging ? 'border-[var(--ink)] bg-[var(--wash-strong)]' : 'border-[var(--rule-strong)] hover:border-[var(--ink)] hover:bg-[var(--wash-strong)]/40',
          !isLive ? 'opacity-50 cursor-not-allowed' : '',
        ].join(' ')}
        aria-label="Drop photos to upload"
      >
        <UploadCloud className="h-7 w-7 text-[var(--ink-muted)]" strokeWidth={1.5} />
        <p className="text-[13px] text-[var(--ink)] font-medium">
          {isDragging ? 'Drop to upload' : 'Drag photos here or tap to choose'}
        </p>
        <p className="text-[11px] text-[var(--ink-whisper)]">
          JPEG, HEIC, PNG, RAW · up to 80MB each · {CONCURRENCY} in parallel
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.heic,.heif,.cr2,.cr3,.nef,.arw,.orf,.rw2,.dng"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.currentTarget.value = '';
          }}
        />
      </button>

      {/* Stats + progress */}
      {queue.length > 0 && (
        <div className="border border-[var(--rule)]">
          <div className="px-3 py-2 border-b border-[var(--rule)] flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-3 text-[var(--ink-muted)]">
              {isWorking && <Loader2 className="h-3 w-3 animate-spin text-[var(--ink)]" />}
              <span><span className="text-[var(--ink)] font-medium">{stats.done}</span> done</span>
              {stats.uploading > 0 && <span><span className="text-[var(--ink)] font-medium">{stats.uploading}</span> uploading</span>}
              {stats.queued > 0 && <span><span className="text-[var(--ink)] font-medium">{stats.queued}</span> queued</span>}
              {stats.failed > 0 && <span className="text-destructive"><span className="font-medium">{stats.failed}</span> failed</span>}
            </div>
            {stats.done > 0 && !isWorking && (
              <button onClick={clearDone} className="text-[10px] uppercase tracking-widest text-[var(--ink-muted)] hover:text-[var(--ink)]">
                Clear
              </button>
            )}
          </div>
          <div className="max-h-[220px] overflow-y-auto divide-y divide-[var(--rule)]/60">
            {queue.slice().reverse().map((q) => (
              <div key={q.id} className="px-3 py-2 flex items-center gap-2 text-[11px]">
                <ImageIcon className="h-3.5 w-3.5 text-[var(--ink-muted)] shrink-0" />
                <span className="truncate flex-1 text-[var(--ink)]">{q.file.name}</span>
                <span className="text-[10px] text-[var(--ink-muted)] shrink-0">
                  {(q.file.size / (1024 * 1024)).toFixed(1)}MB
                </span>
                <span className="shrink-0">
                  {q.status === 'queued' && <span className="text-[var(--ink-whisper)]">·</span>}
                  {q.status === 'uploading' && <Loader2 className="h-3 w-3 animate-spin text-[var(--ink)]" />}
                  {q.status === 'done' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                  {q.status === 'failed' && (
                    <button
                      onClick={() => retryOne(q.id)}
                      className="inline-flex items-center gap-1 text-destructive hover:underline"
                      title={q.error}
                    >
                      <AlertCircle className="h-3 w-3" /> retry
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
