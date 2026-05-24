/**
 * Lightweight faker replacement for mock data generation.
 * Eliminates ~470KB of @faker-js/faker from the bundle.
 */

const ADJECTIVES = [
  "智能", "便携", "折叠", "多功能", "静音", "环保", "迷你", "大容量",
  "防滑", "防水", "透气", "柔软", "耐用", "时尚", "简约", "高端",
  "无线", "充电", "自动", "感应", "触控", "蓝牙", "高清", "快充"
];

const MATERIALS = [
  "硅胶", "塑料", "不锈钢", "铝合金", "陶瓷", "玻璃", "布艺", "皮革",
  "木质", "碳纤维", "ABS", "PP", "TPE", "尼龙", "棉质"
];

const PRODUCT_NAMES = [
  "婴儿推车", "奶瓶消毒器", "温奶器", "吸奶器", "婴儿床", "学步车",
  "辅食机", "婴儿浴盆", " diaper bag", "安全座椅", "婴儿背带",
  "玩具收纳箱", "宝宝餐椅", "婴儿监视器", "爬行垫", "牙胶",
  "围兜", "睡袋", "抱被", "隔尿垫", "纸尿裤", "湿巾", "润肤乳",
  "洗发沐浴露", "护臀膏", "奶瓶刷", "奶嘴", "安抚巾", "摇铃",
  "布书", "健身架", "摇椅", "学步带", "防走失包", "遮阳帽"
];

const FIRST_NAMES = [
  "一诺", "宇轩", "梓涵", "子墨", "欣怡", "浩宇", "诗涵", "子轩",
  "梓萱", "梦瑶", "俊杰", "雨萱", "浩然", "思琪", "博文", "雅琪",
  "宇航", "佳怡", "天佑", "欣妍", "睿哲", "雨桐", "晨曦", "子豪"
];

const LAST_NAMES = ["李", "王", "张", "刘", "陈", "杨", "赵", "黄", "周", "吴", "徐", "孙", "马", "朱", "胡", "郭"];

const COMPANY_PREFIXES = ["乐", "优", "贝", "爱", "萌", "智", "宝", "童", "康", "美", "佳", "惠"];
const COMPANY_SUFFIXES = ["科技", "母婴", "用品", "贸易", "商贸", "实业", "电子商务", "旗舰店"];

const SENTENCES = [
  "宝宝非常喜欢，质量也很好。",
  "性价比很高，推荐购买。",
  "物流很快，包装完好。",
  "材质安全无异味，用着放心。",
  "设计很人性化，操作方便。",
  "颜色正，没有色差。",
  "已经回购好几次了，值得信赖。",
  "功能齐全，满足日常需求。",
  "做工精细，没有毛边。",
  "客服态度很好，有问题及时解决。",
  "比实体店便宜很多。",
  "用了半个月，体验不错。",
  "适合新生儿使用，很温和。",
  "容量大，外出携带方便。",
  "清洗方便，不易滋生细菌。"
];

const PARAGRAPHS = [
  "这款产品是我给宝宝挑选了很久才决定的，收到后非常满意。无论是材质还是做工都很讲究，没有任何异味，宝宝用起来很安全。而且设计很贴心，各种细节都考虑到了。",
  "作为新手妈妈，对婴儿用品的选择格外谨慎。这款产品在朋友推荐下购买的，使用体验超出预期。功能实用，操作简单，而且性价比很高，强烈推荐给其他宝妈。",
  "已经使用了两个月，产品质量依然很好。清洗方便，耐用性强。虽然价格稍微贵一点，但考虑到安全性和耐用度，还是很值得的。",
  "对比了好几个品牌，最终选择了这款。没有让我失望，宝宝很喜欢，每天都要用。外观设计也很时尚，放在家里很协调。"
];

let seed = 12345;
function random(): number {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => random() - 0.5);
  return shuffled.slice(0, n);
}

export const faker = {
  string: {
    alphanumeric: (length: number = 8) => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      return Array.from({ length }, () => chars[Math.floor(random() * chars.length)]).join("");
    },
  },
  date: {
    between: (opts: { from: string | Date; to: string | Date }) => {
      const fromTime = new Date(opts.from).getTime();
      const toTime = new Date(opts.to).getTime();
      return new Date(fromTime + random() * (toTime - fromTime));
    },
  },
  lorem: {
    sentence: () => pick(SENTENCES),
    paragraph: () => pick(PARAGRAPHS),
    paragraphs: (count: number = 3) => pickN(PARAGRAPHS, Math.min(count, PARAGRAPHS.length)).join("\n\n"),
  },
  commerce: {
    productName: () => `${pick(ADJECTIVES)}${pick(PRODUCT_NAMES)}`,
    productDescription: () => `${pick(ADJECTIVES)}${pick(MATERIALS)}材质，${pick(SENTENCES)}`,
    productAdjective: () => pick(ADJECTIVES),
    productMaterial: () => pick(MATERIALS),
  },
  person: {
    fullName: () => `${pick(LAST_NAMES)}${pick(FIRST_NAMES)}`,
  },
  image: {
    urlPicsumPhotos: () => `https://picsum.photos/400/300?random=${Math.floor(random() * 1000)}`,
    avatar: () => `https://api.dicebear.com/7.x/avataaars/svg?seed=${random().toString(36).slice(2, 8)}`,
  },
  company: {
    name: () => `${pick(COMPANY_PREFIXES)}${pick(COMPANY_PREFIXES)}${pick(COMPANY_SUFFIXES)}`,
  },
  internet: {
    username: () => `user_${Math.floor(random() * 100000)}`,
    userName: () => `user_${Math.floor(random() * 100000)}`,
  },
};
