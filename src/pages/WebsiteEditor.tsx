import { useState } from "react";
import { WebsiteImageGridUploader } from "@/components/website-editor/WebsiteImageUploader";
import { WebsiteHero } from "@/components/website/WebsiteHero";
import { useAuth } from "@/lib/auth";

const getBranding = (data: any) => ({
  studio_name: data.hero.title || "Studio",
  display_name: data.hero.tagline || "",
  cover_url: data.hero.cover ? `${data.hero.cover}?v=${data.hero.coverUpdatedAt}` : null,
  studio_logo_url: "",
  studio_accent_color: "#c6a96b",
});

function generateHomepage(images: string[]) {
  return {
    hero: images[0] || null,
    cinematic: images,
  };
}

const WebsiteEditor = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const [data, setData] = useState<any>({
    hero: {
      title: "Colour Store",
      tagline: "Colours that inspire",
      cover: null,
      coverUpdatedAt: Date.now(),
    },
    cinematic: [],
    stories: [],
  });

  if (!user) return null;

  return (
    <div style={{ background: "#0a0a0a", color: "#fff", padding: 20 }}>
      {/* TABS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 30 }}>
        <button onClick={() => setActiveTab("edit")}>Edit</button>
        <button onClick={() => setActiveTab("preview")}>Preview</button>
      </div>

      {/* ================= EDIT ================= */}
      {activeTab === "edit" && (
        <div>
          <h2>Upload Photos</h2>

          <WebsiteImageGridUploader
            values={data.cinematic}
            onChange={(urls) => {
              const result = generateHomepage(urls);

              setData({
                ...data,
                hero: {
                  ...data.hero,
                  cover: result.hero,
                  coverUpdatedAt: Date.now(),
                },
                cinematic: result.cinematic,
              });
            }}
            userId={user.id}
            folder="homepage"
          />

          <div style={{ marginTop: 30 }}>
            <input
              placeholder="Studio Name"
              value={data.hero.title}
              onChange={(e) =>
                setData({
                  ...data,
                  hero: { ...data.hero, title: e.target.value },
                })
              }
              style={{ width: "100%", marginBottom: 10 }}
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
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ marginTop: 40 }}>
            <button
              onClick={() =>
                setData({
                  ...data,
                  stories: [
                    ...data.stories,
                    {
                      name: `Couple ${data.stories.length + 1}`,
                      location: "",
                      images: [],
                    },
                  ],
                })
              }
            >
              + Add Couple
            </button>

            {data.stories.map((story: any, i: number) => (
              <div key={i} style={{ marginTop: 20 }}>
                <input
                  value={story.name}
                  onChange={(e) => {
                    const updated = [...data.stories];
                    updated[i].name = e.target.value;
                    setData({ ...data, stories: updated });
                  }}
                />

                <input
                  value={story.location}
                  onChange={(e) => {
                    const updated = [...data.stories];
                    updated[i].location = e.target.value;
                    setData({ ...data, stories: updated });
                  }}
                />

                <WebsiteImageGridUploader
                  values={story.images}
                  onChange={(urls) => {
                    const updated = [...data.stories];
                    updated[i].images = urls;
                    setData({ ...data, stories: updated });
                  }}
                  userId={user.id}
                  folder={`story-${i}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= PREVIEW ================= */}
      {activeTab === "preview" && (
        <div style={{ background: "#000", color: "#fff", fontFamily: "'Playfair Display', serif" }}>
          {/* HERO */}
          {data.hero.cover && (
            <div style={{ height: "92vh", position: "relative" }}>
              <img src={data.hero.cover} style={{ width: "100%", height: "100%", objectFit: "cover" }} />

              <div
                style={{
                  position: "absolute",
                  bottom: "12%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    letterSpacing: "5px",
                    fontSize: "12px",
                    opacity: 0.7,
                  }}
                >
                  {data.hero.tagline}
                </p>

                <h1
                  style={{
                    fontSize: "52px",
                    letterSpacing: "10px",
                    fontWeight: 400,
                  }}
                >
                  {data.hero.title}
                </h1>
              </div>
            </div>
          )}

          <div style={{ height: 140 }} />

          {/* INTRO */}
          <div
            style={{
              maxWidth: 640,
              margin: "0 auto",
              textAlign: "center",
              fontFamily: "'Inter', sans-serif",
              fontSize: "15px",
              lineHeight: 1.8,
              opacity: 0.75,
            }}
          >
            <p>Every wedding is not just an event — it is a story, a feeling, a memory meant to live forever.</p>
          </div>

          <div style={{ height: 140 }} />

          {/* STORIES */}
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
            {data.stories.map((story: any, i: number) => (
              <div key={i} style={{ marginBottom: 140 }}>
                {story.images[0] && (
                  <img
                    src={story.images[0]}
                    style={{
                      width: "100%",
                      height: "72vh",
                      objectFit: "cover",
                      marginBottom: 30,
                    }}
                  />
                )}

                <div style={{ textAlign: "center" }}>
                  <h2
                    style={{
                      fontSize: "28px",
                      letterSpacing: "4px",
                      fontWeight: 400,
                      marginBottom: 8,
                    }}
                  >
                    {story.name}
                  </h2>

                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "13px",
                      letterSpacing: "2px",
                      opacity: 0.6,
                    }}
                  >
                    {story.location}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* FOOTER */}
          <div
            style={{
              marginTop: 180,
              paddingBottom: 60,
              textAlign: "center",
              fontFamily: "'Inter', sans-serif",
              fontSize: "12px",
              letterSpacing: "2px",
              opacity: 0.5,
            }}
          >
            © {new Date().getFullYear()} {data.hero.title}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebsiteEditor;
