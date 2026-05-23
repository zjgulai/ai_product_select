import { useState, useEffect, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';

interface VirtualListProps<T> {
  items: T[];
  /** 每行固定高度（px）。复杂行高时需调高估计值 */
  rowHeight: number;
  /** 容器高度（px） */
  height: number;
  /** 缓冲行数（视口外提前/延后渲染） */
  overscan?: number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  /** 列表项 key 函数 */
  getKey?: (item: T, index: number) => string | number;
}

/**
 * VirtualList —— 极简虚拟滚动列表
 *
 * 仅渲染视口内 + 缓冲区域的项，适合大数据量列表（>500 行）。
 * 行高需固定。
 */
export default function VirtualList<T>({
  items,
  rowHeight,
  height,
  overscan = 5,
  renderItem,
  className,
  getKey,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => setScrollTop(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const { start, end, totalHeight } = useMemo(() => {
    const total = items.length * rowHeight;
    const visibleCount = Math.ceil(height / rowHeight);
    const startIdx = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endIdx = Math.min(items.length, startIdx + visibleCount + overscan * 2);
    return { start: startIdx, end: endIdx, totalHeight: total };
  }, [items.length, rowHeight, height, overscan, scrollTop]);

  const visibleItems = items.slice(start, end);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height, overflowY: 'auto', position: 'relative' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: start * rowHeight,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, i) => (
            <div
              key={getKey ? getKey(item, start + i) : start + i}
              style={{ height: rowHeight }}
            >
              {renderItem(item, start + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
