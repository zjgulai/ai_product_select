// Lute Color System — Morandi Rose + Warm Editorial Theme
// Brand palette: #D75C70 (soft rose) + #FDF8F6 (warm ivory)

export const LC = {
  // === Primary Brand Colors ===
  primary: '#D75C70',        // Soft rose — main brand color
  primaryLight: '#FCF5F2',   // Warm soft background for highlighted states
  primaryDark: '#C44A5E',    // Darker rose — hover states

  // === Accent / CTA Colors ===
  accent: '#C44A5E',         // CTA buttons, key actions
  accentHover: '#D75C70',    // Hover / alternate emphasis
  gold: '#D8BE78',           // Warm muted gold — badges, highlights
  goldLight: '#F6EEE0',      // Light gold-tinted background

  // === Background Colors ===
  bg: '#FDF8F6',             // Main page background
  bgWarm: '#FCF5F2',         // Warm soft section background
  bgCoral: '#FAF1F0',        // Rose tint — highlighted sections
  bgGold: '#F8F3E8',         // Warm tint — featured sections

  // === Card & Surface ===
  card: '#FFFFFF',           // Card background
  cardHover: '#FCF7F5',      // Card hover
  border: '#E7D9D3',         // Warm light border
  borderStrong: '#D8C6BE',   // Stronger border

  // === Text Colors ===
  text: '#35141A',           // Warm dark brown — primary text
  textSecondary: '#59585E',  // Warm gray — secondary text
  textMuted: '#9B9795',      // Light warm gray — placeholder, disabled
  textInverse: '#FFFFFF',    // White text on dark backgrounds

  // === Semantic Colors ===
  success: '#6E966E',        // Muted green — positive growth
  successLight: '#EAF2EA',   // Light green bg
  danger: '#B86A72',         // Muted red — negative/decline
  dangerLight: '#F6EAEA',    // Light red bg
  warning: '#C6A56B',        // Warm amber — warning
  warningLight: '#F6F0E3',   // Light amber bg
  info: '#7E92A8',           // Muted blue — informational

  // === Extended Colors ===
  teal: '#8FA59A',           // Muted teal — secondary data accent

  // === Data Visualization Palette ===
  chart: [
    '#D75C70', '#6E966E', '#D8BE78', '#7E92A8',
    '#A98795', '#8FA59A', '#C58D7B', '#8E7C6D',
  ],

  // === Sidebar/Nav ===
  navBg: '#F8F1EE',
  navActive: '#D75C70',

  // === Shadows ===
  shadow: '0 1px 3px rgba(53,20,26,0.05)',
  shadowHover: '0 8px 24px rgba(53,20,26,0.08)',
};

// Tailwind class helpers for common patterns
export const LUTE = {
  card: 'bg-white rounded-xl shadow-sm border border-[#E7D9D3]',
  cardHover: 'hover:border-[#D75C70]/30 hover:shadow-md transition-all duration-200',
  tag: 'px-2.5 py-0.5 rounded-full text-[11px] font-medium',
  tagCoral: 'bg-[#FAF1F0] text-[#D75C70]',
  tagGold: 'bg-[#F6EEE0] text-[#D8BE78]',
  tagGreen: 'bg-[#EAF2EA] text-[#6E966E]',
  tagRed: 'bg-[#F6EAEA] text-[#B86A72]',
  tagGray: 'bg-[#F6F0ED] text-[#59585E]',
  heading: 'text-[#35141A] font-semibold',
  text: 'text-[#59585E] text-xs',
  badge: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
  buttonCoral: 'bg-[#D75C70] hover:bg-[#C44A5E] text-white transition-colors',
  buttonRed: 'bg-[#C44A5E] hover:bg-[#D75C70] text-white transition-colors',
  buttonGhost: 'bg-transparent border border-[#E7D9D3] hover:border-[#D75C70] text-[#59585E] hover:text-[#D75C70] transition-colors',
  trendUp: 'text-[#6E966E] flex items-center gap-0.5',
  trendDown: 'text-[#B86A72] flex items-center gap-0.5',
};
