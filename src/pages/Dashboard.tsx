import { useEffect, useState } from "react";

// ─────────────────────────────────────
// TYPES
// ─────────────────────────────────────

type Stage = "ingest_done" | "culling" | "retouch" | "story_ready" | "delivered" | "upcoming";

type Wedding = {
  id: number;
  name: string;
  stage: Stage;
  totalPhotos: number;
  processed: number;
  deliveryDueHours?: number;
  daysToShoot?: number;
};

// ─────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────

const initialData: Wedding[] = [
  {
    id: 1,
    name: "Mitchell Wedding",
    stage: "retouch",
    totalPhotos: 312,
    processed: 284,
    deliveryDueHours: 18,
  },
  {
    id: 2,
    name: "Nair Wedding",
    stage: "ingest_done",
    totalPhotos: 1203,
    processed: 0,
    deliveryDueHours: 48,
  },
  {
    id: 3,
    name: "Rossi Wedding",
    stage: "upcoming",
    totalPhotos: 0,
    processed: 0,
    daysToShoot: 3,
  },
];

// ─────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────

export default function Dashboard() {
  const [weddings, setWeddings] = useState<Wedding[]>(initialData);
  const [autoMode] = useState(true);

  // ─────────────────────────────────────
  // AUTO ENGINE
  // ─────────────────────────────────────

  const runEngine = () => {
    if (!autoMode) return;

    setWeddings((prev) =>
      prev.map((w) => {
        // Auto start culling
        if (w.stage === "ingest_done" && w.totalPhotos > 300) {
          return { ...w, stage: "culling" };
        }

        // Simulate culling → retouch
        if (w.stage === "culling") {
          return { ...w, stage: "retouch", processed: 0 };
        }

        // Retouch progress
        if (w.stage === "retouch") {
          const next = w.processed + Math.floor(Math.random() * 10);

          if (next >= w.totalPhotos) {
            return { ...w, stage: "story_ready", processed: w.totalPhotos };
          }

          return { ...w, processed: next };
        }

        return w;
      }),
    );
  };

  // ─────────────────────────────────────
  // LOOP
  // ─────────────────────────────────────

  useEffect(() => {
    const interval = setInterval(runEngine, 1200);
    return () => clearInterval(interval);
  }, []);

  // ─────────────────────────────────────
  // DERIVED STATE
  // ─────────────────────────────────────

  const getPulse = () => {
    const processing = weddings.filter((w) => w.stage === "retouch").length;
    const urgent = weddings.filter((w) => w.deliveryDueHours && w.deliveryDueHours < 24).length;

    return `${processing} processing · ${urgent} urgent · AI active`;
  };

  const getSuggestions = () => {
    const list: any[] = [];

    weddings.forEach((w) => {
      if (w.stage === "ingest_done") {
        list.push({
          text: `${w.totalPhotos} photos ready — AI culling`,
          sub: "Running automatically",
          priority: 1,
        });
      }

      if (w.stage === "story_ready") {
        list.push({
          text: `Story ready for ${w.name}`,
          sub: "Generating preview",
          priority: 2,
        });
      }

      if (w.deliveryDueHours && w.deliveryDueHours < 24) {
        list.push({
          text: `${w.name} delivery due in ${w.deliveryDueHours}h`,
          sub: "High priority",
          priority: 0,
        });
      }
    });

    return list.sort((a, b) => a.priority - b.priority).slice(0, 3);
  };

  // ─────────────────────────────────────
  // UI
  // ─────────────────────────────────────

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-10">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-light">MirrorAI</h1>
        <p className="text-xs text-gray-400 mt-2">{getPulse()}</p>
      </div>

      {/* PIPELINE */}
      <div className="grid grid-cols-5 gap-4 text-center text-xs uppercase tracking-widest text-gray-400">
        {["Ingest", "Cull", "Retouch", "Story", "Deliver"].map((s) => (
          <div key={s} className="space-y-2">
            <div className="w-4 h-4 rounded-full border border-gray-500 mx-auto" />
            <p>{s}</p>
          </div>
        ))}
      </div>

      {/* JOBS */}
      <div className="space-y-3">
        {weddings.map((w) => (
          <div key={w.id} className="flex justify-between items-center border border-gray-800 p-4">
            <div>
              <p className="text-lg">{w.name}</p>
              <p className="text-xs text-gray-500">{w.stage}</p>
            </div>

            <div className="text-xs text-gray-400">
              {w.stage === "retouch" && (
                <span>
                  {w.processed} / {w.totalPhotos}
                </span>
              )}
              {w.stage === "upcoming" && <span>{w.daysToShoot} days</span>}
            </div>
          </div>
        ))}
      </div>

      {/* SUGGESTIONS */}
      <div>
        <p className="text-xs tracking-widest text-gray-500 mb-4">MirrorAI Suggests</p>

        <div className="space-y-2">
          {getSuggestions().map((s, i) => (
            <div key={i} className="border border-gray-800 p-4 flex justify-between">
              <div>
                <p className="text-sm">{s.text}</p>
                <p className="text-xs text-gray-500">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs text-gray-500">Hours Saved</p>
          <p className="text-3xl font-light">140</p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Photos Delivered</p>
          <p className="text-3xl font-light">24k</p>
        </div>
      </div>
    </div>
  );
}
