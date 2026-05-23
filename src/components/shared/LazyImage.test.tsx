import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import LazyImage from "@/components/shared/LazyImage";

let observerCallback: IntersectionObserverCallback | null = null;
let observerInstance: any = null;

beforeEach(() => {
  (window as any).IntersectionObserver = class {
    constructor(cb: IntersectionObserverCallback) {
      observerCallback = cb;
      observerInstance = this;
    }
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = () => [];
    root = null;
    rootMargin = "";
    thresholds = [];
  };
});

describe("LazyImage", () => {
  it("初始未进入视口时使用占位", () => {
    render(<LazyImage src="https://example.com/a.jpg" placeholder="/p.jpg" alt="test" />);
    const img = screen.getByAltText("test") as HTMLImageElement;
    expect(img.src).toContain("/p.jpg");
  });

  it("进入视口后加载真实图片", () => {
    render(<LazyImage src="https://example.com/a.jpg" alt="real" />);

    act(() => {
      observerCallback?.([{ isIntersecting: true } as any], observerInstance);
    });

    const img = screen.getByAltText("real") as HTMLImageElement;
    expect(img.src).toContain("example.com/a.jpg");
  });

  it("加载失败时回退到 fallback", () => {
    render(<LazyImage src="https://broken.example/a.jpg" fallback="/fallback.jpg" alt="err" />);

    act(() => {
      observerCallback?.([{ isIntersecting: true } as any], observerInstance);
    });

    const img = screen.getByAltText("err") as HTMLImageElement;
    fireEvent.error(img);
    expect(img.src).toContain("/fallback.jpg");
  });

  it("设置原生 loading='lazy' 与 decoding='async'", () => {
    render(<LazyImage src="x.jpg" alt="attrs" />);
    const img = screen.getByAltText("attrs") as HTMLImageElement;
    expect(img.getAttribute("loading")).toBe("lazy");
    expect(img.getAttribute("decoding")).toBe("async");
  });
});
