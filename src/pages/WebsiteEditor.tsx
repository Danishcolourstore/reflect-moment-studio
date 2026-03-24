import { useState } from "react";

import { WebsiteHero } from "@/components/website/WebsiteHero";
import { WebsitePortfolio } from "@/components/website/WebsitePortfolio";
import { WebsiteFeatured } from "@/components/website/WebsiteFeatured";
import { WebsiteServices } from "@/components/website/WebsiteServices";
import { WebsiteAbout } from "@/components/website/WebsiteAbout";
import { WebsiteContact } from "@/components/website/WebsiteContact";
import { WebsiteSocialBar } from "@/components/website/WebsiteSocialBar";
import { WebsiteTestimonials } from "@/components/website/WebsiteTestimonials";
import { WebsiteAlbums } from "@/components/website/WebsiteAlbums";
import { WebsitePortfolioImages } from "@/components/website/WebsitePortfolioImages";
import { WebsiteLatestWorks } from "@/components/website/WebsiteLatestWorks";
import { WebsiteNewsletter } from "@/components/website/WebsiteNewsletter";
import { WebsiteImageStrip } from "@/components/website/WebsiteImageStrip";

export default function WebsiteEditor() {
  // 🔧 minimal states to avoid errors
  const [websiteImages] = useState<any>({});
  const [coverUrl] = useState<string | null>(null);
  const [branding] = useState<any>({});
  const [websiteTemplate] = useState<any>("vows-elegance");

  const [instagram] = useState("");
  const [websiteUrl] = useState("");
  const [whatsapp] = useState("");
  const [email] = useState("");

  const [accentColor] = useState("#b08d57");

  const [events] = useState<any[]>([]);
  const [coverPhotos] = useState<any>({});
  const [portfolioLayout] = useState<any>("grid");

  const [albums] = useState<any[]>([]);
  const [bio] = useState("");
  const [portfolioPhotos] = useState<any[]>([]);
  const [featuredEvents] = useState<any[]>([]);

  const [servicesData] = useState<any[]>([]);
  const [testimonialsData] = useState<any[]>([]);

  const [user] = useState<any>({ id: "1" });

  // ✅ FIXED renderSection
  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "hero": {
        const cover = websiteImages?.hero_cover || coverUrl;

        return (
          <WebsiteHero
            key="hero"
            branding={{
              ...branding,
              cover_url: cover ? `${cover}?v=${Date.now()}` : null,
            }}
            id="hero"
            template={websiteTemplate}
          />
        );
      }

      case "social":
        return (
          <WebsiteSocialBar
            key="social"
            id="social"
            instagram={instagram}
            website={websiteUrl}
            whatsapp={whatsapp}
            email={email}
            accent={accentColor}
            template={websiteTemplate}
          />
        );

      case "portfolio":
        return (
          <WebsitePortfolio
            key="portfolio"
            id="portfolio"
            events={events}
            coverPhotos={coverPhotos}
            accent={accentColor}
            layout={portfolioLayout}
            onNavigate={() => {}}
            template={websiteTemplate}
          />
        );

      case "albums":
        return albums.length > 0 ? (
          <WebsiteAlbums key="albums" id="albums" albums={albums} accent={accentColor} template={websiteTemplate} />
        ) : (
          <div>No albums</div>
        );

      case "about":
        return bio ? <WebsiteAbout id="about" template={websiteTemplate} branding={branding} /> : <div>No bio</div>;

      case "featured":
        return (
          <>
            {portfolioPhotos.length > 0 && (
              <WebsitePortfolioImages
                id="portfolio-images"
                photos={portfolioPhotos}
                accent={accentColor}
                template={websiteTemplate}
              />
            )}
            <WebsiteFeatured
              id="featured"
              events={featuredEvents}
              coverPhotos={coverPhotos}
              accent={accentColor}
              onNavigate={() => {}}
              template={websiteTemplate}
            />
          </>
        );

      case "services":
        return servicesData.length > 0 ? (
          <WebsiteServices id="services" services={servicesData} accent={accentColor} template={websiteTemplate} />
        ) : (
          <div>No services</div>
        );

      case "testimonials":
        return testimonialsData.length > 0 ? (
          <WebsiteTestimonials
            id="testimonials"
            testimonials={testimonialsData}
            accent={accentColor}
            template={websiteTemplate}
          />
        ) : (
          <div>No testimonials</div>
        );

      case "latest_works":
        return (
          <WebsiteLatestWorks
            id="latest-works"
            template={websiteTemplate}
            images={websiteImages?.latest_works_photos || []}
            accent={accentColor}
            title={websiteImages?.latest_works_title || "My Latest Works"}
          />
        );

      case "newsletter":
        return (
          <WebsiteNewsletter
            id="newsletter"
            template={websiteTemplate}
            title={websiteImages?.newsletter_title}
            description={websiteImages?.newsletter_description}
            buttonText={websiteImages?.newsletter_button_text}
          />
        );

      case "image_strip":
        return (
          <WebsiteImageStrip
            id="image-strip"
            template={websiteTemplate}
            images={websiteImages?.image_strip_photos || []}
          />
        );

      case "contact":
        return <WebsiteContact id="contact" template={websiteTemplate} branding={branding} photographerId={user?.id} />;

      default:
        return null;
    }
  };

  // 🔥 render
  return (
    <div>
      {renderSection("hero")}
      {renderSection("portfolio")}
      {renderSection("about")}
    </div>
  );
}
