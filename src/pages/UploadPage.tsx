import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Upload, CheckCircle2, Camera, ImagePlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useDeviceDetect } from '@/hooks/use-device-detect';
import { toast } from 'sonner';
import { usePhotoUpload } from '@/hooks/use-photo-upload';
import { UploadProgressPanel } from '@/components/UploadProgressPanel';

const UploadPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const device = useDeviceDetect();
  const isMobile = device.isPhone;
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [optimizedUpload, setOptimizedUpload] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const upload = usePhotoUpload(selectedEvent || undefined, user?.id, optimizedUpload);

  useEffect(() => {
    if (!user) return;
    (supabase.from('events').select('id, name') as any).eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }: any) => { if (data) setEvents(data); });
  }, [user]);

  const handleUpload = async (files: File[]) => {
    if (!user || !selectedEvent) {
      toast.error('Choose an event first');
      return;
    }
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    upload.uploadFiles(imageFiles);
  };

  const canUpload = !!selectedEvent && !upload.isUploading;

  return (
    <DashboardLayout>
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, color: "hsl(48, 7%, 10%)", marginBottom: 40, letterSpacing: "0.02em" }}>Add Your Work</h1>

      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        {/* Event selector */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">Event</label>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="bg-card border-border h-11 sm:h-10 text-[13px]">
              <SelectValue placeholder="Choose an event..." />
            </SelectTrigger>
            <SelectContent>
              {events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) handleUpload(Array.from(e.dataTransfer.files)); }}
          onClick={() => canUpload && inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center border border-dashed transition-colors ${
            isMobile ? 'py-10' : 'py-16'
          } ${
            isDragging ? 'border-primary bg-primary/5' : canUpload ? 'border-border hover:border-primary/40' : 'border-border opacity-50 cursor-not-allowed'
          }`}
        >
          <Upload className={`text-muted-foreground/25 mb-3 ${isMobile ? 'h-8 w-8' : 'h-10 w-10'}`} />
          <p className="text-sm text-muted-foreground font-medium text-center px-4">
            {upload.isUploading ? `Adding ${upload.completedFiles} of ${upload.totalFiles}…` : isMobile ? 'Tap to add photos' : 'Drop photos here, or tap to browse'}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground/50">JPG, PNG, WEBP — up to 100 MB each</p>
          <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => e.target.files && handleUpload(Array.from(e.target.files))} disabled={!canUpload} />
        </div>

        {/* Mobile camera button */}
        {isMobile && (
          <button
            onClick={() => canUpload && cameraRef.current?.click()}
            disabled={!canUpload}
            className="w-full flex items-center justify-center gap-2 h-12 bg-primary/10 text-primary font-medium text-sm tracking-wide active:scale-[0.97] transition-all disabled:opacity-40"
          >
            <Camera className="h-5 w-5" />
            Capture
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files && handleUpload(Array.from(e.target.files))} disabled={!canUpload} />
          </button>
        )}

        {/* Optimized upload toggle */}
        <div className="flex items-center justify-between bg-card border border-border px-4 py-3">
          <div className="flex-1 min-w-0">
            <Label className="text-[12px] text-foreground/80 font-medium">Smart Compression</Label>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
              {optimizedUpload ? 'Faster delivery, no visible quality loss' : 'Original files preserved for print'}
            </p>
          </div>
          <Switch checked={optimizedUpload} onCheckedChange={setOptimizedUpload} />
        </div>

        {/* Progress */}
        <UploadProgressPanel
          {...upload}
          onRetry={upload.retry}
          onRetrySingle={upload.retrySingle}
          onCancel={upload.cancel}
          onDismiss={upload.dismiss}
          duplicateCount={upload.duplicateCount}
        />

        {/* Success state */}
        {upload.isDone && upload.successCount > 0 && upload.failedFiles.length === 0 && (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-primary">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-sm font-medium">{upload.successCount} photos ready</p>
            </div>
            <Button variant="outline" className="min-h-[44px]" onClick={() => navigate(`/dashboard/events/${selectedEvent}`)}>View Gallery</Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UploadPage;
