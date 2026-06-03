import { LayoutDashboard, Heart, Grid3X3, Scissors, Settings, CalendarDays } from "lucide-react";

export const STUDIO_NAV_ITEMS = [
  { title: "Overview", url: "/studio/overview", icon: LayoutDashboard, end: true as const },
  { title: "Weddings", url: "/studio/weddings", icon: CalendarDays },
  { title: "Grid Studio", url: "/studio/storybook", icon: Grid3X3 },
  { title: "Favorites", url: "/studio/audience", icon: Heart },
  { title: "Settings", url: "/studio/settings", icon: Settings },
  { title: "Cull", url: "/dashboard/cheetah-live", icon: Scissors },
] as const;
