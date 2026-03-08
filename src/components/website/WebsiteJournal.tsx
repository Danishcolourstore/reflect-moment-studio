import { getTemplate } from '@/lib/website-templates';

export interface JournalEntry {
  title: string;
  imageUrl?: string;
  date?: string;
}

interface Props {
  entries: JournalEntry[];
  template?: string;
  id?: string;
}

export function WebsiteJournal({ entries, template = 'cinematic-wedding-story', id }: Props) {
  const tmpl = getTemplate(template);
  const isCinematic = template === 'cinematic-wedding-story';
  const bg = isCinematic ? '#FAF8F5' : tmpl.bg;
  const textColor = isCinematic ? '#1A1715' : tmpl.text;
  const secondaryColor = isCinematic ? '#7A756E' : tmpl.textSecondary;
  const fontSerif = isCinematic ? '"Cormorant Garamond", Georgia, serif' : tmpl.fontFamily;
  const fontSans = '"DM Sans", sans-serif';

  if (entries.length === 0) return null;

  return (
    <section id={id} className="py-20 sm:py-32 px-6 sm:px-12" style={{ backgroundColor: bg }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-light lowercase tracking-[0.02em]"
            style={{ fontFamily: fontSerif, color: textColor }}
          >
            journal
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {entries.map((entry, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="overflow-hidden aspect-[4/5]">
                {entry.imageUrl ? (
                  <img
                    src={entry.imageUrl}
                    alt={entry.title}
                    className="h-full w-full object-cover transition-transform duration-[1000ms] ease-out group-hover:scale-[1.05]"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: '#EDE9E3' }}>
                    <span className="text-sm" style={{ color: '#CCC' }}>Upload image</span>
                  </div>
                )}
              </div>
              <div className="mt-4">
                {entry.date && (
                  <p
                    className="text-[9px] uppercase tracking-[0.2em] mb-1"
                    style={{ color: secondaryColor, fontFamily: fontSans }}
                  >
                    {entry.date}
                  </p>
                )}
                <h3
                  className="text-sm font-medium tracking-[0.05em]"
                  style={{ color: textColor, fontFamily: fontSans }}
                >
                  {entry.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
