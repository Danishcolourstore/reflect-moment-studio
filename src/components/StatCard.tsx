interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="border border-border bg-card px-4 py-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-medium">{label}</p>
        <span className="text-muted-foreground/30">{icon}</span>
      </div>
      <p className="mt-2 font-serif text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
