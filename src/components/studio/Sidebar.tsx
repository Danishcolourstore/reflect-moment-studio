import { CalendarDays, Image, Scissors, Grid3X3, Heart } from "lucide-react";

export const STUDIO_NAV_ITEMS = [
  { title: "Events", url: "/dashboard/events", icon: CalendarDays },
  { title: "Gallery", url: "/home", icon: Image, end: true as const },
  { title: "Grid Studio", url: "/studio/storybook", icon: Grid3X3 },
  { title: "Favorites", url: "/studio/audience", icon: Heart },
  { title: "Cull", url: "/dashboard/cheetah-live", icon: Scissors },
] as const;
