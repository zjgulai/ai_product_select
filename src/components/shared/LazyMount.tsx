/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface LazyMountProps {
  children: ReactNode;
  /** 占位高度，提前预留空间以避免布局抖动 */
  placeholderHeight?: number | string;
  /** 视口外的提前渲染距离 */
  rootMargin?: string;
  /** 一旦渲染过就保持渲染（避免反复挂载/卸载） */
  keepMounted?: boolean;
  className?: string;
}

/**
 * LazyMount —— 视口内才挂载子组件
 *
 * 使用场景：
 * - 重组件（如 ECharts 图表）按需渲染
 * - 长页面的下半部分图表懒加载
 * - 减少首屏渲染时间
 */
export default function LazyMount({
  children,
  placeholderHeight = 200,
  rootMargin = '200px',
  keepMounted = true,
  className,
}: LazyMountProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 浏览器不支持 IntersectionObserver 时直接渲染
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (keepMounted) {
              observer.disconnect();
            }
          } else if (!keepMounted) {
            setIsVisible(false);
          }
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, keepMounted]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ minHeight: isVisible ? undefined : placeholderHeight }}
    >
      {isVisible ? children : null}
    </div>
  );
}
