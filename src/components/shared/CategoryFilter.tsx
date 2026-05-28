import { useState } from 'react';
import { CATEGORIES } from '@/data/mockData';
import { LC } from '@/lib/lute-colors';

interface CategoryFilterProps {
  onChange?: (selected: string[]) => void;
}

export default function CategoryFilter({ onChange }: CategoryFilterProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (cat: string) => {
    const next = selected.includes(cat)
      ? selected.filter(c => c !== cat)
      : [...selected, cat];
    setSelected(next);
    onChange?.(next);
  };

  return (
    <div className="bg-white p-3 border-b" style={{ borderColor: LC.border, background: LC.card }}>
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-xs font-medium shrink-0" style={{ color: LC.textSecondary }}>商品类目:</span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => toggle(cat)}
            className="px-2.5 h-[22px] rounded-full text-[11px] transition-all duration-150 border font-medium"
            style={
              selected.includes(cat)
                ? { backgroundColor: LC.primary, color: LC.textInverse, borderColor: LC.primary }
                : { backgroundColor: LC.card, color: LC.textSecondary, borderColor: LC.border }
            }
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
