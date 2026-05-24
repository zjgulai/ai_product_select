/* eslint-disable @typescript-eslint/no-unused-expressions */
 
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorBoundary from "@/components/shared/ErrorBoundary";

// 抑制 React 内部 console.error（错误边界测试会触发错误日志）
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});
afterAll(() => {
  console.error = originalError;
});

function BadChild(): never {
  throw new Error("Test error boundary message");
}

function GoodChild() {
  return <div data-testid="good">All Good</div>;
}

describe("ErrorBoundary", () => {
  it("正常子组件不报错时透传渲染", () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>
    );
    expect(screen.getByTestId("good")).toBeInTheDocument();
  });

  it("子组件抛错时显示降级 UI", () => {
    render(
      <ErrorBoundary>
        <BadChild />
      </ErrorBoundary>
    );
    expect(screen.getByText("页面出现错误")).toBeInTheDocument();
    expect(screen.getByText(/Test error boundary message/)).toBeInTheDocument();
  });

  it("提供重试和返回首页按钮", () => {
    render(
      <ErrorBoundary>
        <BadChild />
      </ErrorBoundary>
    );
    expect(screen.getByRole("button", { name: /重试/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /返回首页/ })).toBeInTheDocument();
  });

  it("自定义 fallback 优先于默认 UI", () => {
    render(
      <ErrorBoundary fallback={(error) => <div>Custom: {error.message}</div>}>
        <BadChild />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Custom: Test error boundary message/)).toBeInTheDocument();
  });

  it("点击重试按钮可以重置状态", () => {
    let shouldThrow = true;
    function Toggleable() {
      if (shouldThrow) throw new Error("toggle error");
      return <div data-testid="recovered">Recovered</div>;
    }

    const { rerender } = render(
      <ErrorBoundary>
        <Toggleable />
      </ErrorBoundary>
    );
    expect(screen.getByText("页面出现错误")).toBeInTheDocument();

    // 修复后点击重试
    shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: /重试/ }));
    rerender(
      <ErrorBoundary>
        <Toggleable />
      </ErrorBoundary>
    );
    expect(screen.getByTestId("recovered")).toBeInTheDocument();
  });
});
