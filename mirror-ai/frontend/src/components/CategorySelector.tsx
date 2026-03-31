import type { ShootCategory } from "../types";

const categories: ShootCategory[] = [
  "portrait",
  "wedding",
  "studio",
  "fashion",
  "event",
  "product",
];

interface Props {
  value: ShootCategory;
  onChange: (next: ShootCategory) => void;
}

export function CategorySelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const active = value === category;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-wider transition ${
              active
                ? "border-accent-500 bg-accent-500/15 text-white"
                : "border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:border-zinc-500"
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
