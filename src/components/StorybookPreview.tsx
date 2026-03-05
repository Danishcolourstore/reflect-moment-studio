import { useEffect, useRef, useState } from 'react';
import { X, ChevronUp } from 'lucide-react';

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

function PreviewHeroCover({ block }: { block: StoryBlock }) {
  return (
    <div className="relative w-full" style={{ height: '100vh' }}>
      {block.photo_urls[0] && (
        <img
          src={block.photo_urls[0]}
          alt={block.caption || ''}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ animation: 'kenBurns 20s ease-in-out infinite alternate' }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
        <RevealBlock>
          {block.caption && (
            <h2
              className="font-serif text-white text-3xl md:text-5xl lg:text-6xl leading-tight max-w-3xl"
              style={{ fontStyle: 'italic' }}
            >
              {block.caption}
            </h2>
          )}
        </RevealBlock>
        <RevealBlock delay={200}>
          {block.subtitle && (
            <p className="text-white/50 text-sm md:text-base mt-4 max-w-xl tracking-wide">
              {block.subtitle}
            </p>
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
            <img
              src={block.photo_urls[0]}
              alt=""
              className="h-full w-full object-cover transition-transform duration-[1200ms] hover:scale-105"
            />
          )}
        </div>
      </RevealBlock>
      <div className="flex flex-col justify-center px-8 md:px-16 py-12">
        <RevealBlock delay={300}>
          {block.caption && (
            <p
              className="font-serif text-white/90 text-xl md:text-2xl lg:text-3xl leading-relaxed"
              style={{ fontStyle: 'italic' }}
            >
              {block.caption}
            </p>
          )}
        </RevealBlock>
        <RevealBlock delay={500}>
          {block.subtitle && (
            <p className="text-white/40 text-sm mt-6 tracking-wide uppercase">
              {block.subtitle}
            </p>
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
          <p
            className="font-serif text-white/80 text-lg md:text-xl text-center mb-8"
            style={{ fontStyle: 'italic' }}
          >
            {block.caption}
          </p>
        )}
      </RevealBlock>
      <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
        {block.photo_urls.map((url, i) => (
          <RevealBlock key={i} delay={i * 150}>
            <div className="shrink-0 h-[40vh] md:h-[50vh] w-[60vw] md:w-[35vw] rounded-lg overflow-hidden snap-center">
              <img
                src={url}
                alt=""
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
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
          <p
            className="font-serif text-white/80 text-lg text-center mb-10"
            style={{ fontStyle: 'italic' }}
          >
            {block.caption}
          </p>
        )}
      </RevealBlock>
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {block.photo_urls.slice(0, 4).map((url, i) => (
          <RevealBlock key={i} delay={i * 120}>
            <div className="aspect-square rounded-lg overflow-hidden">
              <img
                src={url}
                alt=""
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
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
        <img
          src={block.photo_urls[0]}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      {block.caption && (
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <RevealBlock>
            <p className="text-white/70 text-sm md:text-base max-w-lg tracking-wide">
              {block.caption}
            </p>
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
            <blockquote
              className="font-serif text-white/90 text-2xl md:text-4xl leading-relaxed"
              style={{ fontStyle: 'italic' }}
            >
              "{block.caption}"
            </blockquote>
          )}
        </RevealBlock>
        <RevealBlock delay={300}>
          {block.subtitle && (
            <p className="text-white/40 text-sm mt-8 tracking-[3px] uppercase">
              — {block.subtitle}
            </p>
          )}
        </RevealBlock>
      </div>
    </div>
  );
}

function RenderBlock({ block }: { block: StoryBlock }) {
  switch (block.layout_type) {
    case 'hero-cover':
      return <PreviewHeroCover block={block} />;
    case 'split-editorial':
      return <PreviewSplitEditorial block={block} />;
    case 'film-strip':
      return <PreviewFilmStrip block={block} />;
    case 'minimal-grid':
      return <PreviewMinimalGrid block={block} />;
    case 'fullscreen-story':
      return <PreviewFullscreenStory block={block} />;
    case 'quote-page':
      return <PreviewQuotePage block={block} />;
    default:
      return null;
  }
}

export default function StorybookPreview({ title, blocks, onClose }: StorybookPreviewProps) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = () => setShowScrollTop(el.scrollTop > window.innerHeight);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Close button */}
      <button
        onClick={onClose}
        className="fixed top-6 right-6 z-[60] h-10 w-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Scrollable content */}
      <div ref={containerRef} className="h-full overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {/* Title intro */}
        <div className="flex items-center justify-center" style={{ height: '100vh' }}>
          <div className="text-center animate-fade-in">
            <p className="text-white/30 text-[10px] tracking-[4px] uppercase mb-4">A Visual Story</p>
            <h1
              className="font-serif text-white text-3xl md:text-5xl lg:text-6xl"
              style={{ fontStyle: 'italic' }}
            >
              {title}
            </h1>
            <div className="mt-8 flex justify-center">
              <div className="h-px w-16 bg-white/20" />
            </div>
          </div>
        </div>

        {/* Blocks */}
        {blocks.map((block) => (
          <div key={block.id}>
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
      <button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 z-[60] h-10 w-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
        style={{
          opacity: showScrollTop ? 1 : 0,
          pointerEvents: showScrollTop ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      >
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
