/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useEffect, useRef } from 'react';
import type { ImgHTMLAttributes } from 'react';

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  fallback?: string;
  placeholder?: string;
  rootMargin?: string;
}

/**
 * LazyImage —— 视口内才加载图片，加载失败自动回退到 fallback
 */
export default function LazyImage({
  src,
  fallback = '',
  placeholder,
  rootMargin = '100px',
  className,
  alt = '',
  ...rest
}: LazyImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  const finalSrc = errored && fallback ? fallback : shouldLoad ? src : placeholder || '';

  return (
    <img
      ref={ref}
      src={finalSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setErrored(true)}
      className={className}
      {...rest}
    />
  );
}
