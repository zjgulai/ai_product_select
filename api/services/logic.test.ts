import { describe, it, expect } from "vitest";

/**
 * Pure function 测试样例：用于验证业务逻辑的纯函数。
 * 当前主要测试 mock 数据层；前端组件测试需要 jsdom + RTL，本套件保持纯 node 环境运行更快。
 */

describe("Opportunity Score 计算逻辑", () => {
  // 模拟机会分计算公式：SHI高 + CVI中等 → 高机会
  function calculateOpportunity(shi: number, cvi: number, momentum: number): number {
    const saturation = Math.min(1, cvi / 80);
    return Math.min(100, shi * (1 - saturation) * momentum);
  }

  it("SHI高 + CVI低 = 高机会分（蓝海）", () => {
    const score = calculateOpportunity(90, 20, 1.2);
    expect(score).toBeGreaterThan(60);
  });

  it("SHI低 + CVI高 = 低机会分（红海）", () => {
    const score = calculateOpportunity(30, 80, 1.0);
    expect(score).toBeLessThan(15);
  });

  it("机会分上限为 100", () => {
    const score = calculateOpportunity(200, 10, 2);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("CVI 接近饱和时机会分趋零", () => {
    const score = calculateOpportunity(80, 80, 1.0);
    expect(score).toBeLessThanOrEqual(5);
  });
});

describe("情感比例计算", () => {
  function calcSentimentRatio(positive: number, negative: number, total: number) {
    if (total === 0) return { pos: 0, neg: 0 };
    return {
      pos: Math.round((positive / total) * 100),
      neg: Math.round((negative / total) * 100),
    };
  }

  it("正常情感比例计算", () => {
    const r = calcSentimentRatio(80, 10, 100);
    expect(r.pos).toBe(80);
    expect(r.neg).toBe(10);
  });

  it("零评论时不报错", () => {
    const r = calcSentimentRatio(0, 0, 0);
    expect(r.pos).toBe(0);
    expect(r.neg).toBe(0);
  });
});

describe("关键词高亮 (highlightKeywords)", () => {
  function highlightToString(text: string, keywords: string[]): string {
    if (!keywords?.length) return text;
    const sorted = [...keywords].sort((a, b) => b.length - a.length);
    const regex = new RegExp(`(${sorted.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  }

  it("匹配多个关键词", () => {
    const result = highlightToString("This product is portable and easy to use", ["portable", "easy"]);
    expect(result).toContain("<mark>portable</mark>");
    expect(result).toContain("<mark>easy</mark>");
  });

  it("大小写不敏感匹配", () => {
    const result = highlightToString("Portable PORTABLE portable", ["portable"]);
    expect(result.match(/<mark>/g)?.length).toBe(3);
  });

  it("空关键词返回原文", () => {
    const result = highlightToString("hello world", []);
    expect(result).toBe("hello world");
  });

  it("正则特殊字符不报错", () => {
    expect(() => highlightToString("price is $9.99", ["$9.99"])).not.toThrow();
  });
});

describe("分页计算", () => {
  function paginate<T>(items: T[], page: number, pageSize: number) {
    return {
      items: items.slice(page * pageSize, (page + 1) * pageSize),
      totalPages: Math.ceil(items.length / pageSize),
      currentPage: page,
    };
  }

  it("首页分页正确", () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    const p = paginate(items, 0, 10);
    expect(p.items).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(p.totalPages).toBe(3);
  });

  it("末页可能不满 pageSize", () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    const p = paginate(items, 2, 10);
    expect(p.items.length).toBe(5);
  });

  it("超出页码返回空数组", () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    const p = paginate(items, 100, 10);
    expect(p.items).toEqual([]);
  });
});
