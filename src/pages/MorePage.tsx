import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Users, Palette, Settings, CreditCard, LogOut,
  Briefcase, BarChart2, Globe, Grid3X3, BookOpen,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

interface MenuItem {
  label: string;
  icon: typeof Grid3X3;
  route: string;
}

const SECTIONS: { title: string; items: MenuItem[] }[] = [
  {
    title: "Create",
    items: [
      { label: "Grid Builder", icon: Grid3X3, route: "/studio/storybook" },
      { label: "Albums", icon: BookOpen, route: "/dashboard/album-designer" },
    ],
  },
  {
    title: "Manage",
    items: [
      { label: "Clients", icon: Users, route: "/dashboard/clients" },
      { label: "Website", icon: Globe, route: "/dashboard/website-builder" },
      { label: "Analytics", icon: BarChart2, route: "/dashboard/analytics" },
      { label: "Business Suite", icon: Briefcase, route: "/dashboard/business" },
      { label: "Brand Studio", icon: Palette, route: "/dashboard/branding" },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Settings", icon: Settings, route: "/dashboard/profile" },
      { label: "Billing", icon: CreditCard, route: "/dashboard/billing" },
    ],
  },
];

const MorePage = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem("mirrorai_access_verified");
    window.location.href = "/login";
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-xl font-medium text-ink">Studio</h1>
      </div>

      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-1 text-2xs font-medium tracking-wide text-ink-tertiary">
              {section.title}
            </p>
            <div className="overflow-hidden rounded-lg border border-rule">
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.route)}
                  className={cn(
                    "flex w-full items-center gap-4 bg-card px-4 py-3.5",
                    "transition-colors duration-fast active:scale-[0.99] active:bg-wash",
                    "hover:bg-wash",
                    i < section.items.length - 1 && "border-b border-rule",
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-wash-strong">
                    <item.icon className="h-[18px] w-[18px] text-ink-muted" strokeWidth={1.5} />
                  </div>
                  <span className="text-[14px] font-medium text-ink">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Theme + Sign out */}
        <div>
          <ThemeToggle />

          <div className="mt-3 overflow-hidden rounded-lg border border-error/20">
            <button
              onClick={handleLogout}
              className={cn(
                "flex w-full items-center gap-4 bg-card px-4 py-3.5",
                "transition-colors duration-fast active:scale-[0.99]",
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-error/10">
                <LogOut className="h-[18px] w-[18px] text-error" strokeWidth={1.5} />
              </div>
              <span className="text-[14px] font-medium text-error">
                Sign out
              </span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MorePage;
