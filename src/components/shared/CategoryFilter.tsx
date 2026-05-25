import { useState } from 'react';
import { CATEGORIES } from '@/data/mockData';

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
    <div className="bg-white p-3 border-b border-[#E2E2DE]">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-xs text-[#7A6B6B] font-medium shrink-0">商品类目:</span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => toggle(cat)}
            className="px-2.5 h-[22px] rounded-full text-[11px] transition-all duration-150 border font-medium"
            style={
              selected.includes(cat)
                ? { backgroundColor: '#8B354A', color: '#fff', borderColor: '#8B354A' }
                : { backgroundColor: '#fff', color: '#7A6B6B', borderColor: '#E5D5CD' }
            }
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
