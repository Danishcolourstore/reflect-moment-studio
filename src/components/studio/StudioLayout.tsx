import { ReactNode } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";

export function StudioLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
