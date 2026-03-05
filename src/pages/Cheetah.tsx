import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Eye, Download, Heart, Upload, Camera, Activity, Zap, Radio, Image, Users, Clock } from 'lucide-react';

/* ── Dummy placeholder data ─────────────────────────── */

const DUMMY_ACTIVITIES = [
  { id: '1', type: 'view', user: 'Anjali M.', action: 'opened gallery', event: 'Rahul & Anjali Wedding', time: '2 min ago' },
  { id: '2', type: 'download', user: 'Priya S.', action: 'downloaded 10 photos', event: 'Rohan Pre-Wedding', time: '5 min ago' },
  { id: '3', type: 'view', user: 'Guest', action: 'viewing event', event: 'Karan & Neha Reception', time: '8 min ago' },
  { id: '4', type: 'upload', user: 'You', action: 'uploaded 24 new images', event: 'Amit Birthday Party', time: '12 min ago' },
  { id: '5', type: 'favorite', user: 'Meera K.', action: 'favorited 3 photos', event: 'Rahul & Anjali Wedding', time: '15 min ago' },
  { id: '6', type: 'view', user: 'Guest', action: 'browsing images', event: 'Rohan Pre-Wedding', time: '18 min ago' },
  { id: '7', type: 'download', user: 'Vikram P.', action: 'downloaded full gallery', event: 'Karan & Neha Reception', time: '22 min ago' },
  { id: '8', type: 'selection', user: 'Anjali M.', action: 'submitted photo selection', event: 'Rahul & Anjali Wedding', time: '30 min ago' },
  { id: '9', type: 'view', user: 'Guest', action: 'opened gallery', event: 'Amit Birthday Party', time: '45 min ago' },
  { id: '10', type: 'favorite', user: 'Rohan D.', action: 'favorited cover photo', event: 'Rohan Pre-Wedding', time: '1 hr ago' },
];

const LIVE_VIEWERS = [
  { event: 'Rahul & Anjali Wedding', viewers: 3 },
  { event: 'Rohan Pre-Wedding', viewers: 1 },
];

const EVENT_MONITORS = [
  { name: 'Rahul & Anjali Wedding', activeViewers: 3, recentDownloads: 47, totalVisitors: 128 },
  { name: 'Rohan Pre-Wedding', activeViewers: 1, recentDownloads: 12, totalVisitors: 56 },
  { name: 'Karan & Neha Reception', activeViewers: 0, recentDownloads: 8, totalVisitors: 34 },
  { name: 'Amit Birthday Party', activeViewers: 0, recentDownloads: 3, totalVisitors: 19 },
];

const TIMELINE = [
  { id: 't1', text: 'Anjali opened the wedding gallery', time: '2 min ago', dot: 'bg-accent' },
  { id: 't2', text: 'Priya downloaded 10 photos from pre-wedding', time: '5 min ago', dot: 'bg-primary' },
  { id: 't3', text: 'New guest viewing Karan & Neha Reception', time: '8 min ago', dot: 'bg-accent' },
  { id: 't4', text: '24 images uploaded to Amit Birthday Party', time: '12 min ago', dot: 'bg-primary' },
  { id: 't5', text: 'Meera favorited 3 photos', time: '15 min ago', dot: 'bg-muted-foreground/40' },
  { id: 't6', text: 'Vikram downloaded full gallery', time: '22 min ago', dot: 'bg-muted-foreground/40' },
];

/* ── Icon + color map ────────────────────────────────── */

const typeConfig: Record<string, { icon: typeof Eye; accent: string }> = {
  view:      { icon: Eye,      accent: 'text-accent' },
  download:  { icon: Download, accent: 'text-primary' },
  favorite:  { icon: Heart,    accent: 'text-destructive' },
  upload:    { icon: Upload,   accent: 'text-accent' },
  selection: { icon: Camera,   accent: 'text-primary' },
};

/* ── Component ───────────────────────────────────────── */

const Cheetah = () => {
  const [activeTab, setActiveTab] = useState<'feed' | 'events' | 'timeline'>('feed');

  const statCards = [
    { label: 'Live Viewers', value: 4, icon: Users, },
    { label: 'Downloads Today', value: 67, icon: Download },
    { label: 'Gallery Views', value: 218, icon: Eye },
    { label: 'Active Events', value: 4, icon: Camera },
  ];

  return (
    <DashboardLayout>
      {/* ── Header ──────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <Zap className="h-6 w-6 text-accent" />
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent animate-ping" />
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground tracking-tight">Cheetah</h1>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Radio className="h-3 w-3 text-accent" />
            <span>Real-time activity monitoring</span>
          </p>
        </div>
      </div>

      {/* ── Live indicator bar ──────────────────────── */}
      <div className="h-[2px] rounded-full bg-gradient-to-r from-accent via-primary to-accent mb-5 opacity-60" />

      {/* ── Live Viewers Banner ─────────────────────── */}
      {LIVE_VIEWERS.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-accent">Live Now</span>
          </div>
          <div className="space-y-2">
            {LIVE_VIEWERS.map((lv) => (
              <div key={lv.event} className="flex items-center justify-between">
                <p className="text-[13px] text-foreground">
                  <span className="font-semibold">{lv.viewers} viewer{lv.viewers !== 1 ? 's' : ''}</span>
                  {' '}currently in <span className="font-medium">{lv.event}</span>
                </p>
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats Grid ──────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {statCards.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center text-foreground">
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground font-serif">{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tab Switcher ────────────────────────────── */}
      <div className="flex gap-1 bg-secondary/50 rounded-lg p-1 mb-5">
        {([
          { key: 'feed', label: 'Live Feed', icon: Activity },
          { key: 'events', label: 'Event Monitor', icon: Image },
          { key: 'timeline', label: 'Timeline', icon: Clock },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-medium tracking-wide transition-all ${
              activeTab === tab.key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Live Activity Feed ──────────────────────── */}
      {activeTab === 'feed' && (
        <div className="space-y-2">
          {DUMMY_ACTIVITIES.map((item) => {
            const cfg = typeConfig[item.type] || typeConfig.view;
            const Icon = cfg.icon;
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:bg-secondary/30 transition-colors"
              >
                <div className={`mt-0.5 h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 ${cfg.accent}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-foreground leading-snug">
                    <span className="font-medium">{item.user}</span>{' '}{item.action}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground truncate">{item.event}</span>
                    <span className="text-[9px] text-muted-foreground/60">·</span>
                    <span className="text-[9px] text-muted-foreground/60">{item.time}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Event Monitoring Cards ──────────────────── */}
      {activeTab === 'events' && (
        <div className="space-y-3">
          {EVENT_MONITORS.map((ev) => (
            <div key={ev.name} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-medium text-foreground">{ev.name}</h3>
                {ev.activeViewers > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-[10px] text-accent font-medium">{ev.activeViewers} live</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-base font-semibold text-foreground font-serif">{ev.activeViewers}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Viewers</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-foreground font-serif">{ev.recentDownloads}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Downloads</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-foreground font-serif">{ev.totalVisitors}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Visitors</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Recent Activity Timeline ────────────────── */}
      {activeTab === 'timeline' && (
        <div className="relative pl-6">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-border rounded-full" />
          <div className="space-y-5">
            {TIMELINE.map((t) => (
              <div key={t.id} className="relative flex items-start gap-3">
                {/* Dot */}
                <div className={`absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-card ${t.dot}`} />
                <div>
                  <p className="text-[13px] text-foreground leading-snug">{t.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Placeholder notice ──────────────────────── */}
      <div className="mt-8 text-center py-4">
        <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest">UI Prototype · Live data coming soon</p>
      </div>
    </DashboardLayout>
  );
};

export default Cheetah;
