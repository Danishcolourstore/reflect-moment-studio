export function TopStats({ images }) {
  const processing = images.filter((image) => image.status === "processing").length;
  const done = images.filter((image) => image.status === "done").length;
  const failed = images.filter((image) => image.status === "failed").length;
  const total = images.length;

  const cards = [
    { label: "Live Queue", value: processing, tone: "text-sky-300" },
    { label: "Processed", value: done, tone: "text-emerald-300" },
    { label: "Failed", value: failed, tone: "text-rose-300" },
    { label: "Total Shots", value: total, tone: "text-zinc-100" },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">{card.label}</p>
          <p className={`mt-2 text-2xl font-semibold ${card.tone}`}>{card.value}</p>
        </div>
      ))}
    </section>
  );
}
