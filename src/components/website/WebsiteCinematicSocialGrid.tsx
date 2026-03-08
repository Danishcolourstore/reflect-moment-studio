import { Instagram } from 'lucide-react';

interface Props {
  photos: string[];
  instagramHandle?: string;
  id?: string;
}

export function WebsiteCinematicSocialGrid({ photos, instagramHandle, id }: Props) {
  const fontSerif = '"Cormorant Garamond", Georgia, serif';
  const fontSans = '"DM Sans", sans-serif';

  if (photos.length === 0) return null;

  return (
    <section id={id} className="py-20 sm:py-28" style={{ backgroundColor: '#FAF8F5' }}>
      <div className="text-center mb-12 px-6">
        <p
          className="text-[10px] sm:text-xs uppercase tracking-[0.35em] mb-4"
          style={{ color: '#7A756E', fontFamily: fontSans }}
        >
          Follow Along
        </p>
        <h2
          className="text-2xl sm:text-3xl lg:text-4xl font-light lowercase tracking-[0.02em]"
          style={{ fontFamily: fontSerif, color: '#1A1715' }}
        >
          {instagramHandle || '@yourstudio'}
        </h2>
        <div className="mt-5 w-8 h-[1px] mx-auto" style={{ backgroundColor: 'rgba(26,23,21,0.15)' }} />
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-1.5 px-1 sm:px-2">
        {photos.slice(0, 6).map((url, i) => (
          <div key={i} className="relative group aspect-square overflow-hidden">
            <img
              src={url}
              alt=""
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-400"
              style={{ backgroundColor: 'rgba(26,23,21,0.6)' }}
            >
              <Instagram className="h-6 w-6" style={{ color: '#FAF8F5' }} />
            </div>
          </div>
        ))}
      </div>

      {instagramHandle && (
        <div className="text-center mt-10">
          <a
            href={`https://instagram.com/${instagramHandle.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 h-12 px-10 text-[10px] uppercase tracking-[0.25em] border transition-all duration-500 hover:bg-[#1A1715] hover:text-[#FAF8F5]"
            style={{ borderColor: 'rgba(26,23,21,0.2)', color: '#1A1715', fontFamily: fontSans }}
          >
            <Instagram className="h-4 w-4" />
            Follow on Instagram
          </a>
        </div>
      )}
    </section>
  );
}
