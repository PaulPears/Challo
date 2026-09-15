// src/config/theme.ts
// Official Challo Captain Theme & Design Tokens

export const COLORS = {
  // Brand Primary - Challo Gold / Yellow
  primary: '#E5A915',
  primaryLight: '#F5B014',
  primaryDark: '#C9900E',
  primaryMuted: '#FEF3C7',
  primarySoft: '#FFFBEB',

  // Dark & Neutral Accents
  dark: '#111827',
  darkSecondary: '#1F2937',
  darkTertiary: '#374151',
  white: '#FFFFFF',
  background: '#F8FAFC',
  cardBackground: '#FFFFFF',

  // Status & Feedback
  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.15)',
  error: '#EF4444',
  errorLight: 'rgba(239, 68, 68, 0.15)',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Text
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  textLight: '#F9FAFB',

  // Borders & Dividers
  border: '#E5E7EB',
  borderDark: '#D1D5DB',
  borderGold: '#E5A915',

  // Gradients
  gradientGold: ['#F5B014', '#E5A915'] as const,
  gradientDark: ['#1F2937', '#111827'] as const,
  gradientOnline: ['#10B981', '#059669'] as const,
};

export const BRAND = {
  name: 'Challo Captain',
  shortName: 'Challo',
  role: 'Captain',
  tagline: 'Ride with Pride',
  supportEmail: 'help.challo@gmail.com',
  officialEmail: 'support@challo.in',
  driverEmail: 'captain@challo.in',
  website: 'https://challo.in',
  downloadUrl: 'https://challo.in/download',
};

export default {
  colors: COLORS,
  brand: BRAND,
};
