import clsx from 'clsx';
import type { ShootCategory } from '../types/mirror';

const allCategories: ShootCategory[] = [
  'wedding',
  'portrait',
  'fashion',
  'event',
  'commercial',
  'other',
];

interface Props {
  active: ShootCategory | 'all';
  onSelect: (category: ShootCategory | 'all') => void;
}

export const CategoryFilter = ({ active, onSelect }: Props) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className={clsx(
          'rounded-full border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] transition',
          active === 'all'
            ? 'border-indigo-300/50 bg-indigo-400/20 text-indigo-100'
            : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10',
        )}
        onClick={() => onSelect('all')}
      >
        All
      </button>

      {allCategories.map((category) => (
        <button
          type="button"
          key={category}
          className={clsx(
            'rounded-full border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] transition',
            active === category
              ? 'border-indigo-300/50 bg-indigo-400/20 text-indigo-100'
              : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10',
          )}
          onClick={() => onSelect(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
};
