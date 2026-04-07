import { type TemplateConfig } from '@/lib/website-templates';
import { NavigationBar } from './sections/NavigationBar';
import { HeroSection } from './sections/HeroSection';
import { AboutSection } from './sections/AboutSection';
import { PortfolioSection } from './sections/PortfolioSection';
import { ServicesSection } from './sections/ServicesSection';
import { TestimonialsSection } from './sections/TestimonialsSection';
import { ContactSection } from './sections/ContactSection';
import { FooterSection } from './sections/FooterSection';

interface WebsitePreviewProps {
  template: TemplateConfig;
  studioName?: string;
  tagline?: string;
}

export function WebsitePreview({ template, studioName = 'Colour Store', tagline = 'Wedding Photography' }: WebsitePreviewProps) {
  return (
    <div className="w-full overflow-hidden" style={{ backgroundColor: template.colors.bg }}>
      <NavigationBar template={template} studioName={studioName} />
      <HeroSection template={template} studioName={studioName} tagline={tagline} />
      <AboutSection template={template} id="about" />
      <PortfolioSection template={template} id="portfolio" />
      <ServicesSection template={template} id="services" />
      <TestimonialsSection template={template} id="testimonials" />
      <ContactSection template={template} id="contact" />
      <FooterSection template={template} studioName={studioName} />
    </div>
  );
}
