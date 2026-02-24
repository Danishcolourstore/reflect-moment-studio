import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, CheckCircle2 } from 'lucide-react';
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
    if (!user) return;
    (supabase.from('events').select('id, name') as any).eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }: any) => { if (data) setEvents(data as SimpleEvent[]); });
  }, [user]);

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
        await supabase.from('photos').insert({
          event_id: selectedEvent,
          user_id: user.id,
          url: publicUrl,
          file_name: file.name,
        } as any);
        count++;
      }
    }

    setUploadCount(count);
    setUploading(false);
    toast({ title: `${count} photo${count > 1 ? 's' : ''} uploaded` });
  };

  return (
    <DashboardLayout>
      <h1 className="font-serif text-xl font-semibold text-foreground mb-6">Upload Photos</h1>

      <div className="max-w-lg mx-auto space-y-5">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Select Event</label>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="bg-card border-border h-9 text-[13px]"><SelectValue placeholder="Choose an event..." /></SelectTrigger>
            <SelectContent>
              {events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <label className={`flex cursor-pointer flex-col items-center justify-center border border-dashed py-14 transition-colors ${
          selectedEvent ? 'border-gold/40 hover:border-gold/70 hover:bg-secondary/30' : 'border-border opacity-50 cursor-not-allowed'
        }`}>
          <Upload className="h-7 w-7 text-muted-foreground/30 mb-2.5" />
          <p className="text-[12px] text-muted-foreground/60 font-medium">{uploading ? 'Uploading...' : 'Drag photos here or click to upload'}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/40">JPG, PNG, WEBP up to 20MB each</p>
          <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => e.target.files && handleUpload(e.target.files)} disabled={uploading || !selectedEvent} />
        </label>

        {uploadCount > 0 && (
          <div className="flex items-center justify-center gap-1.5 text-gold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <p className="text-[12px] font-medium">{uploadCount} photos uploaded</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UploadPage;
