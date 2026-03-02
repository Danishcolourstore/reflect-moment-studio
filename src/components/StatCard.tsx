interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="py-7 px-2">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-muted-foreground/15">{icon}</span>
        <p className="editorial-label">{label}</p>
      </div>
      <p
        className="text-[40px] text-foreground leading-none tracking-tight font-serif"
        style={{ fontWeight: 300 }}
      >
        {value}
      </p>
    </div>
  );
}
