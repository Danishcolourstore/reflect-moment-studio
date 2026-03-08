import { getTemplate } from '@/lib/website-templates';
import { ProgressiveImage } from '@/components/ProgressiveImage';
import { Camera } from 'lucide-react';

interface WebsiteImageStripProps {
  id?: string;
  template?: string;
  images: string[];
}

export function WebsiteImageStrip({
  id,
  template = 'modern-photography-grid',
  images,
}: WebsiteImageStripProps) {
  const tmpl = getTemplate(template);
  const isModern = template === 'modern-photography-grid';

  // Show up to 6 images
  const displayImages = images.slice(0, 6);

  if (displayImages.length === 0) {
    return (
      <section id={id} className="py-8" style={{ backgroundColor: isModern ? '#FFFFFF' : tmpl.bg }}>
        <div className="flex items-center justify-center gap-2 py-4 opacity-30">
          <Camera className="h-4 w-4" style={{ color: tmpl.textSecondary }} />
          <span className="text-xs" style={{ color: tmpl.textSecondary }}>Add images to the strip</span>
        </div>
      </section>
    );
  }

  return (
    <section id={id} style={{ backgroundColor: isModern ? '#FFFFFF' : tmpl.bg }}>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-0">
        {displayImages.map((url, i) => (
          <div key={`${url}-${i}`} className="relative overflow-hidden group">
            <div style={{ paddingBottom: '100%' }} className="relative">
              <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.08]">
                <ProgressiveImage
                  src={url}
                  alt={`Strip ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
