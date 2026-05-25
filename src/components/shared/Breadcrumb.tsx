interface BreadcrumbProps {
  items: string[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div className="h-10 bg-white border-b border-[#E5D5CD] flex items-center px-4 -mx-4 -mt-4 mb-4">
      <div className="flex items-center gap-1 text-[13px]">
        {items.map((item, index) => (
          <span key={index} className="flex items-center gap-1">
            {index > 0 && <span className="text-[#D6D3D0] mx-1">/</span>}
            <span className={index === items.length - 1 ? "text-[#2D1F1F] font-semibold" : "text-[#9A8B8B]"}>
              {item}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
