import { useState, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { useToast } from '@/hooks/use-toast';

const dm = '"DM Sans", sans-serif';
const cormorant = '"Cormorant Garamond", serif';

interface ToolAverages {
  skin: number;
  glow: number;
  form: number;
  light: number;
  grain: number;
  depth: number;
  outfit: number;
  jewellery: number;
  hair: number;
}

interface Props {
  studioName: string;
  editCount: number;
  averages: ToolAverages;
}

const SIGNATURES: { name: string; check: (a: ToolAverages) => boolean }[] = [
  { name: 'Warm · Natural · Textured', check: (a) => a.skin > 40 && a.depth > 55 },
  { name: 'Cinematic · Deep · Sculpted', check: (a) => a.form > 40 && a.grain > 30 && a.glow < 35 },
  { name: 'Airy · Soft · Golden', check: (a) => a.glow > 45 && a.light > 35 && a.grain < 20 },
  { name: 'Bold · Rich · Dramatic', check: (a) => a.form > 50 && a.depth > 60 && a.skin > 45 },
  { name: 'Clean · Minimal · True', check: (a) => a.skin < 30 && a.glow < 25 && a.grain < 15 },
  { name: 'Dark · Moody · Intimate', check: (a) => a.grain > 35 && a.glow < 20 && a.light < 25 },
];

function getSignature(a: ToolAverages): string {
  for (const sig of SIGNATURES) {
    if (sig.check(a)) return sig.name;
  }
  return 'Warm · Natural · Textured';
}

export default function RetouchSignatureCard({ studioName, editCount, averages }: Props) {
  const { toast } = useToast();
  const storyRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const signature = useMemo(() => getSignature(averages), [averages]);

  const topTools = useMemo(() => {
    const entries: [string, number][] = [
      ['Skin', averages.skin],
      ['Glow', averages.glow],
      ['Form', averages.form],
      ['Light', averages.light],
      ['Grain', averages.grain],
      ['Depth', averages.depth],
    ];
    return entries
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, val]) => `${name} ${Math.round(val)}`)
      .join(' · ');
  }, [averages]);

  const handleShareStory = useCallback(async () => {
    if (!storyRef.current || generating) return;
    setGenerating(true);
    try {
      const dataUrl = await toPng(storyRef.current, { width: 1080, height: 1920, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `colour-store-signature-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: 'Signature saved', description: 'Ready to share on Instagram Stories' });
    } catch (err) {
      console.error('Story generation failed:', err);
      toast({ title: 'Export failed', description: 'Please try again' });
    } finally {
      setGenerating(false);
    }
  }, [generating, toast]);

  // Don't show until 10+ edits
  if (editCount < 10) return null;

  return (
    <>
      {/* Dashboard card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="w-full rounded-2xl p-7 mt-3"
        style={{
          background: 'linear-gradient(135deg, #111108, #0C0C08)',
          border: '1px solid rgba(232,201,122,0.08)',
        }}
      >
        <p className="uppercase" style={{ fontFamily: dm, fontSize: 9, color: '#3A3A3A', letterSpacing: '0.35em' }}>
          YOUR SIGNATURE
        </p>

        <p className="mt-4" style={{ fontFamily: cormorant, fontSize: 28, fontWeight: 300, color: '#F0EDE8', letterSpacing: '0.04em' }}>
          {signature}
        </p>

        <p className="mt-3" style={{ fontFamily: dm, fontSize: 10, color: '#3A3A3A', letterSpacing: '0.1em' }}>
          {topTools}
        </p>

        {/* Amber line */}
        <div className="my-4" style={{ width: 32, height: 1, background: '#E8C97A' }} />

        <button
          onClick={handleShareStory}
          disabled={generating}
          className="transition-all duration-300 disabled:opacity-40"
          style={{ fontFamily: dm, fontSize: 10, color: '#E8C97A', letterSpacing: '0.15em' }}
        >
          {generating ? 'Generating...' : 'Share your signature →'}
        </button>
      </motion.div>

      {/* Hidden Instagram Story canvas */}
      <div className="fixed -left-[9999px] top-0" aria-hidden="true">
        <div
          ref={storyRef}
          style={{
            width: 1080,
            height: 1920,
            background: '#080808',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Film grain overlay */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04 }}>
            <filter id="story-grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#story-grain)" />
          </svg>

          {/* RI mark */}
          <p style={{
            fontFamily: cormorant,
            fontSize: 36,
            fontStyle: 'italic',
            color: '#E8C97A',
            letterSpacing: '0.3em',
            marginBottom: 120,
          }}>
            RI
          </p>

          {/* Signature name */}
          <p style={{
            fontFamily: cormorant,
            fontSize: 72,
            fontWeight: 300,
            color: '#F0EDE8',
            textAlign: 'center',
            lineHeight: 1.2,
            letterSpacing: '0.04em',
            padding: '0 80px',
          }}>
            {signature}
          </p>

          {/* Studio name */}
          <p style={{
            fontFamily: dm,
            fontSize: 28,
            color: '#3A3A3A',
            marginTop: 60,
            letterSpacing: '0.1em',
          }}>
            {studioName}
          </p>

          {/* Powered by */}
          <p style={{
            fontFamily: dm,
            fontSize: 20,
            color: 'rgba(232,201,122,0.3)',
            position: 'absolute',
            bottom: 80,
            letterSpacing: '0.15em',
          }}>
            Powered by Colour Store RI
          </p>
        </div>
      </div>
    </>
  );
}
