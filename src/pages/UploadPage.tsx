import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, CheckCircle2, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

const UploadPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(0);
  const [uploadCount, setUploadCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    (supabase.from('events').select('id, name') as any).eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }: any) => { if (data) setEvents(data); });
  }, [user]);

  const handleUpload = async (files: File[]) => {
    if (!user || !selectedEvent) {
      toast.error('Please select an event first');
      return;
    }
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    setUploading(true);
    setTotal(imageFiles.length);
    setDone(0);
    setUploadCount(0);
    setPreviews([]);
    let count = 0;
    const newPreviews: string[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${selectedEvent}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('gallery-photos').upload(path, file);
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('gallery-photos').getPublicUrl(path);
        await supabase.from('photos').insert({ event_id: selectedEvent, user_id: user.id, url: publicUrl, file_name: file.name, file_size: file.size } as any);
        count++;
        newPreviews.push(publicUrl);
      }
      setDone(i + 1);
      setProgress(Math.round(((i + 1) / imageFiles.length) * 100));
    }

    setPreviews(newPreviews.slice(0, 8));
    setUploadCount(count);
    setUploading(false);
    toast.success(`${count} photo${count > 1 ? 's' : ''} uploaded`);
  };

  return (
    <DashboardLayout>
      <h1 className="font-serif text-2xl font-semibold text-foreground mb-6">Upload Photos</h1>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Select Event</label>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="bg-card border-border h-10 text-[13px]"><SelectValue placeholder="Choose an event..." /></SelectTrigger>
            <SelectContent>
              {events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) handleUpload(Array.from(e.dataTransfer.files)); }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center border-2 border-dashed rounded-xl py-16 transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : selectedEvent ? 'border-border hover:border-primary/40 hover:bg-secondary/30' : 'border-border opacity-50 cursor-not-allowed'
          }`}
        >
          <Upload className="h-10 w-10 text-muted-foreground/25 mb-3" />
          <p className="text-sm text-muted-foreground font-medium">{uploading ? `Uploading ${done}/${total}...` : 'Drag photos here or click to upload'}</p>
          <p className="mt-1 text-[11px] text-muted-foreground/50">JPG, PNG, WEBP up to 20MB each</p>
          <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => e.target.files && handleUpload(Array.from(e.target.files))} disabled={uploading || !selectedEvent} />
        </div>

        {uploading && <Progress value={progress} className="h-1.5" />}

        {uploadCount > 0 && !uploading && (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-primary">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-sm font-medium">{uploadCount} photos uploaded successfully</p>
            </div>
            {previews.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {previews.map((url, i) => (
                  <img key={i} src={url} alt="" className="aspect-square object-cover rounded-lg" />
                ))}
              </div>
            )}
            <Button variant="outline" onClick={() => navigate(`/dashboard/events/${selectedEvent}`)}>View Event</Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UploadPage;
