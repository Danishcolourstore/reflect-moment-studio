import { DashboardLayout } from '@/components/DashboardLayout';
import { Zap, Radio, Eye, MessageSquare, Bell, Sparkles } from 'lucide-react';

const CheetahLive = () => {
  return (
    <DashboardLayout>
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center pt-6 pb-8">
        <div className="relative mb-6">
          <div className="h-28 w-28 rounded-full bg-secondary flex items-center justify-center">
            <Zap className="h-14 w-14 text-accent" strokeWidth={1.5} />
          </div>
          <span className="absolute top-2 right-2 h-4 w-4 rounded-full bg-accent animate-ping" />
          <span className="absolute top-2 right-2 h-4 w-4 rounded-full bg-accent" />
        </div>

        <h1
          className="text-foreground mb-2"
          style={{ fontFamily: 'var(--editorial-heading)', fontSize: '28px', fontWeight: 400, letterSpacing: '-0.3px' }}
        >
          Cheetah Live
        </h1>
        <p className="text-muted-foreground text-[13px] max-w-[280px] leading-relaxed">
          Real-time tools and smart activity for photographers.
        </p>
      </div>

      {/* Divider */}
      <div className="h-[2px] rounded-full bg-gradient-to-r from-accent via-primary to-accent mb-6 opacity-40" />

      {/* Placeholder Card */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Radio className="h-4 w-4 text-accent" />
          <span className="text-[10px] font-medium uppercase tracking-widest text-accent">Coming Soon</span>
        </div>

        <p className="text-foreground text-[14px] font-medium mb-4" style={{ fontFamily: 'var(--editorial-heading)' }}>
          Cheetah Live features will appear here.
        </p>

        <p className="text-muted-foreground text-[12px] leading-relaxed mb-5">
          This section will later integrate:
        </p>

        <div className="space-y-3">
          {[
            { icon: Eye, label: 'Live gallery activity' },
            { icon: MessageSquare, label: 'Real-time client interactions' },
            { icon: Bell, label: 'Instant notifications' },
            { icon: Sparkles, label: 'AI powered tools' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <span className="text-[12px] text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center py-4">
        <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest">Cheetah Live · More features coming soon</p>
      </div>
    </DashboardLayout>
  );
};

export default CheetahLive;
