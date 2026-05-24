/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable react-hooks/rules-of-hooks */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import LazyMount from "@/components/shared/LazyMount";

// 模拟 IntersectionObserver，提供手动触发 intersection 的能力
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

afterEach(() => {
  observerCallback = null;
  observerInstance = null;
});

describe("LazyMount", () => {
  it("初始未进入视口时不渲染子组件", () => {
    render(
      <LazyMount placeholderHeight={300}>
        <div data-testid="child">Child</div>
      </LazyMount>
    );
    expect(screen.queryByTestId("child")).toBeNull();
  });

  it("初始时占位高度生效", () => {
    const { container } = render(
      <LazyMount placeholderHeight={300}>
        <div data-testid="child">Child</div>
      </LazyMount>
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.minHeight).toContain("300");
  });

  it("进入视口后渲染子组件", () => {
    render(
      <LazyMount>
        <div data-testid="child">Child</div>
      </LazyMount>
    );

    act(() => {
      observerCallback?.([
        {
          isIntersecting: true,
          target: document.createElement("div"),
          intersectionRatio: 1,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: Date.now(),
        },
      ], observerInstance);
    });

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("keepMounted=true 时一次显示后保持挂载", () => {
    render(
      <LazyMount keepMounted>
        <div data-testid="child">Child</div>
      </LazyMount>
    );

    act(() => {
      observerCallback?.([{ isIntersecting: true } as any], observerInstance);
    });
    expect(screen.getByTestId("child")).toBeInTheDocument();

    // 即使再次离开视口仍然保持
    act(() => {
      observerCallback?.([{ isIntersecting: false } as any], observerInstance);
    });
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("浏览器不支持 IntersectionObserver 时直接渲染", () => {
    // 临时移除 IntersectionObserver
    const original = (window as any).IntersectionObserver;
    (window as any).IntersectionObserver = undefined;

    render(
      <LazyMount>
        <div data-testid="fallback-child">Fallback</div>
      </LazyMount>
    );
    expect(screen.getByTestId("fallback-child")).toBeInTheDocument();

    (window as any).IntersectionObserver = original;
  });
});
