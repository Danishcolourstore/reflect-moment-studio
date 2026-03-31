import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ImageIcon,
  Layers,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import type { Preset, PresetKey, ShootCategory } from "./types";
import { api } from "./lib/api";
import { useRealtimeData } from "./lib/useRealtimeData";
import { ConnectionBadge } from "./components/ConnectionBadge";
import { StatusBadge } from "./components/StatusBadge";
import { StatCard } from "./components/StatCard";
import { PresetSelector } from "./components/PresetSelector";
import { CategorySelector } from "./components/CategorySelector";
import { BeforeAfterCard } from "./components/BeforeAfterCard";

export default function App() {
  const { images, settings, setSettings, connectionState, stats } = useRealtimeData();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const loadPresets = async () => {
      try {
        const res = await api.getPresets();
        setPresets(res.items);
      } catch (error) {
        console.error(error);
      }
    };
    void loadPresets();
  }, []);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const canBatch = selectedIds.length > 0 && !!settings;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const updateSettings = async (patch: {
    preset?: PresetKey;
    retouchIntensity?: number;
    category?: ShootCategory;
  }) => {
    if (!settings) {
      return;
    }
    const optimistic = { ...settings, ...patch };
    setSettings(optimistic);
    try {
      const next = await api.patchSettings(patch);
      setSettings(next);
    } catch (error) {
      console.error(error);
      setSettings(settings);
    }
  };

  const reprocessOne = async (id: string) => {
    if (!settings) {
      return;
    }
    setWorking(true);
    try {
      await api.reprocessImage(id, settings);
    } catch (error) {
      console.error(error);
    } finally {
      setWorking(false);
    }
  };

  const applyBatch = async () => {
    if (!settings || selectedIds.length === 0) {
      return;
    }
    setWorking(true);
    try {
      await api.applyBatch({
        imageIds: selectedIds,
        preset: settings.preset,
        retouchIntensity: settings.retouchIntensity,
        category: settings.category,
      });
      setSelectedIds([]);
    } catch (error) {
      console.error(error);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="lux-grid min-h-screen p-4 text-zinc-100 md:p-8">
      <div className="mx-auto grid w-full max-w-[1500px] gap-6 xl:grid-cols-[380px_1fr]">
        <aside className="space-y-6">
          <section className="glass rounded-3xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Mirror AI</p>
                <h1 className="mt-2 text-2xl font-semibold">Real-time Photography Assistant</h1>
              </div>
              <ConnectionBadge value={connectionState} />
            </div>
            <p className="mt-3 text-sm text-zinc-400">
              Camera uploads via FTP are auto-processed and pushed instantly to this feed.
            </p>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <StatCard label="Live Photos" value={stats.total} />
            <StatCard label="Processing" value={stats.processing} />
            <StatCard label="Completed" value={stats.done} />
            <StatCard label="Failed" value={stats.failed} />
          </section>

          <section className="glass space-y-4 rounded-3xl p-6">
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <Sparkles className="h-4 w-4" /> Live Presets
            </div>
            {settings ? (
              <PresetSelector
                presets={presets}
                value={settings.preset}
                onChange={(preset) => void updateSettings({ preset })}
              />
            ) : (
              <p className="text-sm text-zinc-400">Loading presets...</p>
            )}
          </section>

          <section className="glass space-y-4 rounded-3xl p-6">
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <WandSparkles className="h-4 w-4" /> Natural Retouch
            </div>
            <div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={settings?.retouchIntensity ?? 0}
                onChange={(e) => void updateSettings({ retouchIntensity: Number(e.target.value) })}
                className="w-full accent-violet-500"
              />
              <div className="mt-2 flex justify-between text-xs text-zinc-400">
                <span>Subtle</span>
                <span>{Math.round((settings?.retouchIntensity ?? 0) * 100)}%</span>
                <span>Strong</span>
              </div>
            </div>
            {settings && (
              <CategorySelector value={settings.category} onChange={(category) => void updateSettings({ category })} />
            )}
          </section>

          <section className="glass space-y-3 rounded-3xl p-6">
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <Layers className="h-4 w-4" /> Batch Controls
            </div>
            <button
              type="button"
              disabled={!canBatch || working}
              onClick={() => void applyBatch()}
              className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-zinc-700"
            >
              {working ? "Applying..." : `Apply current preset to ${selectedIds.length} selected`}
            </button>
            <p className="text-xs text-zinc-500">
              Select images from the live feed and apply edits asynchronously.
            </p>
          </section>
        </aside>

        <main className="space-y-6">
          <section className="glass rounded-3xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-violet-300" />
                <h2 className="text-lg font-semibold">Live Feed</h2>
              </div>
              <p className="text-sm text-zinc-400">No refresh needed. Updates stream in via WebSocket.</p>
            </div>
          </section>

          {images.length === 0 ? (
            <section className="glass flex min-h-[420px] flex-col items-center justify-center rounded-3xl p-10 text-center">
              <ImageIcon className="h-10 w-10 text-zinc-500" />
              <h3 className="mt-4 text-xl font-semibold">Waiting for uploads</h3>
              <p className="mt-2 max-w-md text-sm text-zinc-400">
                Send photos to the configured FTP endpoint. Mirror AI will ingest, process, and display them instantly.
              </p>
            </section>
          ) : (
            <section className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
              {images.map((image) => (
                <article key={image.id} className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-400">
                      <input
                        type="checkbox"
                        checked={selectedSet.has(image.id)}
                        onChange={() => toggleSelect(image.id)}
                      />
                      select
                    </label>
                    <StatusBadge value={image.status} />
                  </div>
                  <BeforeAfterCard image={image} />
                  <div className="glass rounded-xl p-3 text-xs text-zinc-400">
                    <div className="flex items-center justify-between">
                      <span>Preset: {image.preset}</span>
                      <span>{Math.round(image.retouchIntensity * 100)}% retouch</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span>Category: {image.category}</span>
                      <button
                        type="button"
                        disabled={working}
                        onClick={() => void reprocessOne(image.id)}
                        className="rounded-md border border-zinc-700 px-2 py-1 text-zinc-200 transition hover:border-zinc-500 disabled:opacity-50"
                      >
                        Reprocess
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
