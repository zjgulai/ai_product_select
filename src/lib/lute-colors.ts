// Lute Color System — Momcozy Deep Rose + Warm White Theme
// Brand palette: #8B354A (deep rose) + #F5EDE8 (warm cream)

export const LC = {
  // === Primary Brand Colors ===
  primary: '#8B354A',        // Deep rose — main brand color, warm & maternal
  primaryLight: '#FAF0ED',   // Very light rose — subtle backgrounds
  primaryDark: '#6B2A3A',    // Darker rose — hover states

  // === Accent / CTA Colors ===
  accent: '#A33D52',         // Deep rose — CTA buttons, key actions
  accentHover: '#8B354A',    // Darker rose — hover
  gold: '#C47A5A',           // Warm amber — stars, badges, highlights
  goldLight: '#F5EDE8',      // Light warm bg

  // === Background Colors ===
  bg: '#FFFFFF',             // Pure white — main page background
  bgWarm: '#F5EDE8',         // Warm cream — card sections
  bgCoral: '#FAF0ED',        // Rose tint — highlighted sections
  bgGold: '#F5EDE8',         // Warm tint — featured sections

  // === Card & Surface ===
  card: '#FFFFFF',           // Card background
  cardHover: '#FAF5F2',      // Card hover
  border: '#E5D5CD',         // Warm light gray — borders, dividers
  borderStrong: '#D5C5BD',   // Stronger border

  // === Text Colors ===
  text: '#2D1F1F',           // Warm dark brown — primary text
  textSecondary: '#7A6B6B',  // Warm gray — secondary text
  textMuted: '#9A8B8B',      // Light warm gray — placeholder, disabled
  textInverse: '#FFFFFF',    // White text on dark backgrounds

  // === Semantic Colors ===
  success: '#5B8C5A',        // Muted green — positive growth
  successLight: '#E8F0E8',   // Light green bg
  danger: '#C44545',         // Muted red — negative/decline
  dangerLight: '#F5E5E5',    // Light red bg
  warning: '#C47A3A',        // Warm amber — warning
  warningLight: '#F5EDE0',   // Light amber bg
  info: '#5A7A9C',           // Muted blue — informational

  // === Extended Colors ===
  teal: '#5A8C8B',           // Muted teal — rating 4.0-4.5

  // === Data Visualization Palette ===
  chart: [
    '#8B354A', '#A33D52', '#C47A5A', '#5B8C5A',
    '#5A7A9C', '#7A6B9C', '#A36B8A', '#C47A3A',
    '#5A8C8B', '#6B6B9C',
  ],

  // === Sidebar/Nav (warm dark theme) ===
  navBg: '#1A1212',
  navActive: '#8B354A',

  // === Shadows ===
  shadow: '0 1px 3px rgba(45,31,31,0.06)',
  shadowHover: '0 4px 12px rgba(45,31,31,0.10)',
};

// Tailwind class helpers for common patterns
export const LUTE = {
  card: 'bg-white rounded-xl shadow-sm border border-[#E5D5CD]',
  cardHover: 'hover:border-[#8B354A]/30 hover:shadow-md transition-all duration-200',
  tag: 'px-2.5 py-0.5 rounded-full text-[11px] font-medium',
  tagCoral: 'bg-[#FAF0ED] text-[#8B354A]',
  tagGold: 'bg-[#F5EDE8] text-[#C47A5A]',
  tagGreen: 'bg-[#E8F0E8] text-[#5B8C5A]',
  tagRed: 'bg-[#F5E5E5] text-[#C44545]',
  tagGray: 'bg-[#F5F0EE] text-[#7A6B6B]',
  heading: 'text-[#2D1F1F] font-semibold',
  text: 'text-[#7A6B6B] text-xs',
  badge: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
  buttonCoral: 'bg-[#8B354A] hover:bg-[#6B2A3A] text-white transition-colors',
  buttonRed: 'bg-[#A33D52] hover:bg-[#8B354A] text-white transition-colors',
  buttonGhost: 'bg-transparent border border-[#E5D5CD] hover:border-[#8B354A] text-[#7A6B6B] hover:text-[#8B354A] transition-colors',
  trendUp: 'text-[#5B8C5A] flex items-center gap-0.5',
  trendDown: 'text-[#C44545] flex items-center gap-0.5',
};
