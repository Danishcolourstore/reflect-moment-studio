import { useState, useEffect } from "react";
import { WebsiteImageGridUploader } from "@/components/website-editor/WebsiteImageUploader";
import { useAuth } from "@/lib/auth";

/* ---------- STYLES ---------- */
const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "10px",
  background: "#111",
  border: "1px solid #333",
  color: "#fff",
};

/* ---------- COMPONENT ---------- */
const WebsiteEditor = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [activeStory, setActiveStory] = useState<any>(null);

  const [data, setData] = useState<any>({
    hero: {
      title: "Colour Store",
      tagline: "Colours that inspire",
      cover: null,
    },
    cinematic: [],
    stories: [],
  });

  if (!user) return null;

  /* ---------- FADE ANIMATION ---------- */
  useEffect(() => {
    const elements = document.querySelectorAll(".fade-in");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("visible");
          }
        });
      },
      { threshold: 0.1 },
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  /* ---------- RENDER ---------- */
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
              setData({
                ...data,
                cinematic: urls,
                hero: { ...data.hero, cover: urls[0] },
              });
            }}
            userId={user.id}
            folder="homepage"
          />

          <input
            placeholder="Studio Name"
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

          <div style={{ marginTop: 30 }}>
            <button
              onClick={() =>
                setData({
                  ...data,
                  stories: [...data.stories, { name: "Couple", location: "", images: [] }],
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

          {/* PUBLISH */}
          <button
            onClick={() => {
              localStorage.setItem("published-site", JSON.stringify(data));
              alert("Published ✅");
            }}
            style={{
              marginTop: 40,
              padding: 12,
              background: "#c6a96b",
              border: "none",
            }}
          >
            Publish Website
          </button>
        </div>
      )}

      {/* ================= PREVIEW ================= */}
      {activeTab === "preview" && (
        <div style={{ background: "#000", fontFamily: "'Playfair Display', serif" }}>
          {/* HERO */}
          {data.hero.cover && (
            <div style={{ height: "90vh", position: "relative" }}>
              <img src={data.hero.cover} style={{ width: "100%", height: "100%", objectFit: "cover" }} />

              <div
                style={{
                  position: "absolute",
                  bottom: "10%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  textAlign: "center",
                }}
              >
                <p style={{ fontFamily: "'Inter'", letterSpacing: "4px" }}>{data.hero.tagline}</p>
                <h1 style={{ letterSpacing: "8px" }}>{data.hero.title}</h1>
              </div>
            </div>
          )}

          <div style={{ height: 120 }} />

          {/* STORIES */}
          <div style={{ maxWidth: 1100, margin: "auto" }}>
            {data.stories.map((story: any, i: number) => (
              <div key={i} className="fade-in" style={{ marginBottom: 120 }} onClick={() => setActiveStory(story)}>
                {story.images[0] && (
                  <img src={story.images[0]} style={{ width: "100%", height: "70vh", objectFit: "cover" }} />
                )}
                <h2 style={{ textAlign: "center" }}>{story.name}</h2>
              </div>
            ))}
          </div>

          {/* TESTIMONIALS */}
          <div style={{ textAlign: "center", marginTop: 120 }}>
            <h2>Testimonials</h2>
            <p className="fade-in">“Amazing work and beautiful memories.”</p>
          </div>

          {/* ENQUIRY */}
          <div style={{ textAlign: "center", marginTop: 120 }}>
            <h2>Enquire</h2>
            <div style={{ maxWidth: 400, margin: "auto" }}>
              <input placeholder="Name" style={inputStyle} />
              <input placeholder="Email" style={inputStyle} />
              <textarea placeholder="Message" style={inputStyle} />
            </div>
          </div>
        </div>
      )}

      {/* ================= STORY VIEW ================= */}
      {activeStory && (
        <div style={{ position: "fixed", inset: 0, background: "#000", overflow: "auto" }}>
          <button onClick={() => setActiveStory(null)}>Close</button>

          {activeStory.images.map((img: string, i: number) => (
            <img key={i} src={img} style={{ width: "100%", marginBottom: 20 }} />
          ))}
        </div>
      )}
    </div>
  );
};

export default WebsiteEditor;
