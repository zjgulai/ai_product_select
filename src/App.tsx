import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router';
import AppLayout from '@/components/layout/AppLayout';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

// Eager load home page for fastest LCP
import TikTokHome from '@/pages/tiktok/Home';

// Lazy load all other routes for code-splitting
const TikTokAnalysis = lazy(() => import('@/pages/tiktok/Analysis'));
const TikTokProducts = lazy(() => import('@/pages/tiktok/Products'));
const TikTokInfluencer = lazy(() => import('@/pages/tiktok/Influencer'));
const TikTokShop = lazy(() => import('@/pages/tiktok/Shop'));
const TikTokVideo = lazy(() => import('@/pages/tiktok/Video'));
const TikTokLive = lazy(() => import('@/pages/tiktok/Live'));
const TikTokAttention = lazy(() => import('@/pages/tiktok/Attention'));
const AmazonKeyword = lazy(() => import('@/pages/amazon/Keyword'));
const AmazonListPage = lazy(() => import('@/pages/amazon/AmazonList'));
const AmazonProduct = lazy(() => import('@/pages/amazon/Product'));
const ReviewsPage = lazy(() => import('@/pages/amazon/Reviews'));
const ParamTrend = lazy(() => import('@/pages/amazon/ParamTrend'));
const BrandTrend = lazy(() => import('@/pages/amazon/BrandTrend'));
const HotMarket = lazy(() => import('@/pages/amazon/HotMarket'));
const PotMarket = lazy(() => import('@/pages/amazon/PotMarket'));
const ReportAnalysis = lazy(() => import('@/pages/report/Analysis'));
const UserCenter = lazy(() => import('@/pages/user/UserCenter'));
const DataManager = lazy(() => import('@/pages/data/DataManager'));
const FusionOpportunities = lazy(() => import('@/pages/fusion/Opportunities'));
const ConceptDetail = lazy(() => import('@/pages/fusion/ConceptDetail'));
const FusionReport = lazy(() => import('@/pages/fusion/FusionReport'));

function PageFallback() {
  return (
    <div className="animate-fadeIn flex items-center justify-center py-20">
      <div className="flex items-center gap-2 text-xs text-lc-text-muted">
        <div className="w-4 h-4 border-2 border-lc-primary border-t-transparent rounded-full animate-spin" />
        加载中...
      </div>
    </div>
  );
}

const L = (Comp: React.ComponentType) => (
  <ErrorBoundary>
    <Suspense fallback={<PageFallback />}>
      <Comp />
    </Suspense>
  </ErrorBoundary>
);

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<TikTokHome />} />
          <Route path="/tiktok/home" element={<TikTokHome />} />
          <Route path="/tiktok/analysis" element={L(TikTokAnalysis)} />
          <Route path="/tiktok/products" element={L(TikTokProducts)} />
          <Route path="/tiktok/influencer" element={L(TikTokInfluencer)} />
          <Route path="/tiktok/shop" element={L(TikTokShop)} />
          <Route path="/tiktok/video" element={L(TikTokVideo)} />
          <Route path="/tiktok/live" element={L(TikTokLive)} />
          <Route path="/tiktok/attention" element={L(TikTokAttention)} />
          <Route path="/amazon/keyword" element={L(AmazonKeyword)} />
          <Route path="/amazon/list" element={L(AmazonListPage)} />
          <Route path="/amazon/product" element={L(AmazonProduct)} />
          <Route path="/amazon/reviews/:asin" element={L(ReviewsPage)} />
          <Route path="/amazon/param-trend" element={L(ParamTrend)} />
          <Route path="/amazon/brand-trend" element={L(BrandTrend)} />
          <Route path="/amazon/hot-market" element={L(HotMarket)} />
          <Route path="/amazon/pot-market" element={L(PotMarket)} />
          <Route path="/report/analysis" element={L(ReportAnalysis)} />
          <Route path="/user/center" element={L(UserCenter)} />
          <Route path="/data/manager" element={L(DataManager)} />
          <Route path="/fusion/opportunities" element={L(FusionOpportunities)} />
          <Route path="/fusion/concept/:id" element={L(ConceptDetail)} />
          <Route path="/fusion/report" element={L(FusionReport)} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
