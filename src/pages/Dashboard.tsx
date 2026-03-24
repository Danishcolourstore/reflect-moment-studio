import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Camera, Image, Eye, Download, Plus, Upload, Sparkles, X } from "lucide-react";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto space-y-6">
        {/* ─── HEADER ─── */}
        <div className="space-y-2">
          <p className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase">Good Evening</p>

          <h1
            className="text-4xl"
            style={{
              fontFamily: "Cormorant Garamond, serif",
              fontWeight: 400,
              fontStyle: "italic",
            }}
          >
            Creator
          </h1>

          <p className="text-sm text-muted-foreground">Clients are viewing your work.</p>
        </div>

        {/* ─── ACTION BUTTONS ─── */}
        <div className="flex gap-3">
          <Button
            className="flex-1 h-12 rounded-xl"
            style={{
              background: "#E8C97A",
              color: "#000",
              fontSize: "11px",
              letterSpacing: "0.14em",
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            NEW EVENT
          </Button>

          <Button
            variant="outline"
            className="flex-1 h-12 rounded-xl border"
            style={{
              borderColor: "#E8C97A",
              color: "#E8C97A",
              fontSize: "11px",
              letterSpacing: "0.14em",
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            UPLOAD
          </Button>
        </div>

        {/* ─── STATS GRID ─── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Events", value: "4", icon: Camera },
            { label: "Photos", value: "71", icon: Image },
            { label: "Views", value: "3", icon: Eye },
            { label: "Downloads", value: "0", icon: Download },
          ].map((item, i) => (
            <div
              key={i}
              className="rounded-2xl p-5"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
                <item.icon className="h-4 w-4 text-[#E8C97A]" />
                {item.label}
              </div>

              <p
                className="mt-4 text-4xl"
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                }}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* ─── STUDIO BRAIN ─── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-[#E8C97A]" />
            <span>Studio Brain</span>
          </div>

          {[1, 2, 3].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl p-4 relative"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {/* LEFT GOLD LINE */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl" style={{ background: "#E8C97A" }} />

              <button className="absolute right-3 top-3 opacity-40">
                <X className="h-4 w-4" />
              </button>

              <p className="text-sm font-medium">Gallery ready to share</p>

              <p className="text-xs text-muted-foreground mt-1">This gallery hasn’t been viewed yet.</p>

              <div className="flex gap-3 mt-4">
                <button
                  className="px-4 py-2 rounded-lg text-xs"
                  style={{
                    background: "#E8C97A",
                    color: "#000",
                  }}
                >
                  Take Action
                </button>

                <button className="text-xs text-muted-foreground">Dismiss</button>
              </div>
            </div>
          ))}
        </div>

        {/* ─── EVENT PROGRESS (MINIMAL) ─── */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Event Progress</p>

          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <p
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: "18px",
              }}
            >
              Active Event
            </p>

            <p className="text-xs text-muted-foreground">Processing · 120 photos</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
