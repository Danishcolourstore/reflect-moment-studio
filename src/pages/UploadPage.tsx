import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface SimpleEvent {
  id: string;
  name: string;
}

const UploadPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<SimpleEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);

  useEffect(() => {
    supabase.from('events').select('id, name').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setEvents(data); });
  }, []);

  const handleUpload = async (files: FileList) => {
    if (!user || !selectedEvent) {
      toast({ title: 'Select an event first', variant: 'destructive' });
      return;
    }
    setUploading(true);
    let count = 0;

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${selectedEvent}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('gallery-photos').upload(path, file);
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('gallery-photos').getPublicUrl(path);
        await supabase.from('photos').insert({ event_id: selectedEvent, user_id: user.id, url: publicUrl, file_name: file.name });
        count++;
      }
    }

    // Update count
    const { count: total } = await supabase.from('photos').select('*', { count: 'exact', head: true }).eq('event_id', selectedEvent);
    if (total !== null) {
      await supabase.from('events').update({ photo_count: total }).eq('id', selectedEvent);
    }

    setUploadCount(count);
    setUploading(false);
    toast({ title: `${count} photo${count > 1 ? 's' : ''} uploaded` });
  };

  return (
    <DashboardLayout>
      <h1 className="font-serif text-3xl font-semibold text-foreground mb-8">Upload Photos</h1>

      <div className="max-w-xl mx-auto space-y-6">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Select Event</label>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="bg-card"><SelectValue placeholder="Choose an event..." /></SelectTrigger>
            <SelectContent>
              {events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gold/40 bg-muted/30 p-16 transition-colors hover:border-gold/70">
          <Upload className="h-10 w-10 text-gold/60 mb-3" />
          <p className="text-sm text-muted-foreground font-medium">{uploading ? 'Uploading...' : 'Drag photos here or click to upload'}</p>
          <p className="mt-1 text-xs text-muted-foreground/60">JPG, PNG, WEBP up to 20MB each</p>
          <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => e.target.files && handleUpload(e.target.files)} disabled={uploading || !selectedEvent} />
        </label>

        {uploadCount > 0 && (
          <p className="text-center text-sm text-gold">{uploadCount} photos uploaded successfully</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UploadPage;
