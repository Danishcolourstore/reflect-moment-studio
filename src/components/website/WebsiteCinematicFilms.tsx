import { Play } from 'lucide-react';
import { useState } from 'react';

export interface FilmItem {
  title: string;
  thumbnailUrl: string;
  videoUrl?: string; // YouTube or Vimeo URL
}

interface Props {
  films: FilmItem[];
  id?: string;
}

export function WebsiteCinematicFilms({ films, id }: Props) {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const fontSerif = '"Cormorant Garamond", Georgia, serif';
  const fontSans = '"DM Sans", sans-serif';

  if (films.length === 0) return null;

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const id = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1];
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null;
    }
    if (url.includes('vimeo.com')) {
      const id = url.match(/vimeo\.com\/(\d+)/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : null;
    }
    return null;
  };

  return (
    <>
      <section id={id} className="py-20 sm:py-32 px-6 sm:px-12" style={{ backgroundColor: '#1A1715' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 sm:mb-20">
            <p
              className="text-[10px] sm:text-xs uppercase tracking-[0.4em] mb-6"
              style={{ color: 'rgba(250,248,245,0.4)', fontFamily: fontSans }}
            >
              Cinematic
            </p>
            <h2
              className="text-3xl sm:text-5xl lg:text-6xl font-light lowercase tracking-[0.02em]"
              style={{ fontFamily: fontSerif, color: '#FAF8F5' }}
            >
              our films
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            {films.map((film, i) => (
              <div
                key={i}
                className="group cursor-pointer"
                onClick={() => film.videoUrl && setActiveVideo(film.videoUrl)}
              >
                <div className="relative overflow-hidden aspect-video">
                  <img
                    src={film.thumbnailUrl}
                    alt={film.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center transition-opacity duration-500"
                    style={{ background: 'rgba(26,23,21,0.35)' }}
                  >
                    <div
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:scale-110"
                      style={{ backgroundColor: 'rgba(250,248,245,0.15)', backdropFilter: 'blur(8px)' }}
                    >
                      <Play className="h-6 w-6 sm:h-8 sm:w-8 ml-1" style={{ color: '#FAF8F5' }} fill="rgba(250,248,245,0.8)" />
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <h3
                    className="text-sm sm:text-base font-medium tracking-[0.1em] uppercase"
                    style={{ color: 'rgba(250,248,245,0.8)', fontFamily: fontSans }}
                  >
                    {film.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video lightbox */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
          onClick={() => setActiveVideo(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/60 hover:text-white text-3xl z-10"
            onClick={() => setActiveVideo(null)}
          >
            ×
          </button>
          <div className="w-full max-w-5xl aspect-video" onClick={e => e.stopPropagation()}>
            {getEmbedUrl(activeVideo) ? (
              <iframe
                src={getEmbedUrl(activeVideo)!}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/50 text-sm">
                Video preview — add a YouTube or Vimeo URL
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
