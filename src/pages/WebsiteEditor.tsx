import { useState, useEffect } from "react";
import { WebsiteImageGridUploader } from "@/components/website-editor/WebsiteImageUploader";
import { useAuth } from "@/lib/auth";

const inputStyle = {
  width: "100%",
  padding: "14px",
  marginBottom: "12px",
  background: "#111",
  border: "1px solid #333",
  color: "#fff",
  borderRadius: 4,
};

const WebsiteEditor = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [activeStory, setActiveStory] = useState<any>(null);

  const [data, setData] = useState<any>({
    hero: {
      title: "",
      tagline: "",
      cover: null,
    },
    cinematic: [],
    stories: [],
  });

  if (!user) return null;

  /* FADE ANIMATION */
  useEffect(() => {
    const elements = document.querySelectorAll(".fade-in");

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).classList.add("visible");
        }
      });
    });

    elements.forEach((el) => observer.observe(el));
  }, []);

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh" }}>
      {/* TABS */}
      <div style={{ display: "flex", justifyContent: "center", gap: 10, padding: 20 }}>
        <button onClick={() => setActiveTab("edit")}>Edit</button>
        <button onClick={() => setActiveTab("preview")}>Preview</button>
      </div>

      {/* ================= EDIT (LANDING BUILDER) ================= */}
      {activeTab === "edit" && (
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "40px 20px" }}>
          {/* HEADLINE */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "38px",
                letterSpacing: "6px",
                fontWeight: 400,
                marginBottom: 20,
              }}
            >
              Craft Your Timeless Showcase
            </h1>

            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "14px",
                opacity: 0.7,
                lineHeight: 1.6,
              }}
            >
              Upload your photographs — and watch them transform into a cinematic, elegant website. Every image becomes
              part of a story. Your story.
            </p>
          </div>

          {/* UPLOAD CENTER */}
          <div style={{ marginBottom: 30 }}>
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
          </div>

          {/* TEXT INPUTS */}
          <input
            placeholder="Studio Name"
            value={data.hero.title}
            onChange={(e) =>
              setData({
                ...data,
                hero: { ...data.hero, title: e.target.value },
              })
            }
            style={inputStyle}
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
            style={inputStyle}
          />

          {/* STORIES */}
          <button
            onClick={() =>
              setData({
                ...data,
                stories: [...data.stories, { name: "Couple", location: "", images: [] }],
              })
            }
            style={{
              marginTop: 20,
              marginBottom: 20,
              padding: 12,
              width: "100%",
              background: "#1a1a1a",
              color: "#fff",
              border: "1px solid #333",
            }}
          >
            + Add Couple
          </button>

          {data.stories.map((story: any, i: number) => (
            <div key={i} style={{ marginBottom: 30 }}>
              <input
                value={story.name}
                onChange={(e) => {
                  const updated = [...data.stories];
                  updated[i].name = e.target.value;
                  setData({ ...data, stories: updated });
                }}
                style={inputStyle}
              />

              <input
                value={story.location}
                onChange={(e) => {
                  const updated = [...data.stories];
                  updated[i].location = e.target.value;
                  setData({ ...data, stories: updated });
                }}
                style={inputStyle}
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

          {/* PUBLISH */}
          <button
            onClick={() => {
              localStorage.setItem("published-site", JSON.stringify(data));
              alert("Website Published ✅");
            }}
            style={{
              marginTop: 20,
              padding: 14,
              background: "#c6a96b",
              border: "none",
              width: "100%",
              color: "#000",
              fontWeight: 500,
            }}
          >
            Publish Website
          </button>
        </div>
      )}

      {/* ================= PREVIEW ================= */}
      {activeTab === "preview" && (
        <div style={{ fontFamily: "'Playfair Display', serif" }}>
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
              <div
                key={i}
                className="fade-in"
                style={{ marginBottom: 120, cursor: "pointer" }}
                onClick={() => setActiveStory(story)}
              >
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
            <p className="fade-in">“Every moment beautifully captured.”</p>
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

      {/* STORY VIEW */}
      {activeStory && (
        <div style={{ position: "fixed", inset: 0, background: "#000", overflow: "auto" }}>
          <button onClick={() => setActiveStory(null)} style={{ margin: 20 }}>
            Close
          </button>

          {activeStory.images.map((img: string, i: number) => (
            <img key={i} src={img} style={{ width: "100%", marginBottom: 20 }} />
          ))}
        </div>
      )}
    </div>
  );
};

export default WebsiteEditor;
