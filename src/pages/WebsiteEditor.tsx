import { useState } from "react";
import { WebsiteImageGridUploader } from "@/components/website-editor/WebsiteImageUploader";
import { WebsiteHero } from "@/components/website/WebsiteHero";
import { useAuth } from "@/lib/auth";

const getBranding = (data: any) => ({
  studio_name: data?.hero?.title || "Studio",
  display_name: data?.hero?.tagline || "",
  cover_url: data?.hero?.cover ? `${data.hero.cover}?v=${data.hero.coverUpdatedAt || 1}` : null,
  studio_logo_url: "",
  studio_accent_color: "#c6a96b", // more luxury gold
});

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
    <div
      style={{
        background: "#0a0a0a",
        color: "#fff",
        padding: 20,
        fontFamily: "Helvetica Neue, sans-serif",
      }}
    >
      {/* ================= UPLOAD ================= */}
      <h2 style={{ marginBottom: 10 }}>Upload Photos</h2>

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
      <div style={{ marginTop: 50 }}>
        <input
          placeholder="Studio Name"
          value={data.hero.title}
          onChange={(e) =>
            setData({
              ...data,
              hero: { ...data.hero, title: e.target.value },
            })
          }
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 10,
            background: "#111",
            border: "1px solid #333",
            color: "#fff",
          }}
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
          style={{
            width: "100%",
            padding: 12,
            background: "#111",
            border: "1px solid #333",
            color: "#fff",
          }}
        />
      </div>

      {/* ================= PREVIEW ================= */}
      <div style={{ marginTop: 80 }}>
        {/* HERO */}
        <div style={{ position: "relative" }}>
          <WebsiteHero branding={getBranding(data)} id="hero" template="vows-elegance" />

          {/* 🔥 CINEMATIC TEXT OVERLAY */}
          <div
            style={{
              position: "absolute",
              bottom: "15%",
              width: "100%",
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            <h1
              style={{
                fontSize: "42px",
                letterSpacing: "6px",
                fontWeight: 300,
              }}
            >
              {data.hero.title}
            </h1>

            <p
              style={{
                marginTop: 10,
                fontSize: "14px",
                letterSpacing: "3px",
                color: "#c6a96b",
              }}
            >
              {data.hero.tagline}
            </p>
          </div>
        </div>

        {/* ================= STORY FLOW ================= */}
        <div style={{ marginTop: 100 }}>
          {data.cinematic.map((img: string, i: number) => {
            // full cinematic blocks
            if (i % 6 !== 0) {
              return (
                <img
                  key={i}
                  src={`${img}?v=${i}`}
                  style={{
                    width: "100%",
                    marginBottom: 80,
                    objectFit: "cover",
                    transition: "0.4s",
                  }}
                />
              );
            }

            // premium split layout
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 20,
                  marginBottom: 100,
                }}
              >
                <img
                  src={`${img}?v=${i}`}
                  style={{
                    width: "50%",
                    objectFit: "cover",
                  }}
                />
                {data.cinematic[i + 1] && (
                  <img
                    src={`${data.cinematic[i + 1]}?v=${i}`}
                    style={{
                      width: "50%",
                      objectFit: "cover",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WebsiteEditor;
