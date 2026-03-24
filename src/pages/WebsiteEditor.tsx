import { useState } from "react";
import { WebsiteImageUploader, WebsiteImageGridUploader } from "@/components/website-editor/WebsiteImageUploader";
import { WebsiteHero } from "@/components/website/WebsiteHero";
import { useAuth } from "@/lib/auth";

const WebsiteEditor = () => {
  const { user } = useAuth();

  // ✅ CLEAN STATE
  const [data, setData] = useState<any>({
    hero: {
      title: "Colour Store",
      tagline: "Colours that inspire",
      cover: null,
      coverUpdatedAt: Date.now(),
    },
    portfolio: [],
  });

  if (!user) return null;

  return (
    <div style={{ padding: 20 }}>
      {/* ================= HERO EDITOR ================= */}
      <h2>Hero Section</h2>

      <input
        placeholder="Title"
        value={data.hero.title}
        onChange={(e) =>
          setData({
            ...data,
            hero: { ...data.hero, title: e.target.value },
          })
        }
      />

      <input
        placeholder="Tagline"
        value={data.hero.tagline}
        onChange={(e) =>
          setData({
            ...data,
            hero: { ...data.hero, tagline: e.target.value },
          })
        }
      />

      <WebsiteImageUploader
        value={data.hero.cover}
        onChange={(url) =>
          setData({
            ...data,
            hero: {
              ...data.hero,
              cover: url,
              coverUpdatedAt: Date.now(), // ✅ FIXED CACHE
            },
          })
        }
        userId={user.id}
        folder="hero"
      />

      {/* ================= PORTFOLIO EDITOR ================= */}
      <h2 style={{ marginTop: 40 }}>Portfolio</h2>

      <WebsiteImageGridUploader
        values={data.portfolio}
        onChange={(urls) =>
          setData({
            ...data,
            portfolio: urls,
          })
        }
        userId={user.id}
        folder="portfolio"
      />

      {/* ================= PREVIEW ================= */}
      <h2 style={{ marginTop: 50 }}>Preview</h2>

      {/* HERO PREVIEW */}
      <WebsiteHero
        branding={{
          studio_name: data.hero.title,
          display_name: data.hero.tagline,
          cover_url: data.hero.cover ? `${data.hero.cover}?v=${data.hero.coverUpdatedAt}` : null,
        }}
        id="hero"
        template="vows-elegance"
      />

      {/* PORTFOLIO PREVIEW */}
      <div style={{ marginTop: 40 }}>
        {data.portfolio.map((img: string, i: number) => (
          <img
            key={i}
            src={`${img}?v=${i}`}
            style={{
              width: "100%",
              marginBottom: 10,
              borderRadius: 8,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default WebsiteEditor;
