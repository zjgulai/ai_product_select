// Image asset paths for products, avatars, and shop logos
const BASE = import.meta.env.BASE_URL || '/';

export const PRODUCT_IMAGES = [
  `${BASE}assets/products/p1.jpg`,
  `${BASE}assets/products/p2.jpg`,
  `${BASE}assets/products/p3.jpg`,
  `${BASE}assets/products/p4.jpg`,
  `${BASE}assets/products/p5.jpg`,
  `${BASE}assets/products/p6.jpg`,
];

export const AVATAR_IMAGES = [
  `${BASE}assets/avatars/a1.jpg`,
  `${BASE}assets/avatars/a2.jpg`,
  `${BASE}assets/avatars/a3.jpg`,
  `${BASE}assets/avatars/a4.jpg`,
  `${BASE}assets/avatars/a5.jpg`,
  `${BASE}assets/avatars/a6.jpg`,
];

export const SHOP_LOGOS = [
  `${BASE}assets/shops/s1.jpg`,
  `${BASE}assets/shops/s2.jpg`,
  `${BASE}assets/shops/s3.jpg`,
];

export const LIVE_COVER = `${BASE}assets/live-cover.jpg`;

// Helper: get image by index with cycling
export const getProductImage = (i: number) => PRODUCT_IMAGES[i % PRODUCT_IMAGES.length];
export const getAvatarImage = (i: number) => AVATAR_IMAGES[i % AVATAR_IMAGES.length];
export const getShopLogo = (i: number) => SHOP_LOGOS[i % SHOP_LOGOS.length];
