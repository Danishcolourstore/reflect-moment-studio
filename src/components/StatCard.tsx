interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="bg-card px-5 py-4 animate-fade-in">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 font-medium">{label}</p>
        <span className="text-muted-foreground/20">{icon}</span>
      </div>
      <p className="font-serif text-[28px] font-semibold text-foreground leading-none">{value}</p>
    </div>
  );
}
