const renderSection = (sectionId: string) => {
  switch (sectionId) {
    case "hero": {
      const cover = websiteImages.hero_cover || coverUrl;

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
        <div className="py-16 text-center opacity-30" style={{ color: tmpl.textSecondary }}>
          No albums yet
        </div>
      );

    case "about":
      return bio ? (
        <WebsiteAbout key="about" id="about" template={websiteTemplate} branding={branding} />
      ) : (
        <div className="py-16 text-center opacity-30" style={{ color: tmpl.textSecondary }}>
          Add a bio
        </div>
      );

    case "featured":
      return (
        <>
          {portfolioPhotos.length > 0 && (
            <WebsitePortfolioImages
              key="portfolio-images"
              id="portfolio-images"
              photos={portfolioPhotos}
              accent={accentColor}
              template={websiteTemplate}
            />
          )}
          <WebsiteFeatured
            key="featured"
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
        <WebsiteServices
          key="services"
          id="services"
          services={servicesData}
          accent={accentColor}
          template={websiteTemplate}
        />
      ) : (
        <div className="py-16 text-center opacity-30">Add services</div>
      );

    case "testimonials":
      return testimonialsData.length > 0 ? (
        <WebsiteTestimonials
          key="testimonials"
          id="testimonials"
          testimonials={testimonialsData}
          accent={accentColor}
          template={websiteTemplate}
        />
      ) : (
        <div className="py-16 text-center opacity-30">Add testimonials</div>
      );

    case "latest_works":
      return (
        <WebsiteLatestWorks
          key="latest_works"
          id="latest-works"
          template={websiteTemplate}
          images={websiteImages.latest_works_photos || []}
          accent={accentColor}
          title={websiteImages.latest_works_title || "My Latest Works"}
        />
      );

    case "newsletter":
      return (
        <WebsiteNewsletter
          key="newsletter"
          id="newsletter"
          template={websiteTemplate}
          title={websiteImages.newsletter_title}
          description={websiteImages.newsletter_description}
          buttonText={websiteImages.newsletter_button_text}
        />
      );

    case "image_strip":
      return (
        <WebsiteImageStrip
          key="image_strip"
          id="image-strip"
          template={websiteTemplate}
          images={websiteImages.image_strip_photos || []}
        />
      );

    case "contact":
      return (
        <WebsiteContact
          key="contact"
          id="contact"
          template={websiteTemplate}
          branding={branding}
          photographerId={user?.id}
        />
      );

    default:
      return null;
  }
};
