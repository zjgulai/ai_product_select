// Industry-realistic TikTok Shop US category data (2025 Jun - 2026 Mar)
// Sources: EchoTik, Capital One Shopping, eMarketer, industry reports

// Heatmap: categories x months → sales volume index (0-100)
export const HEATMAP_CATEGORIES = [
  "美妆个护", "健康保健", "女装内衣", "家居日用",
  "手机数码", "食品饮料", "运动户外", "男装内衣",
  "宠物用品", "玩具爱好", "家电", "时尚配饰",
];

export const HEATMAP_MONTHS = [
  "2025-06", "2025-07", "2025-08", "2025-09",
  "2025-10", "2025-11", "2025-12", "2026-01",
  "2026-02", "2026-03",
];

// Sales heat index (0-100) based on real market patterns
// Beauty peaks in Nov/Dec (holiday), Health steady growth,
// Fashion peaks in season changes, Home peaks in Q4 etc.
export const HEATMAP_DATA: [number, number, number][] = [
  // 美妆个护 - dominant ~26% GMV, peaks holiday season
  [0,0,45],[0,1,42],[0,2,48],[0,3,52],[0,4,58],[0,5,78],[0,6,85],[0,7,55],[0,8,60],[0,9,72],
  // 健康保健 - fast growing, steady
  [1,0,38],[1,1,36],[1,2,40],[1,3,44],[1,4,50],[1,5,62],[1,6,68],[1,7,48],[1,8,52],[1,9,58],
  // 女装内衣 - ~12% volume, peaks spring/fall
  [2,0,55],[2,1,48],[2,2,42],[2,3,58],[2,4,62],[2,5,70],[2,6,75],[2,7,52],[2,8,60],[2,9,65],
  // 家居日用 - Q4 peak, new homeowner spring
  [3,0,40],[3,1,38],[3,2,36],[3,3,42],[3,4,50],[3,5,68],[3,6,72],[3,7,45],[3,8,48],[3,9,55],
  // 手机数码 - tech launch cycles, holiday
  [4,0,35],[4,1,32],[4,2,38],[4,3,45],[4,4,55],[4,5,72],[4,6,78],[4,7,40],[4,8,42],[4,9,50],
  // 食品饮料 - steady, slight holiday bump
  [5,0,30],[5,1,28],[5,2,30],[5,3,32],[5,4,38],[5,5,48],[5,6,52],[5,7,35],[5,8,36],[5,9,40],
  // 运动户外 - spring/summer peak, New Year resolution
  [6,0,52],[6,1,58],[6,2,62],[6,3,48],[6,4,42],[6,5,45],[6,6,50],[6,7,55],[6,8,48],[6,9,50],
  // 男装内衣 - moderate, consistent
  [7,0,25],[7,1,24],[7,2,26],[7,3,28],[7,4,32],[7,5,40],[7,6,45],[7,7,28],[7,8,30],[7,9,32],
  // 宠物用品 - growing rapidly, steady
  [8,0,28],[8,1,30],[8,2,32],[8,3,35],[8,4,38],[8,5,48],[8,6,55],[8,7,38],[8,8,42],[8,9,46],
  // 玩具爱好 - Q4 holiday dominant
  [9,0,22],[9,1,20],[9,2,22],[9,3,25],[9,4,30],[9,5,72],[9,6,85],[9,7,25],[9,8,28],[9,9,32],
  // 家电 - higher ticket, Q4 peak
  [10,0,20],[10,1,18],[10,2,22],[10,3,26],[10,4,32],[10,5,55],[10,6,62],[10,7,28],[10,8,30],[10,9,36],
  // 时尚配饰 - trend driven, consistent
  [11,0,32],[11,1,30],[11,2,34],[11,3,36],[11,4,40],[11,5,52],[11,6,58],[11,7,36],[11,8,38],[11,9,42],
];

// Category market share data (TikTok Shop US)
export const CATEGORY_SHARE = [
  { name: "美妆个护", value: 26.0, gmv: "$10.5B", trend: "+26%", status: "dominant" },
  { name: "健康保健", value: 15.2, gmv: "$6.1B", trend: "+38%", status: "growing" },
  { name: "女装内衣", value: 12.8, gmv: "$5.2B", trend: "+15%", status: "stable" },
  { name: "家居日用", value: 10.5, gmv: "$4.2B", trend: "+22%", status: "growing" },
  { name: "手机数码", value: 8.3,  gmv: "$3.3B", trend: "+12%", status: "stable" },
  { name: "食品饮料", value: 7.6,  gmv: "$3.0B", trend: "+18%", status: "growing" },
  { name: "运动户外", value: 6.4,  gmv: "$2.6B", trend: "+28%", status: "hot" },
  { name: "时尚配饰", value: 5.2,  gmv: "$2.1B", trend: "+14%", status: "stable" },
  { name: "宠物用品", value: 4.1,  gmv: "$1.7B", trend: "+35%", status: "hot" },
  { name: "家电",     value: 3.9,  gmv: "$1.6B", trend: "+20%", status: "growing" },
];

// Monthly GMV trend ($B) - realistic US market
export const MONTHLY_GMV = [
  { month: "2025-06", gmv: 8.2 },
  { month: "2025-07", gmv: 7.8 },
  { month: "2025-08", gmv: 8.5 },
  { month: "2025-09", gmv: 9.1 },
  { month: "2025-10", gmv: 9.8 },
  { month: "2025-11", gmv: 12.5 },
  { month: "2025-12", gmv: 13.2 },
  { month: "2026-01", gmv: 8.6 },
  { month: "2026-02", gmv: 9.3 },
  { month: "2026-03", gmv: 10.1 },
];

// Sales trend by price range
export const PRICE_RANGE_TREND = [
  { range: "$0-5",    products: 5200, sales: 3200, revenue: 12.8 },
  { range: "$5-10",   products: 8900, sales: 6800, revenue: 51.2 },
  { range: "$10-20",  products: 15200, sales: 11200, revenue: 168.0 },
  { range: "$20-50",  products: 21800, sales: 15600, revenue: 546.0 },
  { range: "$50-100", products: 8400, sales: 5200, revenue: 390.0 },
  { range: ">$100",   products: 3600, sales: 1800, revenue: 252.0 },
];

// Influencer tier data (realistic distribution)
export const INFLUENCER_TIER_DATA = [
  { tier: "Nano\n(<1K)", count: 18250000, pct: "68.2%", sales: 42000000, avgGPM: 380 },
  { tier: "Micro\n(1K-10K)", count: 5200000, pct: "19.4%", sales: 68000000, avgGPM: 1250 },
  { tier: "Mid\n(10K-100K)", count: 2800000, pct: "10.5%", sales: 52000000, avgGPM: 1850 },
  { tier: "Macro\n(100K-1M)", count: 420000, pct: "1.6%", sales: 28000000, avgGPM: 2450 },
  { tier: "Mega\n(>1M)", count: 85000, pct: "0.3%", sales: 8500000, avgGPM: 3200 },
];
