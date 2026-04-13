import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useDeviceDetect } from "@/hooks/use-device-detect";
import { toast } from "sonner";
import {
  Plus,
  BookOpen,
  Trash2,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Calendar,
  Layers,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import NewAlbumWizard from "@/components/album-designer/NewAlbumWizard";
import type { AlbumSize, CoverType } from "@/components/album-designer/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  review: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  print: "bg-blue-100 text-blue-800",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  review: "In Review",
  approved: "Approved",
  print: "Sent to Print",
};

interface AlbumRow {
  id: string;
  name: string;
  size: string;
  cover_type: string;
  leaf_count: number;
  page_count: number;
  status: string;
  event_id: string | null;
  share_token: string | null;
  created_at: string;
  updated_at: string;
}

export default function AlbumDesigner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const device = useDeviceDetect();
  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchAlbums = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("albums")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) {
      toast.error("Failed to load albums");
      console.error(error);
    } else {
      setAlbums((data || []) as AlbumRow[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  const handleCreate = async (data: { name: string; size: AlbumSize; leafCount: number; coverType: CoverType }) => {
    if (!user) return;
    setCreating(true);
    const pageCount = data.leafCount * 2;

    const { data: album, error } = await supabase
      .from("albums")
      .insert({
        user_id: user.id,
        name: data.name,
        size: data.size,
        cover_type: data.coverType,
        leaf_count: data.leafCount,
        page_count: pageCount,
      })
      .select()
      .single();

    if (error || !album) {
      toast.error("Failed to create album");
      setCreating(false);
      return;
    }

    const pages = [];
    pages.push({ album_id: album.id, page_number: 0, spread_index: 0 });
    for (let i = 1; i <= pageCount; i++) {
      pages.push({
        album_id: album.id,
        page_number: i,
        spread_index: Math.ceil(i / 2),
      });
    }

    const { error: pagesError } = await supabase.from("album_pages").insert(pages);
    if (pagesError) console.error("Failed to create pages:", pagesError);

    toast.success(`Album "${data.name}" created with ${data.leafCount} leaves`);
    setCreating(false);
    setWizardOpen(false);
    fetchAlbums();
  };

  const handleDuplicate = async (album: AlbumRow) => {
    if (!user) return;
    const { error } = await supabase.from("albums").insert({
      user_id: user.id,
      event_id: album.event_id,
      name: `${album.name} (Copy)`,
      size: album.size,
      cover_type: album.cover_type,
      leaf_count: album.leaf_count,
      page_count: album.page_count,
    });
    if (error) toast.error("Failed to duplicate");
    else {
      toast.success("Album duplicated");
      fetchAlbums();
    }
  };

  const handleDelete = async (album: AlbumRow) => {
    const { error } = await supabase.from("albums").delete().eq("id", album.id);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Album deleted");
      fetchAlbums();
    }
  };

  /* ─── MOBILE CARD LAYOUT ─── */
  const renderMobileList = () => (
    <div className="space-y-3">
      {albums.map((album) => (
        <div
          key={album.id}
          onClick={() => navigate(`/dashboard/album-designer/${album.id}/editor`)}
          style={{
            backgroundColor: "#FDFCFB",
            border: "1px solid #e7e5e4",
            borderRadius: "4px",
            padding: "16px",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              style={{
                height: "48px",
                width: "48px",
                borderRadius: "4px",
                backgroundColor: "rgba(200,169,126,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Layers style={{ height: "24px", width: "24px", color: "#C8A97E" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 600,
                    fontSize: "15px",
                    color: "#1c1917",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {album.name}
                </h3>
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        style={{
                          height: "32px",
                          width: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "4px",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <MoreHorizontal style={{ height: "16px", width: "16px", color: "#a8a29e" }} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/dashboard/album-designer/${album.id}/editor`)}>
                        <ExternalLink className="h-4 w-4 mr-2" /> Open Editor
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(album)}>
                        <Copy className="h-4 w-4 mr-2" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(album)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge variant="secondary" className={cn("text-[10px] h-5", STATUS_COLORS[album.status] || "")}>
                  {STATUS_LABELS[album.status] || album.status}
                </Badge>
                <span style={{ fontSize: "10px", color: "#a8a29e" }}>{album.size}"</span>
                <span style={{ fontSize: "10px", color: "#a8a29e" }}>•</span>
                <span style={{ fontSize: "10px", color: "#a8a29e" }}>{album.leaf_count} leaves</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                <Calendar style={{ height: "12px", width: "12px", color: "#a8a29e" }} />
                <span style={{ fontSize: "10px", color: "#a8a29e" }}>
                  {format(new Date(album.updated_at), "MMM d, yyyy")}
                </span>
              </div>
            </div>
            <ChevronRight
              style={{ height: "16px", width: "16px", color: "#a8a29e", flexShrink: 0, marginTop: "4px" }}
            />
          </div>
        </div>
      ))}
    </div>
  );

  /* ─── DESKTOP TABLE LAYOUT ─── */
  const renderDesktopTable = () => (
    <div
      style={{
        borderRadius: "4px",
        border: "1px solid #e7e5e4",
        backgroundColor: "#FDFCFB",
        overflow: "hidden",
      }}
    >
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent" style={{ borderBottom: "1px solid #e7e5e4" }}>
            <TableHead
              style={{ color: "#a8a29e", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", fontWeight: 500 }}
            >
              Album
            </TableHead>
            <TableHead
              className="hidden sm:table-cell"
              style={{ color: "#a8a29e", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", fontWeight: 500 }}
            >
              Size
            </TableHead>
            <TableHead
              className="hidden md:table-cell"
              style={{ color: "#a8a29e", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", fontWeight: 500 }}
            >
              Pages
            </TableHead>
            <TableHead
              className="hidden md:table-cell"
              style={{ color: "#a8a29e", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", fontWeight: 500 }}
            >
              Cover
            </TableHead>
            <TableHead
              className="hidden lg:table-cell"
              style={{ color: "#a8a29e", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", fontWeight: 500 }}
            >
              Last Edited
            </TableHead>
            <TableHead
              style={{ color: "#a8a29e", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", fontWeight: 500 }}
            >
              Status
            </TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {albums.map((album) => (
            <TableRow
              key={album.id}
              className="group cursor-pointer"
              style={{ borderBottom: "1px solid #f5f5f4" }}
              onClick={() => navigate(`/dashboard/album-designer/${album.id}/editor`)}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      height: "40px",
                      width: "40px",
                      borderRadius: "4px",
                      backgroundColor: "rgba(200,169,126,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Layers style={{ height: "20px", width: "20px", color: "#C8A97E" }} />
                  </div>
                  <span
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontWeight: 600,
                      fontSize: "15px",
                      color: "#1c1917",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "200px",
                    }}
                  >
                    {album.name}
                  </span>
                </div>
              </TableCell>
              <TableCell
                className="hidden sm:table-cell"
                style={{ color: "#a8a29e", fontFamily: "'DM Sans', sans-serif", fontSize: "13px" }}
              >
                {album.size}"
              </TableCell>
              <TableCell
                className="hidden md:table-cell"
                style={{ color: "#a8a29e", fontFamily: "'DM Sans', sans-serif", fontSize: "13px" }}
              >
                {album.leaf_count} Leaf / {album.page_count} Pages
              </TableCell>
              <TableCell
                className="hidden md:table-cell"
                style={{
                  color: "#a8a29e",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "13px",
                  textTransform: "capitalize",
                }}
              >
                {album.cover_type}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Calendar style={{ height: "14px", width: "14px", color: "#a8a29e" }} />
                  <span style={{ color: "#a8a29e", fontFamily: "'DM Sans', sans-serif", fontSize: "13px" }}>
                    {format(new Date(album.updated_at), "MMM d, yyyy")}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={STATUS_COLORS[album.status] || ""}>
                  {STATUS_LABELS[album.status] || album.status}
                </Badge>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/dashboard/album-designer/${album.id}/editor`)}>
                      <ExternalLink className="h-4 w-4 mr-2" /> Open Editor
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicate(album)}>
                      <Copy className="h-4 w-4 mr-2" /> Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(album)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <DashboardLayout>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }} className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "#1c1917",
                fontSize: device.isPhone ? "20px" : "28px",
              }}
            >
              Album Designer
            </h1>
            {!device.isPhone && (
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "14px",
                  color: "#a8a29e",
                  marginTop: "4px",
                }}
              >
                Design professional wedding albums and photobooks
              </p>
            )}
          </div>

          <button
            onClick={() => setWizardOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#C8A97E",
              color: "#FDFCFB",
              border: "none",
              borderRadius: "4px",
              padding: device.isPhone ? "0" : "10px 20px",
              height: device.isPhone ? "40px" : "40px",
              width: device.isPhone ? "40px" : "auto",
              justifyContent: "center",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <Plus style={{ height: "16px", width: "16px" }} />
            {!device.isPhone && <span>New Album</span>}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div
              style={{
                height: "24px",
                width: "24px",
                border: "2px solid #C8A97E",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
              }}
            />
          </div>
        ) : albums.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: device.isPhone ? "64px 16px" : "80px 16px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                borderRadius: "4px",
                backgroundColor: "rgba(200,169,126,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
                height: device.isPhone ? "64px" : "80px",
                width: device.isPhone ? "64px" : "80px",
              }}
            >
              <BookOpen
                style={{
                  color: "#C8A97E",
                  opacity: 0.5,
                  height: device.isPhone ? "32px" : "40px",
                  width: device.isPhone ? "32px" : "40px",
                }}
              />
            </div>
            <h3
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 600,
                fontSize: "20px",
                color: "#1c1917",
              }}
            >
              No albums yet
            </h3>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "14px",
                color: "#a8a29e",
                marginTop: "6px",
                maxWidth: "340px",
              }}
            >
              Create your first professional album to start designing spreads.
            </p>
            <button
              onClick={() => setWizardOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#C8A97E",
                color: "#FDFCFB",
                border: "none",
                borderRadius: "4px",
                padding: "12px 24px",
                marginTop: "20px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <Plus style={{ height: "16px", width: "16px" }} />
              Create First Album
            </button>
          </div>
        ) : device.isPhone ? (
          renderMobileList()
        ) : (
          renderDesktopTable()
        )}

        <NewAlbumWizard open={wizardOpen} onOpenChange={setWizardOpen} onCreate={handleCreate} loading={creating} />
      </div>
    </DashboardLayout>
  );
}
