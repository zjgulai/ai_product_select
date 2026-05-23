// Image asset paths for products, avatars, and shop logos

export const PRODUCT_IMAGES = [
  '/assets/products/p1.jpg',
  '/assets/products/p2.jpg',
  '/assets/products/p3.jpg',
  '/assets/products/p4.jpg',
  '/assets/products/p5.jpg',
  '/assets/products/p6.jpg',
];

export const AVATAR_IMAGES = [
  '/assets/avatars/a1.jpg',
  '/assets/avatars/a2.jpg',
  '/assets/avatars/a3.jpg',
  '/assets/avatars/a4.jpg',
  '/assets/avatars/a5.jpg',
  '/assets/avatars/a6.jpg',
];

export const SHOP_LOGOS = [
  '/assets/shops/s1.jpg',
  '/assets/shops/s2.jpg',
  '/assets/shops/s3.jpg',
];

export const LIVE_COVER = '/assets/live-cover.jpg';

// Helper: get image by index with cycling
export const getProductImage = (i: number) => PRODUCT_IMAGES[i % PRODUCT_IMAGES.length];
export const getAvatarImage = (i: number) => AVATAR_IMAGES[i % AVATAR_IMAGES.length];
export const getShopLogo = (i: number) => SHOP_LOGOS[i % SHOP_LOGOS.length];
