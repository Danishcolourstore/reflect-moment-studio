interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="bg-card rounded-xl px-6 py-6 border border-border/40">
      <div className="flex items-center justify-between mb-3">
        <p
          className="text-[8px] uppercase tracking-[0.2em] text-muted-foreground/50 font-medium"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {label}
        </p>
        <span className="text-muted-foreground/15">{icon}</span>
      </div>
      <p className="font-serif text-[34px] text-foreground leading-none tracking-tight" style={{ fontWeight: 300 }}>{value}</p>
    </div>
  );
}
