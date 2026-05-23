import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import DataTablePage from "@/components/shared/DataTablePage";

function renderWithRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

const sampleColumns = [
  { key: "id", label: "ID" },
  { key: "name", label: "名称", render: (item: any) => <span data-testid={`name-${item.id}`}>{item.name}</span> },
  { key: "value", label: "值", align: "right" as const },
];

const sampleData = [
  { id: 1, name: "Alpha", value: 100 },
  { id: 2, name: "Beta", value: 200 },
  { id: 3, name: "Gamma", value: 300 },
];

describe("DataTablePage", () => {
  it("Loading 状态显示骨架屏", () => {
    renderWithRouter(
      <DataTablePage
        breadcrumb={["首页", "列表"]}
        title="测试列表"
        loading
        data={[]}
        columns={sampleColumns}
      />
    );
    // 骨架屏存在（data-slot="skeleton" 由 shadcn Skeleton 组件提供）
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("数据渲染所有行与列", () => {
    renderWithRouter(
      <DataTablePage
        breadcrumb={["首页", "列表"]}
        title="测试列表"
        data={sampleData}
        total={sampleData.length}
        columns={sampleColumns}
      />
    );
    expect(screen.getByTestId("name-1")).toHaveTextContent("Alpha");
    expect(screen.getByTestId("name-2")).toHaveTextContent("Beta");
    expect(screen.getByTestId("name-3")).toHaveTextContent("Gamma");
  });

  it("渲染列头", () => {
    renderWithRouter(
      <DataTablePage
        breadcrumb={["首页"]}
        title="X"
        data={sampleData}
        columns={sampleColumns}
      />
    );
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("名称")).toBeInTheDocument();
    expect(screen.getByText("值")).toBeInTheDocument();
  });

  it("搜索输入触发回调", () => {
    const onSearchChange = vi.fn();
    renderWithRouter(
      <DataTablePage
        breadcrumb={["首页"]}
        title="X"
        searchPlaceholder="搜索关键词"
        onSearchChange={onSearchChange}
        data={sampleData}
        columns={sampleColumns}
      />
    );
    const input = screen.getByPlaceholderText("搜索关键词") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "test" } });
    expect(onSearchChange).toHaveBeenCalledWith("test");
  });

  it("Tab 切换触发回调", () => {
    const onTabChange = vi.fn();
    renderWithRouter(
      <DataTablePage
        breadcrumb={["首页"]}
        title="X"
        tabs={[{ key: "a", label: "TabA" }, { key: "b", label: "TabB" }]}
        activeTab="a"
        onTabChange={onTabChange}
        data={sampleData}
        columns={sampleColumns}
      />
    );
    fireEvent.click(screen.getByText("TabB"));
    expect(onTabChange).toHaveBeenCalledWith("b");
  });

  it("空数据显示空状态文案", () => {
    renderWithRouter(
      <DataTablePage
        breadcrumb={["首页"]}
        title="X"
        data={[]}
        total={0}
        columns={sampleColumns}
        emptyText="自定义空状态"
      />
    );
    expect(screen.getByText("自定义空状态")).toBeInTheDocument();
  });

  it("extraHeader 节点会被渲染", () => {
    renderWithRouter(
      <DataTablePage
        breadcrumb={["首页"]}
        title="X"
        extraHeader={<div data-testid="extra">额外内容</div>}
        data={sampleData}
        columns={sampleColumns}
      />
    );
    expect(screen.getByTestId("extra")).toBeInTheDocument();
  });
});
