import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const SECTIONS = ['Highlights', 'Ceremony', 'Reception', 'Family', 'Getting Ready'] as const;

interface PhotoSectionSelectProps {
  photoId: string;
  currentSection: string | null;
  onUpdate?: (section: string | null) => void;
}

export function PhotoSectionSelect({ photoId, currentSection, onUpdate }: PhotoSectionSelectProps) {
  const [value, setValue] = useState(currentSection ?? '');
  const { toast } = useToast();

  const handleChange = async (newValue: string) => {
    const section = newValue === 'none' ? null : newValue;
    setValue(newValue);
    const { error } = await (supabase.from('photos').update({ section } as any) as any).eq('id', photoId);
    if (error) {
      toast({ title: 'Error', description: 'Could not update section.' });
    } else {
      onUpdate?.(section);
    }
  };

  return (
    <Select value={value || 'none'} onValueChange={handleChange}>
      <SelectTrigger className="h-7 text-[10px] w-[120px] bg-card/80 border-border/50">
        <SelectValue placeholder="Section" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none" className="text-[11px]">No section</SelectItem>
        {SECTIONS.map(s => (
          <SelectItem key={s} value={s} className="text-[11px]">{s}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
