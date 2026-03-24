import { useState } from "react";
import { WebsiteImageGridUploader } from "@/components/website-editor/WebsiteImageUploader";
import { WebsiteHero } from "@/components/website/WebsiteHero";
import { useAuth } from "@/lib/auth";

// 🔥 SAFE BRANDING BUILDER (IMPORTANT FIX)
const getBranding = (data: any) => ({
  studio_name: data?.hero?.title || "Studio",
  display_name: data?.hero?.tagline || "",
  cover_url: data?.hero?.cover ? `${data.hero.cover}?v=${data.hero.coverUpdatedAt || 1}` : null,
  studio_logo_url: "", // ✅ REQUIRED
  studio_accent_color: "#b08d57", // ✅ REQUIRED
});

// 🔥 AUTO GENERATOR
function generateHomepage(images: string[]) {
  if (!images || images.length === 0) {
    return {
      hero: null,
      portfolio: [],
      cinematic: [],
    };
  }

  return {
    hero: images[0],
    portfolio: images.slice(1),
    cinematic: images,
  };
}

const WebsiteEditor = () => {
  const { user } = useAuth();

  const [data, setData] = useState<any>({
    hero: {
      title: "Colour Store",
      tagline: "Colours that inspire",
      cover: null,
      coverUpdatedAt: Date.now(),
    },
    portfolio: [],
    cinematic: [],
  });

  if (!user) return null;

  return (
    <div style={{ padding: 20 }}>
      {/* ================= UPLOAD ================= */}
      <h2>Upload Photos (Auto Homepage)</h2>

      <WebsiteImageGridUploader
        values={data.portfolio}
        onChange={(urls) => {
          const result = generateHomepage(urls);

          setData({
            ...data,
            hero: {
              ...data.hero,
              cover: result.hero,
              coverUpdatedAt: Date.now(),
            },
            portfolio: result.portfolio,
            cinematic: result.cinematic,
          });
        }}
        userId={user.id}
        folder="homepage"
      />

      {/* ================= TEXT ================= */}
      <h2 style={{ marginTop: 40 }}>Edit Text</h2>

      <input
        placeholder="Studio Name"
        value={data.hero.title}
        onChange={(e) =>
          setData({
            ...data,
            hero: { ...data.hero, title: e.target.value },
          })
        }
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
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
        style={{ width: "100%", padding: 10 }}
      />

      {/* ================= PREVIEW ================= */}
      <h2 style={{ marginTop: 50 }}>Live Preview</h2>

      <WebsiteHero
        branding={getBranding(data)} // ✅ FIXED HERE
        id="hero"
        template="vows-elegance"
      />

      {/* ================= CINEMATIC ================= */}
      <div style={{ marginTop: 40 }}>
        {data.cinematic.map((img: string, i: number) => {
          if (i % 5 !== 0) {
            return (
              <img
                key={i}
                src={`${img}?v=${i}`}
                style={{
                  width: "100%",
                  marginBottom: 40,
                  borderRadius: 8,
                }}
              />
            );
          }

          return (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 10,
                marginBottom: 40,
              }}
            >
              <img src={`${img}?v=${i}`} style={{ width: "50%", borderRadius: 8 }} />
              {data.cinematic[i + 1] && (
                <img src={`${data.cinematic[i + 1]}?v=${i}`} style={{ width: "50%", borderRadius: 8 }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WebsiteEditor;
