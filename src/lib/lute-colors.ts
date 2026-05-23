// Lute Color System — Warm Coral + White Theme
// Inspired by MomMed/momcozy brand aesthetics
// Navigation and sidebar remain unchanged

export const LC = {
  // === Primary Brand Colors ===
  primary: '#E8785A',        // Vibrant coral — main brand color, energetic & warm
  primaryLight: '#FEF2EE',   // Very light coral — subtle backgrounds
  primaryDark: '#D46040',    // Darker coral — hover states

  // === Accent / CTA Colors ===
  accent: '#C84040',         // Deep vibrant red — CTA buttons, key actions
  accentHover: '#B03535',    // Darker red — hover
  gold: '#D49450',           // Gold/amber — stars, badges, highlights
  goldLight: '#FDF6EC',      // Light gold bg

  // === Background Colors ===
  bg: '#FFFFFF',             // Pure white — main page background
  bgWarm: '#FAF8F6',         // Warm white — card sections
  bgCoral: '#FEF2EE',        // Coral tint — highlighted sections
  bgGold: '#FDF6EC',         // Gold tint — featured sections

  // === Card & Surface ===
  card: '#FFFFFF',           // Card background
  cardHover: '#FAFAF8',      // Card hover
  border: '#EDEAE5',         // Warm light gray — borders, dividers
  borderStrong: '#E0DCD6',   // Stronger border

  // === Text Colors ===
  text: '#1C1917',           // Warm black — primary text
  textSecondary: '#78716C',  // Warm gray — secondary text
  textMuted: '#A8A29E',      // Light warm gray — placeholder, disabled
  textInverse: '#FFFFFF',    // White text on dark backgrounds

  // === Semantic Colors ===
  success: '#16A34A',        // Green — positive growth
  successLight: '#DCFCE7',   // Light green bg
  danger: '#DC2626',         // Red — negative/decline
  dangerLight: '#FEE2E2',    // Light red bg
  warning: '#E8810A',        // Orange — warning
  warningLight: '#FEF3C7',   // Light orange bg
  info: '#3B82F6',           // Blue — informational

  // === Extended Colors ===
  teal: '#14B8A6',           // Teal — rating 4.0-4.5

  // === Data Visualization Palette ===
  chart: [
    '#E8785A', '#C84040', '#D49450', '#16A34A',
    '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B',
    '#14B8A6', '#6366F1',
  ],

  // === Sidebar/Nav (kept for compatibility) ===
  navBg: '#1E1E2D',
  navActive: '#E8785A',

  // === Shadows ===
  shadow: '0 1px 3px rgba(28,25,23,0.06)',
  shadowHover: '0 4px 12px rgba(28,25,23,0.10)',
};

// Tailwind class helpers for common patterns
export const LUTE = {
  card: 'bg-white rounded-xl shadow-sm border border-[#EDEAE5]',
  cardHover: 'hover:border-[#E8785A]/30 hover:shadow-md transition-all duration-200',
  tag: 'px-2.5 py-0.5 rounded-full text-[11px] font-medium',
  tagCoral: 'bg-[#FEF2EE] text-[#E8785A]',
  tagGold: 'bg-[#FDF6EC] text-[#D49450]',
  tagGreen: 'bg-[#DCFCE7] text-[#16A34A]',
  tagRed: 'bg-[#FEE2E2] text-[#DC2626]',
  tagGray: 'bg-[#F5F5F4] text-[#78716C]',
  heading: 'text-[#1C1917] font-semibold',
  text: 'text-[#78716C] text-xs',
  badge: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
  buttonCoral: 'bg-[#E8785A] hover:bg-[#D46040] text-white transition-colors',
  buttonRed: 'bg-[#C84040] hover:bg-[#B03535] text-white transition-colors',
  buttonGhost: 'bg-transparent border border-[#EDEAE5] hover:border-[#E8785A] text-[#78716C] hover:text-[#E8785A] transition-colors',
  trendUp: 'text-[#16A34A] flex items-center gap-0.5',
  trendDown: 'text-[#DC2626] flex items-center gap-0.5',
};
