interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className="text-muted-foreground/50">{icon}</span>
      </div>
      <p className="mt-3 font-serif text-3xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
