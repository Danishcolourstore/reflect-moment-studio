import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ChevronUp, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

const IG = {
  bg: '#000000',
  surface: '#121212',
  surface2: '#1C1C1C',
  border: '#262626',
  text: '#FAFAFA',
  textSecondary: '#A8A8A8',
  blue: '#0095F6',
  blueHover: '#1877F2',
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
} as const;

type LayoutType = 'hero-cover' | 'split-editorial' | 'film-strip' | 'minimal-grid' | 'fullscreen-story' | 'quote-page';

interface StoryBlock {
  id: string;
  layout_type: LayoutType;
  sort_order: number;
  caption: string;
  subtitle: string;
  photo_urls: string[];
}

interface StorybookPreviewProps {
  title: string;
  blocks: StoryBlock[];
  onClose: () => void;
}

/* ─── Reveal hook ─── */

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function RevealBlock({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className="transition-all duration-[800ms]"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Block renderers ─── */

function PreviewHeroCover({ block }: { block: StoryBlock }) {
  return (
    <div className="relative w-full" style={{ height: '100vh' }}>
      {block.photo_urls[0] && (
        <img src={block.photo_urls[0]} alt={block.caption || ''} className="absolute inset-0 h-full w-full object-cover"
          style={{ animation: 'kenBurns 20s ease-in-out infinite alternate' }} loading="lazy" decoding="async" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
        <RevealBlock>
          {block.caption && (
            <h2 className="font-serif text-white text-3xl md:text-5xl lg:text-6xl leading-tight max-w-3xl" style={{ fontStyle: 'italic' }}>
              {block.caption}
            </h2>
          )}
        </RevealBlock>
        <RevealBlock delay={200}>
          {block.subtitle && (
            <p className="text-white/50 text-sm md:text-base mt-4 max-w-xl tracking-wide">{block.subtitle}</p>
          )}
        </RevealBlock>
      </div>
    </div>
  );
}

function PreviewSplitEditorial({ block }: { block: StoryBlock }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 min-h-[70vh]">
      <RevealBlock>
        <div className="h-[50vh] md:h-[70vh] overflow-hidden">
          {block.photo_urls[0] && (
            <img src={block.photo_urls[0]} alt="" className="h-full w-full object-cover transition-transform duration-[1200ms] hover:scale-105" loading="lazy" decoding="async" />
          )}
        </div>
      </RevealBlock>
      <div className="flex flex-col justify-center px-8 md:px-16 py-12">
        <RevealBlock delay={300}>
          {block.caption && (
            <p className="font-serif text-white/90 text-xl md:text-2xl lg:text-3xl leading-relaxed" style={{ fontStyle: 'italic' }}>
              {block.caption}
            </p>
          )}
        </RevealBlock>
        <RevealBlock delay={500}>
          {block.subtitle && (
            <p className="text-white/40 text-sm mt-6 tracking-wide uppercase">{block.subtitle}</p>
          )}
        </RevealBlock>
      </div>
    </div>
  );
}

function PreviewFilmStrip({ block }: { block: StoryBlock }) {
  return (
    <div className="py-16 px-4 md:px-8">
      <RevealBlock>
        {block.caption && (
          <p className="font-serif text-white/80 text-lg md:text-xl text-center mb-8" style={{ fontStyle: 'italic' }}>
            {block.caption}
          </p>
        )}
      </RevealBlock>
      <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
        {block.photo_urls.map((url, i) => (
          <RevealBlock key={i} delay={i * 150}>
            <div className="shrink-0 h-[40vh] md:h-[50vh] w-[60vw] md:w-[35vw] rounded-lg overflow-hidden snap-center">
              <img src={url} alt="" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" loading="lazy" decoding="async" />
            </div>
          </RevealBlock>
        ))}
      </div>
    </div>
  );
}

function PreviewMinimalGrid({ block }: { block: StoryBlock }) {
  return (
    <div className="py-16 px-4 md:px-12 lg:px-24">
      <RevealBlock>
        {block.caption && (
          <p className="font-serif text-white/80 text-lg text-center mb-10" style={{ fontStyle: 'italic' }}>
            {block.caption}
          </p>
        )}
      </RevealBlock>
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {block.photo_urls.slice(0, 4).map((url, i) => (
          <RevealBlock key={i} delay={i * 120}>
            <div className="aspect-square rounded-lg overflow-hidden">
              <img src={url} alt="" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" loading="lazy" decoding="async" />
            </div>
          </RevealBlock>
        ))}
      </div>
    </div>
  );
}

function PreviewFullscreenStory({ block }: { block: StoryBlock }) {
  return (
    <div className="relative w-full" style={{ height: '100vh' }}>
      {block.photo_urls[0] && (
        <img src={block.photo_urls[0]} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      {block.caption && (
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <RevealBlock>
            <p className="text-white/70 text-sm md:text-base max-w-lg tracking-wide">{block.caption}</p>
          </RevealBlock>
        </div>
      )}
    </div>
  );
}

function PreviewQuotePage({ block }: { block: StoryBlock }) {
  return (
    <div className="flex items-center justify-center px-8" style={{ minHeight: '60vh' }}>
      <div className="text-center max-w-2xl">
        <RevealBlock>
          {block.caption && (
            <blockquote className="font-serif text-white/90 text-2xl md:text-4xl leading-relaxed" style={{ fontStyle: 'italic' }}>
              "{block.caption}"
            </blockquote>
          )}
        </RevealBlock>
        <RevealBlock delay={300}>
          {block.subtitle && (
            <p className="text-white/40 text-sm mt-8 tracking-[3px] uppercase">— {block.subtitle}</p>
          )}
        </RevealBlock>
      </div>
    </div>
  );
}

function RenderBlock({ block }: { block: StoryBlock }) {
  switch (block.layout_type) {
    case 'hero-cover': return <PreviewHeroCover block={block} />;
    case 'split-editorial': return <PreviewSplitEditorial block={block} />;
    case 'film-strip': return <PreviewFilmStrip block={block} />;
    case 'minimal-grid': return <PreviewMinimalGrid block={block} />;
    case 'fullscreen-story': return <PreviewFullscreenStory block={block} />;
    case 'quote-page': return <PreviewQuotePage block={block} />;
    default: return null;
  }
}

/* ─── Export slide renderer (offscreen, 1080x1350) ─── */

function ExportSlide({ block, title, index }: { block: StoryBlock; title: string; index: number }) {
  // Render a static version of each block at Instagram 4:5 ratio
  const isQuote = block.layout_type === 'quote-page';
  const mainPhoto = block.photo_urls[0];

  return (
    <div style={{
      width: 1080, height: 1350, position: 'relative', overflow: 'hidden',
      background: IG.bg, fontFamily: IG.font, display: 'flex', flexDirection: 'column',
    }}>
      {/* Background image */}
      {mainPhoto && (
        <img src={mainPhoto} alt="" crossOrigin="anonymous"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" decoding="async" />
      )}

      {/* Gradient overlay */}
      {mainPhoto && (
        <div style={{
          position: 'absolute', inset: 0,
          background: isQuote ? IG.bg : 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)',
        }} />
      )}

      {/* Quote-only background */}
      {isQuote && !mainPhoto && (
        <div style={{ position: 'absolute', inset: 0, background: IG.bg }} />
      )}

      {/* Grid layout for multi-photo blocks */}
      {block.layout_type === 'minimal-grid' && block.photo_urls.length > 1 && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 4,
          padding: 4,
        }}>
          {block.photo_urls.slice(0, 4).map((url, i) => (
            <img key={i} src={url} alt="" crossOrigin="anonymous"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} loading="lazy" decoding="async" />
          ))}
        </div>
      )}

      {/* Film strip */}
      {block.layout_type === 'film-strip' && block.photo_urls.length > 1 && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', gap: 6, padding: '40px 20px',
        }}>
          {block.photo_urls.map((url, i) => (
            <img key={i} src={url} alt="" crossOrigin="anonymous"
              style={{ width: '100%', height: `${100 / block.photo_urls.length}%`, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} loading="lazy" decoding="async" />
          ))}
        </div>
      )}

      {/* Content overlay */}
      <div style={{
        position: 'relative', flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: isQuote ? 'center' : 'flex-end',
        padding: isQuote ? '80px 60px' : '60px 48px',
        zIndex: 1,
      }}>
        {/* Slide number */}
        <div style={{
          position: 'absolute', top: 40, right: 48,
          color: 'rgba(250,250,250,0.2)', fontSize: 13, letterSpacing: 3, fontWeight: 600,
        }}>
          {String(index + 1).padStart(2, '0')}
        </div>

        {block.caption && (
          <p style={{
            color: IG.text,
            fontSize: isQuote ? 48 : 40,
            fontWeight: 400,
            fontStyle: 'italic',
            fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
            lineHeight: 1.3,
            maxWidth: 900,
            textAlign: isQuote ? 'center' : 'left',
            textShadow: mainPhoto ? '0 2px 20px rgba(0,0,0,0.5)' : 'none',
          }}>
            {isQuote ? `"${block.caption}"` : block.caption}
          </p>
        )}

        {block.subtitle && (
          <p style={{
            color: 'rgba(250,250,250,0.45)',
            fontSize: 16,
            letterSpacing: 3,
            textTransform: 'uppercase',
            marginTop: 24,
            textAlign: isQuote ? 'center' : 'left',
          }}>
            {isQuote ? `— ${block.subtitle}` : block.subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════ */

export default function StorybookPreview({ title, blocks, onClose }: StorybookPreviewProps) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentBlockIdx, setCurrentBlockIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = () => {
      setShowScrollTop(el.scrollTop > window.innerHeight);
      // Track which block is currently in view
      const blockEls = el.querySelectorAll('[data-block-idx]');
      blockEls.forEach((be) => {
        const rect = be.getBoundingClientRect();
        if (rect.top < window.innerHeight / 2 && rect.bottom > window.innerHeight / 2) {
          setCurrentBlockIdx(Number((be as HTMLElement).dataset.blockIdx) || 0);
        }
      });
    };
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const captureSlide = useCallback(async (blockIdx: number): Promise<Blob> => {
    // Create offscreen container for the export slide
    const container = exportContainerRef.current;
    if (!container) throw new Error('Export container not found');

    // Clear previous content
    container.innerHTML = '';

    // Create a wrapper div at exact Instagram resolution
    const wrapper = document.createElement('div');
    wrapper.style.width = '1080px';
    wrapper.style.height = '1350px';
    wrapper.style.position = 'absolute';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0';
    wrapper.style.overflow = 'hidden';
    wrapper.style.background = IG.bg;
    container.appendChild(wrapper);

    // Render the block content
    const block = blocks[blockIdx];
    const mainPhoto = block.photo_urls[0];
    const isQuote = block.layout_type === 'quote-page';
    const isGrid = block.layout_type === 'minimal-grid' && block.photo_urls.length > 1;
    const isFilm = block.layout_type === 'film-strip' && block.photo_urls.length > 1;

    // Preload images
    const imageUrls = block.photo_urls.filter(Boolean);
    await Promise.all(imageUrls.map(url => new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = url;
    })));

    // Build HTML content
    let html = '';

    if (isGrid) {
      html += `<div style="position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:4px;padding:4px;">`;
      block.photo_urls.slice(0, 4).forEach(url => {
        html += `<img src="${url}" crossorigin="anonymous" style="width:100%;height:100%;object-fit:cover;border-radius:8px;" />`;
      });
      html += `</div>`;
    } else if (isFilm) {
      html += `<div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;gap:6px;padding:40px 20px;">`;
      block.photo_urls.forEach(url => {
        html += `<img src="${url}" crossorigin="anonymous" style="width:100%;flex:1;object-fit:cover;border-radius:8px;" />`;
      });
      html += `</div>`;
    } else if (mainPhoto) {
      html += `<img src="${mainPhoto}" crossorigin="anonymous" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />`;
      html += `<div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 50%, transparent 100%);"></div>`;
    }

    // Slide number
    html += `<div style="position:absolute;top:40px;right:48px;color:rgba(250,250,250,0.2);font-size:13px;letter-spacing:3px;font-weight:600;font-family:${IG.font};z-index:2;">${String(blockIdx + 1).padStart(2, '0')}</div>`;

    // Caption & subtitle
    const captionStyle = `color:${IG.text};font-size:${isQuote ? 48 : 40}px;font-weight:400;font-style:italic;font-family:"Cormorant Garamond","Playfair Display",Georgia,serif;line-height:1.3;max-width:900px;text-align:${isQuote ? 'center' : 'left'};${mainPhoto ? 'text-shadow:0 2px 20px rgba(0,0,0,0.5);' : ''}`;
    const subStyle = `color:rgba(250,250,250,0.45);font-size:16px;letter-spacing:3px;text-transform:uppercase;margin-top:24px;text-align:${isQuote ? 'center' : 'left'};font-family:${IG.font};`;

    html += `<div style="position:relative;display:flex;flex-direction:column;justify-content:${isQuote ? 'center' : 'flex-end'};padding:${isQuote ? '80px 60px' : '60px 48px'};z-index:1;${isQuote ? 'height:100%;' : 'position:absolute;bottom:0;left:0;right:0;'}">`;
    if (block.caption) {
      html += `<p style="${captionStyle}">${isQuote ? `"${block.caption}"` : block.caption}</p>`;
    }
    if (block.subtitle) {
      html += `<p style="${subStyle}">${isQuote ? `— ${block.subtitle}` : block.subtitle}</p>`;
    }
    html += `</div>`;

    wrapper.innerHTML = html;

    // Wait for images to render
    await new Promise(r => setTimeout(r, 200));

    const canvas = await html2canvas(wrapper, {
      width: 1080,
      height: 1350,
      scale: 1,
      useCORS: true,
      allowTaint: false,
      backgroundColor: IG.bg,
      logging: false,
    });

    container.innerHTML = '';

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      }, 'image/png', 1.0);
    });
  }, [blocks]);

  const downloadCurrentSlide = useCallback(async () => {
    setExporting(true);
    setExportProgress('Rendering slide...');
    try {
      const blob = await captureSlide(currentBlockIdx);
      saveAs(blob, `slide-${currentBlockIdx + 1}.png`);
      toast.success(`Slide ${currentBlockIdx + 1} downloaded`);
    } catch (err) {
      console.error(err);
      toast.error('Export failed');
    } finally {
      setExporting(false);
      setExportProgress('');
      setShowExportMenu(false);
    }
  }, [currentBlockIdx, captureSlide]);

  const downloadAllSlides = useCallback(async () => {
    setExporting(true);
    try {
      const zip = new JSZip();
      for (let i = 0; i < blocks.length; i++) {
        setExportProgress(`Rendering slide ${i + 1} of ${blocks.length}...`);
        const blob = await captureSlide(i);
        zip.file(`slide-${i + 1}.png`, blob);
      }
      setExportProgress('Creating ZIP...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'storybook-slides.zip');
      toast.success(`${blocks.length} slides exported`);
    } catch (err) {
      console.error(err);
      toast.error('Export failed');
    } finally {
      setExporting(false);
      setExportProgress('');
      setShowExportMenu(false);
    }
  }, [blocks, captureSlide]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Offscreen export container */}
      <div ref={exportContainerRef} style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1, overflow: 'hidden' }} />

      {/* Top toolbar */}
      <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-4 py-3"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)' }}>
        <div />
        <div className="flex items-center gap-2">
          {/* Download button */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting}
              className="h-10 px-4 rounded-full flex items-center gap-2 transition-all"
              style={{
                background: exporting ? IG.surface2 : IG.blue,
                color: IG.text,
                fontFamily: IG.font,
                fontSize: '13px',
                fontWeight: 600,
              }}
              onMouseEnter={e => { if (!exporting) e.currentTarget.style.background = IG.blueHover; }}
              onMouseLeave={e => { if (!exporting) e.currentTarget.style.background = IG.blue; }}
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{exportProgress}</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </>
              )}
            </button>

            {showExportMenu && !exporting && (
              <div className="absolute top-full right-0 mt-2 w-56 rounded-xl overflow-hidden shadow-2xl"
                style={{ background: IG.surface, border: `1px solid ${IG.border}` }}>
                <button onClick={downloadCurrentSlide}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors"
                  style={{ color: IG.text, fontFamily: IG.font, fontSize: '14px' }}
                  onMouseEnter={e => { e.currentTarget.style.background = IG.surface2; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  <Download className="h-4 w-4" style={{ color: IG.blue }} />
                  <div>
                    <p style={{ fontWeight: 500 }}>Current Slide</p>
                    <p style={{ color: IG.textSecondary, fontSize: '12px' }}>slide-{currentBlockIdx + 1}.png</p>
                  </div>
                </button>
                <div style={{ height: 1, background: IG.border }} />
                <button onClick={downloadAllSlides}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors"
                  style={{ color: IG.text, fontFamily: IG.font, fontSize: '14px' }}
                  onMouseEnter={e => { e.currentTarget.style.background = IG.surface2; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  <Download className="h-4 w-4" style={{ color: IG.blue }} />
                  <div>
                    <p style={{ fontWeight: 500 }}>All Slides (ZIP)</p>
                    <p style={{ color: IG.textSecondary, fontSize: '12px' }}>{blocks.length} slides · 1080×1350</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Close button */}
          <button onClick={onClose}
            className="h-10 w-10 rounded-full flex items-center justify-center transition-all"
            style={{ background: 'rgba(250,250,250,0.1)', color: 'rgba(250,250,250,0.7)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(250,250,250,0.2)'; e.currentTarget.style.color = IG.text; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(250,250,250,0.1)'; e.currentTarget.style.color = 'rgba(250,250,250,0.7)'; }}>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Close export menu on click outside */}
      {showExportMenu && (
        <div className="fixed inset-0 z-[59]" onClick={() => setShowExportMenu(false)} />
      )}

      {/* Scrollable content */}
      <div ref={containerRef} className="h-full overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {/* Title intro */}
        <div className="flex items-center justify-center" style={{ height: '100vh' }}>
          <div className="text-center animate-fade-in">
            <p className="text-white/30 text-[10px] tracking-[4px] uppercase mb-4">A Visual Story</p>
            <h1 className="font-serif text-white text-3xl md:text-5xl lg:text-6xl" style={{ fontStyle: 'italic' }}>
              {title}
            </h1>
            <div className="mt-8 flex justify-center">
              <div className="h-px w-16 bg-white/20" />
            </div>
          </div>
        </div>

        {/* Blocks */}
        {blocks.map((block, idx) => (
          <div key={block.id} data-block-idx={idx}>
            <RenderBlock block={block} />
          </div>
        ))}

        {/* End card */}
        <div className="flex items-center justify-center py-32">
          <RevealBlock>
            <div className="text-center">
              <div className="h-px w-16 bg-white/20 mx-auto mb-6" />
              <p className="text-white/30 text-[10px] tracking-[4px] uppercase">Fin</p>
            </div>
          </RevealBlock>
        </div>
      </div>

      {/* Scroll to top */}
      <button onClick={scrollToTop}
        className="fixed bottom-8 right-8 z-[60] h-10 w-10 rounded-full flex items-center justify-center transition-all"
        style={{
          background: 'rgba(250,250,250,0.1)', backdropFilter: 'blur(8px)',
          color: 'rgba(250,250,250,0.7)',
          opacity: showScrollTop ? 1 : 0,
          pointerEvents: showScrollTop ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(250,250,250,0.2)'; e.currentTarget.style.color = IG.text; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(250,250,250,0.1)'; e.currentTarget.style.color = 'rgba(250,250,250,0.7)'; }}>
        <ChevronUp className="h-5 w-5" />
      </button>

      <style>{`
        @keyframes kenBurns {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.08) translate(-1%, -1%); }
        }
      `}</style>
    </div>
  );
}
