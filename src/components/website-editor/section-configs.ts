// Section type definitions and their editable properties

export type SectionType =
  | 'hero'
  | 'rich-text'
  | 'image-gallery'
  | 'blog-grid'
  | 'testimonials'
  | 'team'
  | 'faq'
  | 'contact'
  | 'footer';

export interface SectionTabConfig {
  id: string;
  label: string;
  icon: string; // lucide icon name
}

export interface SectionSettings {
  // Common
  paddingTop: number;
  paddingBottom: number;
  backgroundColor: string;
  textColor: string;
  // Hero
  heading?: string;
  subtitle?: string;
  ctaText?: string;
  ctaVisible?: boolean;
  overlayOpacity?: number;
  heroImageUrl?: string;
  headingSize?: number;
  subtitleSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  // Gallery / Image
  columns?: number;
  gap?: number;
  borderRadius?: number;
  imageFit?: 'cover' | 'contain' | 'fill';
  // Testimonials
  cardCount?: number;
  showStars?: boolean;
  starCount?: number;
  cardBackground?: string;
  // Text
  bodyText?: string;
  bodySize?: number;
  lineHeight?: number;
  // Blog
  postsToShow?: number;
  showExcerpt?: boolean;
  // Contact
  showPhone?: boolean;
  showAddress?: boolean;
  buttonColor?: string;
  // Animation
  animationType?: 'none' | 'fade' | 'slide-up' | 'scale';
  animationDuration?: number;
}

export const DEFAULT_SECTION_SETTINGS: Record<SectionType, SectionSettings> = {
  hero: {
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: '#0a0a0a',
    textColor: '#ffffff',
    heading: 'Your Story, Beautifully Told',
    subtitle: 'Wedding & Portrait Photography',
    ctaText: 'View Portfolio',
    ctaVisible: true,
    overlayOpacity: 35,
    heroImageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1400',
    headingSize: 48,
    subtitleSize: 14,
    textAlign: 'center',
    animationType: 'fade',
    animationDuration: 600,
  },
  'rich-text': {
    paddingTop: 64,
    paddingBottom: 64,
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    heading: 'About Our Studio',
    bodyText: 'We believe every love story deserves to be told with artistry and intention. Based in Mumbai, we travel worldwide to document the most important moments of your life.',
    bodySize: 16,
    lineHeight: 1.8,
    textAlign: 'left',
    animationType: 'fade',
    animationDuration: 400,
  },
  'image-gallery': {
    paddingTop: 48,
    paddingBottom: 48,
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    columns: 3,
    gap: 8,
    borderRadius: 4,
    imageFit: 'cover',
    heading: 'Portfolio',
    animationType: 'fade',
    animationDuration: 400,
  },
  'blog-grid': {
    paddingTop: 48,
    paddingBottom: 48,
    backgroundColor: '#f8f8f8',
    textColor: '#1a1a1a',
    columns: 3,
    gap: 24,
    postsToShow: 6,
    showExcerpt: true,
    heading: 'Journal',
    animationType: 'none',
    animationDuration: 400,
  },
  testimonials: {
    paddingTop: 64,
    paddingBottom: 64,
    backgroundColor: '#faf7f2',
    textColor: '#1e1916',
    cardCount: 3,
    showStars: true,
    starCount: 5,
    cardBackground: '#ffffff',
    heading: 'What Clients Say',
    animationType: 'fade',
    animationDuration: 400,
  },
  team: {
    paddingTop: 48,
    paddingBottom: 48,
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    columns: 3,
    gap: 24,
    heading: 'Our Team',
    animationType: 'none',
    animationDuration: 400,
  },
  faq: {
    paddingTop: 48,
    paddingBottom: 48,
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    heading: 'Frequently Asked',
    animationType: 'none',
    animationDuration: 400,
  },
  contact: {
    paddingTop: 64,
    paddingBottom: 64,
    backgroundColor: '#faf7f2',
    textColor: '#1e1916',
    heading: "Let's Connect",
    showPhone: true,
    showAddress: true,
    buttonColor: '#1A1A1A',
    animationType: 'fade',
    animationDuration: 400,
  },
  footer: {
    paddingTop: 32,
    paddingBottom: 32,
    backgroundColor: '#0a0a0a',
    textColor: '#999999',
    heading: 'Studio Name',
    animationType: 'none',
    animationDuration: 0,
  },
};

export const SECTION_TABS: Record<SectionType, SectionTabConfig[]> = {
  hero: [
    { id: 'content', label: 'Content', icon: 'Type' },
    { id: 'media', label: 'Media', icon: 'Image' },
    { id: 'layout', label: 'Layout', icon: 'Layout' },
    { id: 'style', label: 'Style', icon: 'Palette' },
    { id: 'animation', label: 'Motion', icon: 'Sparkles' },
  ],
  'rich-text': [
    { id: 'content', label: 'Content', icon: 'Type' },
    { id: 'layout', label: 'Layout', icon: 'Layout' },
    { id: 'style', label: 'Style', icon: 'Palette' },
    { id: 'animation', label: 'Motion', icon: 'Sparkles' },
  ],
  'image-gallery': [
    { id: 'media', label: 'Media', icon: 'Image' },
    { id: 'layout', label: 'Layout', icon: 'Layout' },
    { id: 'style', label: 'Style', icon: 'Palette' },
    { id: 'animation', label: 'Motion', icon: 'Sparkles' },
  ],
  'blog-grid': [
    { id: 'content', label: 'Content', icon: 'Type' },
    { id: 'layout', label: 'Layout', icon: 'Layout' },
    { id: 'style', label: 'Style', icon: 'Palette' },
  ],
  testimonials: [
    { id: 'cards', label: 'Cards', icon: 'MessageSquare' },
    { id: 'layout', label: 'Layout', icon: 'Layout' },
    { id: 'style', label: 'Style', icon: 'Palette' },
  ],
  team: [
    { id: 'content', label: 'Members', icon: 'Users' },
    { id: 'layout', label: 'Layout', icon: 'Layout' },
    { id: 'style', label: 'Style', icon: 'Palette' },
  ],
  faq: [
    { id: 'content', label: 'Questions', icon: 'HelpCircle' },
    { id: 'style', label: 'Style', icon: 'Palette' },
  ],
  contact: [
    { id: 'content', label: 'Fields', icon: 'Type' },
    { id: 'style', label: 'Style', icon: 'Palette' },
  ],
  footer: [
    { id: 'content', label: 'Content', icon: 'Type' },
    { id: 'style', label: 'Style', icon: 'Palette' },
  ],
};

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: 'Hero',
  'rich-text': 'Text Block',
  'image-gallery': 'Gallery',
  'blog-grid': 'Blog Grid',
  testimonials: 'Testimonials',
  team: 'Team',
  faq: 'FAQ',
  contact: 'Contact',
  footer: 'Footer',
};
