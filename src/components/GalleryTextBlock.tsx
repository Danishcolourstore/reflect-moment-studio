import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Type, AlignLeft, AlignCenter, AlignRight, Trash2, Plus, GripVertical,
  ChevronUp, ChevronDown, Pencil,
} from 'lucide-react';

/* ── Types ── */
export interface TextBlock {
  id: string;
  event_id: string;
  title: string | null;
  subtitle: string | null;
  paragraph: string | null;
  sort_order: number;
  font_family: string;
  font_size: string;
  font_weight: string;
  text_color: string;
  text_align: string;
  letter_spacing: string;
  line_height: string;
  bg_style: string;
  template: string | null;
}

const FONT_FAMILIES = [
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'DM Sans', label: 'DM Sans' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Jost', label: 'Jost' },
  { value: 'Great Vibes', label: 'Great Vibes' },
];

const BG_STYLES = [
  { value: 'transparent', label: 'Transparent' },
  { value: 'white', label: 'White' },
  { value: 'cream', label: 'Cream' },
  { value: 'light-gray', label: 'Light Gray' },
  { value: 'dark', label: 'Dark' },
];

const TEMPLATES = [
  { value: 'wedding-title', label: 'Wedding Title', title: 'THE CEREMONY', subtitle: '', paragraph: '', font: 'Cormorant Garamond', size: '32px', weight: '600', spacing: '0.15em', align: 'center' },
  { value: 'location-tag', label: 'Location Title', title: '', subtitle: 'KOCHI, KERALA', paragraph: '', font: 'DM Sans', size: '14px', weight: '500', spacing: '0.2em', align: 'center' },
  { value: 'story-section', label: 'Story Section', title: 'GETTING READY', subtitle: 'The morning of', paragraph: 'The excitement was palpable as everyone prepared for the big day.', font: 'Cormorant Garamond', size: '28px', weight: '400', spacing: '0.08em', align: 'center' },
  { value: 'quote', label: 'Quote Section', title: '', subtitle: '', paragraph: '"Every love story is beautiful, but ours is my favorite."', font: 'Cormorant Garamond', size: '22px', weight: '400', spacing: '0.02em', align: 'center' },
];

/* ── Text Block Editor Modal ── */
interface TextBlockEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  block?: TextBlock | null;
  nextSortOrder: number;
  onSaved: () => void;
}

export function TextBlockEditor({ open, onOpenChange, eventId, block, nextSortOrder, onSaved }: TextBlockEditorProps) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [paragraph, setParagraph] = useState('');
  const [fontFamily, setFontFamily] = useState('Cormorant Garamond');
  const [fontSize, setFontSize] = useState('24px');
  const [fontWeight, setFontWeight] = useState('400');
  const [textColor, setTextColor] = useState('#1a1a1a');
  const [textAlign, setTextAlign] = useState('center');
  const [letterSpacing, setLetterSpacing] = useState('0.05em');
  const [lineHeight, setLineHeight] = useState('1.6');
  const [bgStyle, setBgStyle] = useState('transparent');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (block) {
      setTitle(block.title || '');
      setSubtitle(block.subtitle || '');
      setParagraph(block.paragraph || '');
      setFontFamily(block.font_family);
      setFontSize(block.font_size);
      setFontWeight(block.font_weight);
      setTextColor(block.text_color);
      setTextAlign(block.text_align);
      setLetterSpacing(block.letter_spacing);
      setLineHeight(block.line_height);
      setBgStyle(block.bg_style);
    } else {
      setTitle(''); setSubtitle(''); setParagraph('');
      setFontFamily('Cormorant Garamond'); setFontSize('24px');
      setFontWeight('400'); setTextColor('#1a1a1a'); setTextAlign('center');
      setLetterSpacing('0.05em'); setLineHeight('1.6'); setBgStyle('transparent');
    }
  }, [block, open]);

  const applyTemplate = (tplValue: string) => {
    const tpl = TEMPLATES.find(t => t.value === tplValue);
    if (!tpl) return;
    setTitle(tpl.title); setSubtitle(tpl.subtitle); setParagraph(tpl.paragraph);
    setFontFamily(tpl.font); setFontSize(tpl.size); setFontWeight(tpl.weight);
    setLetterSpacing(tpl.spacing); setTextAlign(tpl.align);
  };

  const handleSave = async () => {
    if (!title && !subtitle && !paragraph) {
      toast.error('Add at least a title, subtitle, or paragraph');
      return;
    }
    setSaving(true);
    const payload = {
      event_id: eventId,
      title: title || null,
      subtitle: subtitle || null,
      paragraph: paragraph || null,
      sort_order: block?.sort_order ?? nextSortOrder,
      font_family: fontFamily,
      font_size: fontSize,
      font_weight: fontWeight,
      text_color: textColor,
      text_align: textAlign,
      letter_spacing: letterSpacing,
      line_height: lineHeight,
      bg_style: bgStyle,
    };

    if (block) {
      await (supabase.from('gallery_text_blocks' as any).update(payload as any).eq('id', block.id) as any);
    } else {
      await (supabase.from('gallery_text_blocks' as any).insert(payload as any) as any);
    }

    setSaving(false);
    toast.success(block ? 'Text block updated' : 'Text block added');
    onSaved();
    onOpenChange(false);
  };

  const getBgPreview = () => {
    switch (bgStyle) {
      case 'white': return 'bg-white';
      case 'cream': return 'bg-[#FAF7F2]';
      case 'light-gray': return 'bg-[#F5F5F5]';
      case 'dark': return 'bg-[#1a1a1a]';
      default: return 'bg-transparent';
    }
  };

  const previewTextColor = bgStyle === 'dark' ? '#F5F0E8' : textColor;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">
            {block ? 'Edit Text Block' : 'Add Text Block'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Templates */}
          {!block && (
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 block">Quick Templates</Label>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map(t => (
                  <Button key={t.value} variant="outline" size="sm" className="text-[10px] h-7"
                    onClick={() => applyTemplate(t.value)}>
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="space-y-3">
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="THE CEREMONY" className="mt-1" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Subtitle</Label>
              <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="A moment to remember" className="mt-1" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Paragraph</Label>
              <Textarea value={paragraph} onChange={e => setParagraph(e.target.value)} placeholder="Write your story..." className="mt-1" rows={3} />
            </div>
          </div>

          {/* Styling */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Font</Label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_FAMILIES.map(f => (
                    <SelectItem key={f.value} value={f.value} className="text-xs" style={{ fontFamily: f.value }}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Size</Label>
              <Select value={fontSize} onValueChange={setFontSize}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['14px','16px','18px','20px','24px','28px','32px','36px','42px','48px'].map(s => (
                    <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Weight</Label>
              <Select value={fontWeight} onValueChange={setFontWeight}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[{v:'300',l:'Light'},{v:'400',l:'Regular'},{v:'500',l:'Medium'},{v:'600',l:'Semi Bold'},{v:'700',l:'Bold'}].map(w => (
                    <SelectItem key={w.v} value={w.v} className="text-xs">{w.l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Background</Label>
              <Select value={bgStyle} onValueChange={setBgStyle}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BG_STYLES.map(b => (
                    <SelectItem key={b.value} value={b.value} className="text-xs">{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Alignment */}
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 block">Alignment</Label>
            <div className="flex gap-1">
              {[{ v: 'left', icon: AlignLeft }, { v: 'center', icon: AlignCenter }, { v: 'right', icon: AlignRight }].map(a => (
                <Button key={a.v} variant={textAlign === a.v ? 'default' : 'outline'} size="sm" className="h-8 w-8 p-0"
                  onClick={() => setTextAlign(a.v)}>
                  <a.icon className="h-3.5 w-3.5" />
                </Button>
              ))}
            </div>
          </div>

          {/* Advanced */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)}
                  className="w-8 h-8 rounded border border-border cursor-pointer" />
                <Input value={textColor} onChange={e => setTextColor(e.target.value)} className="text-xs flex-1" />
              </div>
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Letter Spacing</Label>
              <Input value={letterSpacing} onChange={e => setLetterSpacing(e.target.value)} className="mt-1 text-xs" placeholder="0.05em" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Line Height</Label>
              <Input value={lineHeight} onChange={e => setLineHeight(e.target.value)} className="mt-1 text-xs" placeholder="1.6" />
            </div>
          </div>

          {/* Preview */}
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 block">Preview</Label>
            <div className={`rounded-lg border border-border p-8 ${getBgPreview()}`} style={{ textAlign: textAlign as any }}>
              {title && (
                <h3 style={{
                  fontFamily, fontSize, fontWeight: fontWeight as any,
                  color: previewTextColor, letterSpacing, lineHeight,
                }}>{title}</h3>
              )}
              {subtitle && (
                <p className="mt-1" style={{
                  fontFamily, fontSize: `calc(${fontSize} * 0.6)`,
                  color: previewTextColor, letterSpacing, opacity: 0.7,
                }}>{subtitle}</p>
              )}
              {paragraph && (
                <p className="mt-3" style={{
                  fontFamily, fontSize: `calc(${fontSize} * 0.55)`,
                  color: previewTextColor, lineHeight, opacity: 0.8,
                }}>{paragraph}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : block ? 'Update' : 'Add Text Block'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Text Block List Manager (inline in EventGallery) ── */
interface TextBlockManagerProps {
  eventId: string;
  textBlocks: TextBlock[];
  onRefresh: () => void;
}

export function TextBlockManager({ eventId, textBlocks, onRefresh }: TextBlockManagerProps) {
  const [editBlock, setEditBlock] = useState<TextBlock | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const deleteBlock = async (blockId: string) => {
    await (supabase.from('gallery_text_blocks' as any).delete().eq('id', blockId) as any);
    toast.success('Text block removed');
    onRefresh();
  };

  const moveBlock = async (block: TextBlock, direction: 'up' | 'down') => {
    const sorted = [...textBlocks].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(b => b.id === block.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const other = sorted[swapIdx];
    await Promise.all([
      (supabase.from('gallery_text_blocks' as any).update({ sort_order: other.sort_order } as any).eq('id', block.id) as any),
      (supabase.from('gallery_text_blocks' as any).update({ sort_order: block.sort_order } as any).eq('id', other.id) as any),
    ]);
    onRefresh();
  };

  const getBgLabel = (bg: string) => BG_STYLES.find(b => b.value === bg)?.label || bg;

  if (textBlocks.length === 0) return null;

  return (
    <>
      <div className="space-y-2 mb-4">
        <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground/50 font-medium flex items-center gap-1.5">
          <Type className="h-3 w-3" /> Text Blocks ({textBlocks.length})
        </p>
        {textBlocks.sort((a, b) => a.sort_order - b.sort_order).map((block, idx) => (
          <div key={block.id} className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-card/50">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {block.title || block.subtitle || block.paragraph?.slice(0, 40) || 'Untitled'}
              </p>
              <p className="text-[10px] text-muted-foreground/50">
                Position {block.sort_order} · {getBgLabel(block.bg_style)}
              </p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveBlock(block, 'up')} disabled={idx === 0}>
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveBlock(block, 'down')} disabled={idx === textBlocks.length - 1}>
                <ChevronDown className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditBlock(block); setEditorOpen(true); }}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteBlock(block.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <TextBlockEditor
        open={editorOpen}
        onOpenChange={(v) => { setEditorOpen(v); if (!v) setEditBlock(null); }}
        eventId={eventId}
        block={editBlock}
        nextSortOrder={Math.max(...textBlocks.map(b => b.sort_order), 0) + 1}
        onSaved={onRefresh}
      />
    </>
  );
}

/* ── Public Gallery Text Block Renderer ── */
interface GalleryTextBlockProps {
  block: TextBlock;
}

export function GalleryTextBlockRenderer({ block }: GalleryTextBlockProps) {
  const getBgClass = () => {
    switch (block.bg_style) {
      case 'white': return 'bg-white';
      case 'cream': return 'bg-[#FAF7F2]';
      case 'light-gray': return 'bg-[#F5F5F5]';
      case 'dark': return 'bg-[#1a1a1a]';
      default: return '';
    }
  };

  const textColor = block.bg_style === 'dark' ? '#F5F0E8' : block.text_color;

  return (
    <div
      className={`w-full py-10 sm:py-14 md:py-16 px-6 ${getBgClass()}`}
      style={{ textAlign: block.text_align as any }}
    >
      <div className="max-w-2xl mx-auto">
        {block.title && (
          <h3 style={{
            fontFamily: block.font_family,
            fontSize: block.font_size,
            fontWeight: block.font_weight as any,
            color: textColor,
            letterSpacing: block.letter_spacing,
            lineHeight: block.line_height,
          }}>
            {block.title}
          </h3>
        )}
        {block.subtitle && (
          <p className="mt-2" style={{
            fontFamily: block.font_family,
            fontSize: `calc(${block.font_size} * 0.55)`,
            color: textColor,
            letterSpacing: block.letter_spacing,
            opacity: 0.65,
            textTransform: 'uppercase' as any,
          }}>
            {block.subtitle}
          </p>
        )}
        {block.paragraph && (
          <p className="mt-4" style={{
            fontFamily: block.font_family,
            fontSize: `calc(${block.font_size} * 0.5)`,
            color: textColor,
            lineHeight: block.line_height,
            opacity: 0.8,
          }}>
            {block.paragraph}
          </p>
        )}
      </div>
    </div>
  );
}
