export interface MarketItem {
  rank: number;
  keyword: string;
  trend: number[];
  sales: number;
  salesG: string;
  revenue: number;
  revG?: string;
  price: number;
  rating: number;
  reviews?: number;
  competition?: string;
  top3?: string;
  newP?: string;
  attrs?: string;
  brands?: string;
  potential?: string;
}
