import { useEffect } from 'react';

const BASE_TITLE = '路特全球智能选品中心';

const ROUTE_TITLES: Record<string, string> = {
  '/': '首页',
  '/tiktok/home': '首页',
  '/tiktok/analysis': 'TikTok 大盘分析',
  '/tiktok/products': '商品趋势',
  '/tiktok/influencer': '达人发现',
  '/tiktok/shop': '小店排行',
  '/tiktok/video': '热门视频',
  '/tiktok/live': '直播排行',
  '/tiktok/attention': '关注监控',
  '/amazon/keyword': 'Amazon 关键词趋势',
  '/amazon/list': 'Amazon 榜单',
  '/amazon/product': '商品搜索',
  '/amazon/param-trend': '参数趋势',
  '/amazon/brand-trend': '品牌趋势',
  '/amazon/hot-market': '热门市场',
  '/amazon/pot-market': '潜力市场',
  '/report/analysis': '我的报告',
  '/user/center': '用户中心',
  '/data/manager': '数据管理',
  '/project/tracking': '项目跟踪',
  '/fusion/opportunities': '选品机会榜',
  '/fusion/report': '融合报告',
};

export function useDocumentTitle(pathname: string) {
  useEffect(() => {
    const exact = ROUTE_TITLES[pathname];
    if (exact) {
      document.title = `${exact} — ${BASE_TITLE}`;
      return;
    }
    // Handle dynamic routes
    if (pathname.startsWith('/amazon/reviews/')) {
      document.title = `商品评价 — ${BASE_TITLE}`;
      return;
    }
    if (pathname.startsWith('/fusion/concept/')) {
      document.title = `概念详情 — ${BASE_TITLE}`;
      return;
    }
    if (pathname.startsWith('/project/')) {
      document.title = `项目详情 — ${BASE_TITLE}`;
      return;
    }
    document.title = BASE_TITLE;
  }, [pathname]);
}
