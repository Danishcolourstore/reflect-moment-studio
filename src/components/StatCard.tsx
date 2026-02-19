interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="bg-card px-5 py-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60 font-medium">{label}</p>
        <span className="text-muted-foreground/15">{icon}</span>
      </div>
      <p className="font-serif text-[32px] font-semibold text-foreground leading-none tracking-tight">{value}</p>
    </div>
  );
}
