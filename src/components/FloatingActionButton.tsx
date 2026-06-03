import { Pencil } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useViewMode } from "@/lib/ViewModeContext";
import { Fab } from "@/components/Fab";

function shouldShowFab(pathname: string): boolean {
  if (pathname.startsWith("/studio/storybook")) return true;
  if (/^\/studio\/weddings\/[^/]+$/.test(pathname)) return true;
  return false;
}

export function FloatingActionButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useViewMode();

  if (!isMobile || !shouldShowFab(location.pathname)) {
    return null;
  }

  const handleClick = () => {
    if (location.pathname.startsWith("/studio/storybook")) {
      window.dispatchEvent(new CustomEvent("studio-fab:grid-edit"));
      return;
    }
    const id = location.pathname.split("/").pop();
    if (id) navigate(`/dashboard/events/${id}`);
  };

  return (
    <Fab
      onClick={handleClick}
      aria-label="Edit"
      icon={<Pencil className="h-5 w-5" strokeWidth={1.5} />}
      className="fixed right-5 bottom-[calc(80px+env(safe-area-inset-bottom))]"
    />
  );
}
