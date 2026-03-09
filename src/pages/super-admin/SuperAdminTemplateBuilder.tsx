import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LayoutTemplate, Image, Info, Trash2 } from 'lucide-react';

type Section = { id: string; type: 'Hero' | 'Gallery' | 'About' };

const sectionMeta: Record<Section['type'], { icon: React.ElementType; color: string }> = {
  Hero: { icon: LayoutTemplate, color: 'bg-primary/10 text-primary border-primary/20' },
  Gallery: { icon: Image, color: 'bg-accent/10 text-accent-foreground border-accent/20' },
  About: { icon: Info, color: 'bg-muted text-muted-foreground border-border' },
};

export default function SuperAdminTemplateBuilder() {
  const [sections, setSections] = useState<Section[]>([]);

  const addSection = (type: Section['type']) => {
    setSections((prev) => [...prev, { id: crypto.randomUUID(), type }]);
  };

  const removeSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-serif text-foreground">Super Admin Template Builder</h1>
        <p className="text-sm text-muted-foreground mt-1">Compose page templates by adding sections below.</p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Button variant="outline" onClick={() => addSection('Hero')}>
          <LayoutTemplate className="h-4 w-4" />
          Add Hero Section
        </Button>
        <Button variant="outline" onClick={() => addSection('Gallery')}>
          <Image className="h-4 w-4" />
          Add Gallery Section
        </Button>
        <Button variant="outline" onClick={() => addSection('About')}>
          <Info className="h-4 w-4" />
          Add About Section
        </Button>
      </div>

      {/* Section list */}
      {sections.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-12 text-center text-muted-foreground text-sm">
          No sections yet. Click a button above to start building.
        </div>
      ) : (
        <ol className="space-y-3">
          {sections.map((section, index) => {
            const { icon: Icon, color } = sectionMeta[section.type];
            return (
              <li
                key={section.id}
                className="flex items-center gap-4 border border-border rounded-lg px-4 py-3 bg-card"
              >
                <span className="text-xs text-muted-foreground w-5 text-right">{index + 1}</span>
                <div className={`flex items-center gap-2 flex-1 px-3 py-1.5 rounded-md border text-sm font-medium ${color}`}>
                  <Icon className="h-4 w-4" />
                  {section.type} Section
                </div>
                <button
                  onClick={() => removeSection(section.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Remove section"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {sections.length > 0 && (
        <p className="text-xs text-muted-foreground mt-4">{sections.length} section{sections.length !== 1 ? 's' : ''} added</p>
      )}
    </div>
  );
}
