// Complete TikTok Shop US Category Treemap Data
// Extracted from screenshot image.png - with subcategory breakdowns

export interface CategoryTreeNode {
  name: string;
  value?: number;
  growth?: string;
  children?: CategoryTreeNode[];
}

export const CATEGORY_TREE_DATA: CategoryTreeNode[] = [
  {
    name: "美妆个护",
    value: 15800000,
    growth: "-3.98%",
    children: [
      { name: "美妆", value: 2800000, growth: "1.97%" },
      { name: "美容护肤", value: 4200000, growth: "-2.46%" },
      { name: "洗浴与身体护理", value: 3500000, growth: "-1.25%" },
      { name: "香水", value: 1800000, growth: "-2.22%" },
      { name: "头部护理与造型", value: 2100000, growth: "-10.44%" },
      { name: "个人护理用具", value: 1400000, growth: "-26.4%" },
    ],
  },
  {
    name: "女装与女士内衣",
    value: 12500000,
    growth: "6.49%",
    children: [
      { name: "女士上装", value: 3800000, growth: "6.88%" },
      { name: "女士下装", value: 2200000, growth: "6.07%" },
      { name: "女士连衣裙", value: 2800000, growth: "13.45%" },
      { name: "女士内衣", value: 1200000, growth: "1.33%" },
      { name: "女士睡衣与家居服", value: 800000, growth: "0.26%" },
    ],
  },
  {
    name: "运动与户外",
    value: 9800000,
    growth: "8.26%",
    children: [
      { name: "运动与户外服饰", value: 3200000, growth: "12.03%" },
      { name: "健身设备", value: 1800000, growth: "7.34%" },
      { name: "休闲与户外", value: 1600000, growth: "7.04%" },
      { name: "露营装备", value: 1400000, growth: "11.9%" },
      { name: "泳装", value: 900000, growth: "-2.14%" },
    ],
  },
  {
    name: "居家日用",
    value: 8500000,
    growth: "1.53%",
    children: [
      { name: "节日及派对用品", value: 2100000, growth: "17.59%" },
      { name: "装饰", value: 1800000, growth: "-1.86%" },
      { name: "浴室用品", value: 1500000, growth: "-5.26%" },
      { name: "家居收纳", value: 1600000, growth: "-4.75%" },
    ],
  },
  {
    name: "时尚配饰",
    value: 7200000,
    growth: "6.55%",
    children: [
      { name: "服饰配件", value: 2200000, growth: "13.93%" },
      { name: "服装珠宝与配饰", value: 2500000, growth: "11.99%" },
      { name: "眼镜", value: 1200000, growth: "-3.89%" },
      { name: "发饰", value: 800000, growth: "5%" },
      { name: "假发", value: 500000, growth: "1.13%" },
    ],
  },
  {
    name: "手机与数码",
    value: 6800000,
    growth: "-1.56%",
    children: [
      { name: "影音设备", value: 2800000, growth: "-1.71%" },
      { name: "手机配件", value: 2400000, growth: "-1.45%" },
      { name: "智能设备", value: 1600000, growth: "-1.28%" },
    ],
  },
  {
    name: "食品饮料",
    value: 5500000,
    growth: "-12.21%",
    children: [
      { name: "零食", value: 2200000, growth: "-1.9%" },
      { name: "主食与食材", value: 1800000, growth: "-4.5%" },
      { name: "饮料", value: 1500000, growth: "-22.52%" },
    ],
  },
  {
    name: "健康",
    value: 4800000,
    growth: "-9.7%",
    children: [
      { name: "食品补充剂", value: 2800000, growth: "-9.84%" },
      { name: "保健器材", value: 1200000, growth: "-8.5%" },
      { name: "健康监测", value: 800000, growth: "-10.2%" },
    ],
  },
  {
    name: "厨房用品",
    value: 4200000,
    growth: "-5.35%",
    children: [
      { name: "厨房用具与小工具", value: 2500000, growth: "-0.75%" },
      { name: "饮料用具", value: 1000000, growth: "-9.88%" },
      { name: "厨房家电", value: 700000, growth: "-11.56%" },
    ],
  },
  {
    name: "男装与男士内衣",
    value: 3800000,
    growth: "3.99%",
    children: [
      { name: "男士下装", value: 1200000, growth: "5.2%" },
      { name: "男士上装", value: 1100000, growth: "2.76%" },
      { name: "男士内衣", value: 900000, growth: "13.72%" },
      { name: "男士配饰", value: 600000, growth: "-5%" },
    ],
  },
  {
    name: "鞋靴",
    value: 3600000,
    growth: "3.74%",
    children: [
      { name: "女鞋", value: 2000000, growth: "8.13%" },
      { name: "男鞋", value: 1000000, growth: "-5.07%" },
      { name: "童鞋", value: 600000, growth: "4.2%" },
    ],
  },
  {
    name: "宠物用品",
    value: 3200000,
    growth: "5.8%",
    children: [
      { name: "猫用品", value: 1400000, growth: "6.0%" },
      { name: "狗用品", value: 1200000, growth: "5.5%" },
      { name: "宠物食品", value: 600000, growth: "5.8%" },
    ],
  },
  {
    name: "玩具和爱好",
    value: 2800000,
    growth: "15.7%",
    children: [
      { name: "传统与益智玩具", value: 1000000, growth: "15.7%" },
      { name: "收藏玩具", value: 800000, growth: "18.2%" },
      { name: "户外玩具", value: 600000, growth: "12.5%" },
      { name: "益智游戏", value: 400000, growth: "16.8%" },
    ],
  },
  {
    name: "电脑办公",
    value: 2500000,
    growth: "-1.12%",
    children: [
      { name: "办公文具与用品", value: 1200000, growth: "-0.44%" },
      { name: "电脑配件", value: 800000, growth: "-1.8%" },
      { name: "打印耗材", value: 500000, growth: "-1.5%" },
    ],
  },
  {
    name: "箱包",
    value: 2200000,
    growth: "-12.65%",
    children: [
      { name: "女包", value: 1000000, growth: "-9.45%" },
      { name: "旅行箱", value: 600000, growth: "-15.2%" },
      { name: "背包", value: 600000, growth: "-14.8%" },
    ],
  },
  {
    name: "汽车与摩托车",
    value: 2000000,
    growth: "-0.41%",
    children: [
      { name: "汽车内饰", value: 800000, growth: "4.32%" },
      { name: "洗车与保养", value: 600000, growth: "-0.79%" },
      { name: "汽车电子", value: 400000, growth: "-3.5%" },
      { name: "摩托车配件", value: 200000, growth: "-2.1%" },
    ],
  },
  {
    name: "家装建材",
    value: 1800000,
    growth: "0.99%",
    children: [
      { name: "灯具与照明", value: 800000, growth: "11.15%" },
      { name: "园艺用品", value: 600000, growth: "10.16%" },
      { name: "五金工具", value: 400000, growth: "-2.95%" },
    ],
  },
  {
    name: "家电",
    value: 3200000,
    growth: "3.31%",
    children: [
      { name: "生活电器", value: 1500000, growth: "3.31%" },
      { name: "厨房家电", value: 1000000, growth: "-11.56%" },
      { name: "居家电器", value: 700000, growth: "9.51%" },
    ],
  },
];

// Flatten for treemap
export function flattenCategoryTree(nodes: CategoryTreeNode[]): any[] {
  return nodes.map(cat => ({
    name: cat.name,
    value: cat.value,
    growth: cat.growth,
    itemStyle: {
      color: parseFloat(cat.growth!) > 0
        ? `rgba(34, 197, 94, ${0.15 + Math.min(Math.abs(parseFloat(cat.growth!)) / 30, 0.5)})`
        : `rgba(239, 68, 68, ${0.15 + Math.min(Math.abs(parseFloat(cat.growth!)) / 30, 0.5)})`,
    },
    children: cat.children?.map(sub => ({
      name: sub.name,
      value: sub.value,
      growth: sub.growth,
      itemStyle: {
        color: parseFloat(sub.growth!) > 0
          ? `rgba(34, 197, 94, ${0.2 + Math.min(Math.abs(parseFloat(sub.growth!)) / 40, 0.45)})`
          : `rgba(239, 68, 68, ${0.2 + Math.min(Math.abs(parseFloat(sub.growth!)) / 40, 0.45)})`,
      },
    })),
  }));
}

// Get top level summary for display
export const CATEGORY_SUMMARY = CATEGORY_TREE_DATA.map(d => ({
  name: d.name,
  value: d.value,
  growth: d.growth!,
  subCount: d.children?.length || 0,
}));
