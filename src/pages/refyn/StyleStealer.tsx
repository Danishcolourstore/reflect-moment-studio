import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RetouchParams {
  skin_texture_preservation: number;
  smoothing_radius: number;
  texture_sharpness: number;
  blend_uniformity: number;
  highlight_boost: number;
  shadow_sculpt: number;
  contour_strength: number;
  eye_clarity: number;
  skin_luminosity: number;
  micro_contrast: number;
  retouch_aggression: number;
  compression_confidence: number;
}

const PARAM_GROUPS = [
  {
    title: 'FREQUENCY SEPARATION',
    keys: ['skin_texture_preservation', 'smoothing_radius', 'texture_sharpness', 'blend_uniformity'] as const,
    labels: ['Skin Texture Preservation', 'Smoothing Radius', 'Texture Sharpness', 'Blend Uniformity'],
  },
  {
    title: 'DODGE & BURN',
    keys: ['highlight_boost', 'shadow_sculpt', 'contour_strength', 'eye_clarity'] as const,
    labels: ['Highlight Boost', 'Shadow Sculpt', 'Contour Strength', 'Eye Clarity'],
  },
  {
    title: 'LUMINOSITY',
    keys: ['skin_luminosity', 'micro_contrast', 'retouch_aggression'] as const,
    labels: ['Skin Luminosity', 'Micro Contrast', 'Retouch Aggression'],
  },
];

export default function StyleStealer() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [params, setParams] = useState<RetouchParams | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [styleName, setStyleName] = useState('');

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setParams(null);

    // Upload to storage
    const path = `ref_${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('reference-images').upload(path, file);
    if (error) {
      toast.error('Upload failed');
      return;
    }
    const { data: urlData } = supabase.storage.from('reference-images').getPublicUrl(path);
    setImageUrl(urlData.publicUrl);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!imageUrl) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-retouch-style', {
        body: { image_url: imageUrl },
      });
      if (error) throw error;
      setParams(data as RetouchParams);
    } catch (err: any) {
      toast.error(err?.message || 'Analysis failed');
    }
    setAnalyzing(false);
  }, [imageUrl]);

  const updateParam = (key: string, value: number) => {
    if (!params) return;
    setParams({ ...params, [key]: value });
  };

  const handleSave = useCallback(async () => {
    if (!params || !styleName.trim()) return;
    setSaving(true);
    const sessionId = sessionStorage.getItem('retouch_session_ts') || 'anonymous';
    const { compression_confidence, ...styleParams } = params;
    const { error } = await supabase.from('retouch_styles').insert({
      user_id: sessionId,
      style_name: styleName.trim(),
      reference_image_url: imageUrl,
      parameters: styleParams as any,
      compression_confidence,
    });
    setSaving(false);
    if (error) {
      toast.error('Save failed');
      return;
    }
    toast.success('Style saved');
    setShowSaveModal(false);
    navigate('/refyn/styles');
  }, [params, styleName, imageUrl, navigate]);

  return (
    <div className="ss-root">
      {/* Back button */}
      <button className="ss-back" onClick={() => navigate('/colour-store')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className="ss-content">
        {/* Header */}
        <div className="ss-header">
          <h1 className="ss-title">Steal a Style</h1>
          <div className="ss-title-line" />
          <p className="ss-subtitle">Upload any reference photo to extract its retouching DNA</p>
        </div>

        {/* Upload Area */}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        <button className="ss-upload-area" onClick={() => fileRef.current?.click()}>
          {previewUrl ? (
            <img src={previewUrl} alt="Reference" className="ss-preview-img" />
          ) : (
            <div className="ss-upload-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1"/>
                <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              <span>Tap to upload reference</span>
            </div>
          )}
        </button>

        {/* Analyze Button */}
        <button
          className={`ss-analyze-btn ${analyzing ? 'analyzing' : ''}`}
          disabled={!imageUrl || analyzing}
          onClick={handleAnalyze}
        >
          {analyzing ? 'Reading Retouching DNA...' : 'Steal This Style'}
        </button>

        {/* Compression Warning */}
        <AnimatePresence>
          {params && params.compression_confidence < 40 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="ss-compression-warn"
            >
              ⚠️ Reference image is too compressed for reliable analysis. Try a higher-quality screenshot.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Parameter Display */}
        <AnimatePresence>
          {params && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="ss-params"
            >
              {PARAM_GROUPS.map((group) => (
                <div key={group.title} className="ss-card">
                  <div className="ss-card-title">{group.title}</div>
                  {group.keys.map((key, i) => (
                    <div key={key} className="ss-slider-row">
                      <span className="ss-slider-label">{group.labels[i]}</span>
                      <input
                        type="range" min={0} max={100}
                        value={params[key]}
                        onChange={(e) => updateParam(key, parseInt(e.target.value))}
                        className="ss-slider"
                      />
                      <span className="ss-slider-value">{params[key]}</span>
                    </div>
                  ))}
                </div>
              ))}

              <button className="ss-save-btn" onClick={() => setShowSaveModal(true)}>
                Save as Retouch Style
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Save Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            className="ss-modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowSaveModal(false)}
          >
            <motion.div
              className="ss-modal"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="ss-modal-title">Name Your Style</h3>
              <input
                className="ss-modal-input"
                placeholder="e.g. Soft Bridal Glow"
                value={styleName}
                onChange={(e) => setStyleName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && styleName.trim() && handleSave()}
                autoFocus
              />
              <button
                className="ss-modal-save"
                disabled={!styleName.trim() || saving}
                onClick={handleSave}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .ss-root {
          min-height: 100dvh; background: #0d0d0d;
          font-family: "DM Sans", sans-serif; color: #F0EDE8;
          position: relative;
        }
        .ss-back {
          position: fixed; top: 12px; left: 12px; z-index: 50;
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.7); border: none; cursor: pointer;
        }
        .ss-content { padding: 60px 20px 40px; max-width: 480px; margin: 0 auto; }

        .ss-header { text-align: center; margin-bottom: 28px; }
        .ss-title {
          font-family: "Cormorant Garamond", serif;
          font-size: 28px; font-weight: 300; font-style: italic;
          color: #c9a96e;
        }
        .ss-title-line {
          width: 48px; height: 2px; margin: 10px auto;
          background: linear-gradient(90deg, transparent, #c9a96e, transparent);
        }
        .ss-subtitle {
          font-size: 12px; color: rgba(240,237,232,0.35);
          letter-spacing: 0.04em; line-height: 1.6;
        }

        .ss-upload-area {
          width: 100%; aspect-ratio: 4/3; border-radius: 14px;
          overflow: hidden; cursor: pointer;
          background: rgba(255,255,255,0.02);
          border: 1.5px dashed rgba(201,169,110,0.25);
          display: flex; align-items: center; justify-content: center;
          transition: border-color 0.2s;
        }
        .ss-upload-area:active { border-color: #c9a96e; }
        .ss-preview-img {
          width: 100%; height: 100%; object-fit: cover; border-radius: 0;
        }
        .ss-upload-empty {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          color: rgba(201,169,110,0.4);
          font-size: 12px; letter-spacing: 0.04em;
        }

        .ss-analyze-btn {
          width: 100%; margin-top: 16px; padding: 14px;
          border-radius: 12px; border: none; cursor: pointer;
          background: linear-gradient(135deg, #c9a96e 0%, #b8944a 100%);
          color: #0d0d0d; font-family: "DM Sans", sans-serif;
          font-size: 14px; font-weight: 600; letter-spacing: 0.02em;
          transition: all 0.2s;
        }
        .ss-analyze-btn:disabled {
          opacity: 0.3; cursor: default;
        }
        .ss-analyze-btn.analyzing {
          animation: ss-pulse 1.5s ease-in-out infinite;
        }
        @keyframes ss-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        .ss-compression-warn {
          margin-top: 12px; padding: 12px 16px;
          border-radius: 10px;
          background: rgba(245,166,35,0.1);
          border: 1px solid rgba(245,166,35,0.2);
          font-size: 12px; color: #f5a623; line-height: 1.5;
        }

        .ss-params { margin-top: 24px; display: flex; flex-direction: column; gap: 16px; }

        .ss-card {
          border-radius: 14px;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 16px;
        }
        .ss-card-title {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.15em; text-transform: uppercase;
          color: #c9a96e; margin-bottom: 14px;
          font-variant-numeric: tabular-nums;
        }

        .ss-slider-row {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 10px;
        }
        .ss-slider-row:last-child { margin-bottom: 0; }
        .ss-slider-label {
          flex: 1; font-size: 12px; color: rgba(240,237,232,0.7);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ss-slider {
          width: 100px; height: 20px;
          -webkit-appearance: none; appearance: none;
          background: transparent; cursor: pointer;
        }
        .ss-slider::-webkit-slider-track {
          height: 2px; border-radius: 1px;
          background: rgba(255,255,255,0.08);
        }
        .ss-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px; border-radius: 50%;
          background: #c9a96e;
          box-shadow: 0 0 6px rgba(201,169,110,0.3);
          margin-top: -6px; border: 2px solid rgba(13,13,13,0.8);
        }
        .ss-slider::-moz-range-track {
          height: 2px; border-radius: 1px;
          background: rgba(255,255,255,0.08);
        }
        .ss-slider::-moz-range-thumb {
          width: 14px; height: 14px; border-radius: 50%;
          background: #c9a96e; border: 2px solid rgba(13,13,13,0.8);
        }
        .ss-slider-value {
          min-width: 28px; text-align: right;
          font-size: 12px; font-weight: 500;
          color: #c9a96e; font-variant-numeric: tabular-nums;
        }

        .ss-save-btn {
          width: 100%; padding: 14px; border-radius: 12px;
          border: none; cursor: pointer;
          background: linear-gradient(135deg, #c9a96e 0%, #b8944a 100%);
          color: #0d0d0d; font-family: "DM Sans", sans-serif;
          font-size: 14px; font-weight: 600;
        }
        .ss-save-btn:active { transform: scale(0.98); }

        .ss-modal-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .ss-modal {
          width: 100%; max-width: 320px;
          background: rgba(30,30,30,0.95);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 24px;
        }
        .ss-modal-title {
          font-family: "Cormorant Garamond", serif;
          font-size: 18px; font-weight: 400;
          color: #c9a96e; margin-bottom: 16px;
        }
        .ss-modal-input {
          width: 100%; padding: 12px 14px;
          border-radius: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          color: #F0EDE8; font-family: "DM Sans", sans-serif;
          font-size: 14px; outline: none;
        }
        .ss-modal-input::placeholder { color: rgba(240,237,232,0.3); }
        .ss-modal-input:focus { border-color: rgba(201,169,110,0.4); }
        .ss-modal-save {
          width: 100%; margin-top: 14px; padding: 12px;
          border-radius: 10px; border: none; cursor: pointer;
          background: #c9a96e; color: #0d0d0d;
          font-family: "DM Sans", sans-serif;
          font-size: 13px; font-weight: 600;
        }
        .ss-modal-save:disabled { opacity: 0.3; }
      `}</style>
    </div>
  );
}
