import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StyleRow {
  id: string;
  style_name: string;
  reference_image_url: string | null;
  parameters: Record<string, number>;
  compression_confidence: number;
  is_favorite: boolean;
  created_at: string;
}

const PARAM_LABELS: Record<string, string> = {
  skin_texture_preservation: 'Texture Pres.',
  smoothing_radius: 'Smoothing',
  texture_sharpness: 'Tex Sharpness',
  blend_uniformity: 'Blend',
  highlight_boost: 'Highlights',
  shadow_sculpt: 'Shadows',
  contour_strength: 'Contour',
  eye_clarity: 'Eye Clarity',
  skin_luminosity: 'Luminosity',
  micro_contrast: 'Micro Contrast',
  retouch_aggression: 'Aggression',
};

export default function StyleLibrary() {
  const navigate = useNavigate();
  const [styles, setStyles] = useState<StyleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadStyles = useCallback(async () => {
    const { data, error } = await supabase
      .from('retouch_styles')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setStyles(data as unknown as StyleRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadStyles(); }, [loadStyles]);

  const toggleFav = async (id: string, current: boolean) => {
    await supabase.from('retouch_styles').update({ is_favorite: !current } as any).eq('id', id);
    setStyles(s => s.map(st => st.id === id ? { ...st, is_favorite: !current } : st));
  };

  const deleteStyle = async (id: string) => {
    if (!confirm('Delete this style?')) return;
    await supabase.from('retouch_styles').delete().eq('id', id);
    setStyles(s => s.filter(st => st.id !== id));
    toast.success('Style deleted');
  };

  const applyStyle = (style: StyleRow) => {
    sessionStorage.setItem('stolen-style', JSON.stringify({
      name: style.style_name,
      params: style.parameters,
    }));
    toast.success(`Style "${style.style_name}" ready to apply`);
    navigate('/colour-store');
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  return (
    <div className="sl-root">
      <button className="sl-back" onClick={() => navigate('/colour-store')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className="sl-content">
        <div className="sl-header">
          <h1 className="sl-title">My Styles</h1>
          <div className="sl-title-line" />
        </div>

        {loading && (
          <div className="sl-loading">
            <div className="sl-spinner" />
          </div>
        )}

        {!loading && styles.length === 0 && (
          <div className="sl-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15 8.5L22 9.5L17 14.5L18 21.5L12 18.5L6 21.5L7 14.5L2 9.5L9 8.5L12 2Z" stroke="#c9a96e" strokeWidth="1.2" fill="rgba(201,169,110,0.1)"/>
            </svg>
            <p className="sl-empty-text">No styles yet</p>
            <button className="sl-empty-link" onClick={() => navigate('/refyn/steal')}>Go steal one →</button>
          </div>
        )}

        <div className="sl-list">
          <AnimatePresence>
            {styles.map((style) => (
              <motion.div
                key={style.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="sl-card"
              >
                <div className="sl-card-header" onClick={() => setExpanded(expanded === style.id ? null : style.id)}>
                  {style.reference_image_url ? (
                    <img src={style.reference_image_url} alt="" className="sl-thumb" />
                  ) : (
                    <div className="sl-thumb sl-thumb-empty" />
                  )}
                  <div className="sl-card-info">
                    <span className="sl-card-name">{style.style_name}</span>
                    <span className="sl-card-date">{formatDate(style.created_at)}</span>
                  </div>
                  <button className="sl-fav-btn" onClick={(e) => { e.stopPropagation(); toggleFav(style.id, style.is_favorite); }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={style.is_favorite ? '#c9a96e' : 'none'}>
                      <path d="M12 2L15 8.5L22 9.5L17 14.5L18 21.5L12 18.5L6 21.5L7 14.5L2 9.5L9 8.5L12 2Z" stroke="#c9a96e" strokeWidth="1.5"/>
                    </svg>
                  </button>
                </div>

                <AnimatePresence>
                  {expanded === style.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="sl-card-body"
                    >
                      <div className="sl-param-grid">
                        {Object.entries(style.parameters).map(([key, val]) => (
                          <div key={key} className="sl-param-item">
                            <span className="sl-param-label">{PARAM_LABELS[key] || key}</span>
                            <span className="sl-param-value">{val as number}</span>
                          </div>
                        ))}
                      </div>
                      <div className="sl-card-actions">
                        <button className="sl-apply-btn" onClick={() => applyStyle(style)}>Apply to Editor</button>
                        <button className="sl-delete-btn" onClick={() => deleteStyle(style.id)}>Delete</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        .sl-root {
          min-height: 100dvh; background: #0d0d0d;
          font-family: "DM Sans", sans-serif; color: #F0EDE8;
          position: relative;
        }
        .sl-back {
          position: fixed; top: 12px; left: 12px; z-index: 50;
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.7); border: none; cursor: pointer;
        }
        .sl-content { padding: 60px 20px 40px; max-width: 480px; margin: 0 auto; }
        .sl-header { text-align: center; margin-bottom: 24px; }
        .sl-title {
          font-family: "Cormorant Garamond", serif;
          font-size: 24px; font-weight: 300; font-style: italic; color: #c9a96e;
        }
        .sl-title-line {
          width: 40px; height: 2px; margin: 8px auto;
          background: linear-gradient(90deg, transparent, #c9a96e, transparent);
        }

        .sl-loading { display: flex; justify-content: center; padding: 40px; }
        .sl-spinner {
          width: 20px; height: 20px;
          border: 2px solid rgba(201,169,110,0.2);
          border-top-color: #c9a96e; border-radius: 50%;
          animation: sl-spin 0.8s linear infinite;
        }
        @keyframes sl-spin { to { transform: rotate(360deg); } }

        .sl-empty {
          text-align: center; padding: 60px 20px;
          display: flex; flex-direction: column; align-items: center; gap: 12px;
        }
        .sl-empty-text { font-size: 14px; color: rgba(240,237,232,0.4); }
        .sl-empty-link {
          font-size: 13px; color: #c9a96e;
          background: none; border: none; cursor: pointer;
          text-decoration: underline; text-underline-offset: 3px;
        }

        .sl-list { display: flex; flex-direction: column; gap: 10px; }

        .sl-card {
          border-radius: 14px;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.06);
          overflow: hidden;
        }
        .sl-card-header {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; cursor: pointer;
        }
        .sl-thumb {
          width: 44px; height: 44px; border-radius: 8px;
          object-fit: cover; flex-shrink: 0;
        }
        .sl-thumb-empty {
          background: rgba(201,169,110,0.1);
        }
        .sl-card-info { flex: 1; min-width: 0; }
        .sl-card-name {
          display: block; font-size: 14px; font-weight: 500;
          color: #F0EDE8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sl-card-date {
          display: block; font-size: 11px; color: rgba(240,237,232,0.35);
          margin-top: 2px;
        }
        .sl-fav-btn {
          width: 32px; height: 32px; flex-shrink: 0;
          background: none; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }

        .sl-card-body {
          overflow: hidden;
          border-top: 1px solid rgba(255,255,255,0.04);
          padding: 14px;
        }
        .sl-param-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 6px 16px; margin-bottom: 14px;
        }
        .sl-param-item {
          display: flex; justify-content: space-between;
          font-size: 11px;
        }
        .sl-param-label { color: rgba(240,237,232,0.5); }
        .sl-param-value { color: #c9a96e; font-variant-numeric: tabular-nums; }

        .sl-card-actions { display: flex; gap: 8px; }
        .sl-apply-btn {
          flex: 1; padding: 10px; border-radius: 10px;
          background: rgba(201,169,110,0.15);
          border: 1px solid rgba(201,169,110,0.25);
          color: #c9a96e; font-size: 12px; font-weight: 600;
          cursor: pointer;
        }
        .sl-apply-btn:active { transform: scale(0.97); }
        .sl-delete-btn {
          padding: 10px 14px; border-radius: 10px;
          background: rgba(255,60,60,0.08);
          border: 1px solid rgba(255,60,60,0.15);
          color: #e55; font-size: 12px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
