import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

import { WebsiteHero } from "@/components/website/WebsiteHero";
import { WebsiteImageUploader } from "@/components/website-editor/WebsiteImageUploader";

export default function WebsiteEditor() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<any>({
    hero: {
      title: "",
      tagline: "",
      cover: null,
    },
  });

  // LOAD DATA
  useEffect(() => {
    if (!user) return;

    (async () => {
      const { data: res } = await supabase
        .from("studio_profiles")
        .select("website_data")
        .eq("user_id", user.id)
        .single();

      if (res?.website_data) {
        setData(res.website_data);
      }

      setLoading(false);
    })();
  }, [user]);

  // SAVE
  const save = async () => {
    if (!user) return;

    await supabase
      .from("studio_profiles")
      .update({
        website_data: data,
      })
      .eq("user_id", user.id);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      {/* HERO EDITOR */}
      <h2>Hero Section</h2>

      <input
        value={data.hero.title}
        onChange={(e) =>
          setData({
            ...data,
            hero: { ...data.hero, title: e.target.value },
          })
        }
        placeholder="Studio Name"
      />

      <input
        value={data.hero.tagline}
        onChange={(e) =>
          setData({
            ...data,
            hero: { ...data.hero, tagline: e.target.value },
          })
        }
        placeholder="Tagline"
      />

      <WebsiteImageUploader
        value={data.hero.cover}
        onChange={(url) =>
          setData({
            ...data,
            hero: { ...data.hero, cover: url },
          })
        }
        userId={user.id}
        folder="hero"
      />

      <button onClick={save}>Save</button>

      {/* PREVIEW */}
      <div style={{ marginTop: 40 }}>
        <WebsiteHero
          branding={{
            studio_name: data.hero.title,
            display_name: data.hero.tagline,
            cover_url: data.hero.cover ? `${data.hero.cover}?v=${Date.now()}` : null,
          }}
          id="hero"
          template="vows-elegance"
        />
      </div>
    </div>
  );
}
