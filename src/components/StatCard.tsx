interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="bg-card rounded-[14px] px-7 py-7 border border-border/20">
      <div className="flex items-center justify-between mb-4">
        <p
          className="text-[8px] uppercase tracking-[0.22em] text-muted-foreground/45 font-medium"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {label}
        </p>
        <span className="text-muted-foreground/12">{icon}</span>
      </div>
      <p
        className="text-[36px] text-foreground leading-none tracking-tight"
        style={{ fontFamily: "'Playfair Display', serif", fontWeight: 300 }}
      >
        {value}
      </p>
    </div>
  );
}
