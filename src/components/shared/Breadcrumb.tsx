import { LC } from '@/lib/lute-colors';

interface BreadcrumbProps {
  items: string[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div className="h-10 bg-white flex items-center px-4 -mx-4 -mt-4 mb-4" style={{ borderBottom: `1px solid ${LC.border}`, background: LC.card }}>
      <div className="flex items-center gap-1 text-[13px]">
        {items.map((item, index) => (
          <span key={index} className="flex items-center gap-1">
            {index > 0 && <span className="mx-1" style={{ color: LC.borderStrong }}>/</span>}
            <span style={index === items.length - 1 ? { color: LC.text, fontWeight: 600 } : { color: LC.textMuted }}>
              {item}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
