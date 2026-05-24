/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import VirtualList from "@/components/shared/VirtualList";

describe("VirtualList", () => {
  const items = Array.from({ length: 1000 }, (_, i) => ({ id: i, label: `Item ${i}` }));

  it("仅渲染视口内的项目", () => {
    render(
      <VirtualList
        items={items}
        rowHeight={50}
        height={300}
        renderItem={(item) => <div data-testid={`row-${item.id}`}>{item.label}</div>}
        getKey={(it) => it.id}
      />
    );

    // 视口 300px / 行高 50px = 6 行 + overscan(5)*2 = 至多约 16 行
    // 应该 << 1000 项
    const rendered = document.querySelectorAll('[data-testid^="row-"]');
    expect(rendered.length).toBeLessThan(50);
    expect(rendered.length).toBeGreaterThan(0);
  });

  it("默认 overscan=5 时首屏包含项目 0", () => {
    render(
      <VirtualList
        items={items}
        rowHeight={50}
        height={300}
        renderItem={(item) => <div data-testid={`row-${item.id}`}>{item.label}</div>}
        getKey={(it) => it.id}
      />
    );
    expect(screen.getByTestId("row-0")).toBeInTheDocument();
  });

  it("空数组时不报错", () => {
    render(
      <VirtualList
        items={[]}
        rowHeight={50}
        height={300}
        renderItem={(item: any) => <div>{item.label}</div>}
      />
    );
    const rendered = document.querySelectorAll('[data-testid^="row-"]');
    expect(rendered.length).toBe(0);
  });

  it("容器具有指定高度", () => {
    const { container } = render(
      <VirtualList
        items={items}
        rowHeight={50}
        height={400}
        renderItem={(item) => <div>{item.label}</div>}
      />
    );
    const outer = container.firstChild as HTMLElement;
    expect(outer.style.height).toBe("400px");
  });

  it("内部 spacer 总高度 = items.length × rowHeight", () => {
    const { container } = render(
      <VirtualList
        items={items}
        rowHeight={50}
        height={300}
        renderItem={(item) => <div>{item.label}</div>}
      />
    );
    const outer = container.firstChild as HTMLElement;
    const spacer = outer.firstChild as HTMLElement;
    expect(spacer.style.height).toBe(`${1000 * 50}px`);
  });
});
