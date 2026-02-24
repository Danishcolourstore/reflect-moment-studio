import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, CheckCircle2, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const GuestRegister = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [eventName, setEventName] = useState('');
  const [loading, setLoading] = useState(true);
  const [guestName, setGuestName] = useState('');
  const [email, setEmail] = useState('');
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!eventId) return;
    supabase
      .from('events')
      .select('name, face_recognition_enabled')
      .eq('id', eventId)
      .single()
      .then(({ data }: any) => {
        if (data) {
          setEventName(data.name);
          if (!data.face_recognition_enabled) {
            toast({ title: 'Registration is not enabled for this event', variant: 'destructive' });
          }
        }
        setLoading(false);
      });
  }, [eventId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));
    }
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !email || !selfieFile || !eventId) return;

    setSubmitting(true);

    try {
      // Call detect-face edge function
      const formData = new FormData();
      formData.append('selfie', selfieFile);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(
        `${supabaseUrl}/functions/v1/detect-face`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        let errMsg = 'Face detection failed';
        try {
          const errJson = JSON.parse(errText);
          errMsg = errJson.error || errMsg;
        } catch {
          // non-JSON error
        }
        toast({ title: errMsg, variant: 'destructive' });
        setSubmitting(false);
        return;
      }

      const { face_token } = await res.json();

      // Insert guest registration — selfie is NOT stored
      const { error } = await supabase.from('guest_registrations').insert({
        event_id: eventId,
        guest_name: guestName,
        email,
        face_token,
      } as any);

      if (error) {
        toast({ title: 'Registration failed', description: error.message, variant: 'destructive' });
      } else {
        setSuccess(true);
      }
    } catch {
      toast({ title: 'Something went wrong', variant: 'destructive' });
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1612] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[hsl(29,42%,59%)]" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#1a1612] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[hsl(29,42%,59%)]/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="h-8 w-8 text-[hsl(29,42%,59%)]" />
          </div>
          <h1 className="text-2xl font-serif text-[#f5f0e8] mb-2">You're registered!</h1>
          <p className="text-[#a89a85] text-sm leading-relaxed">
            We'll email you at <strong className="text-[#f5f0e8]">{email}</strong> when your photos are ready 📸
          </p>
          <p className="text-[#6b5e50] text-xs mt-6">
            Your selfie was not stored — only a secure face token is kept for matching.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1612] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-[hsl(29,42%,59%)] tracking-widest mb-1">MirrorAI</h1>
          <p className="text-[#a89a85] text-sm">{eventName}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 bg-[#231f1b] border border-[#352f28] rounded-lg p-6">
          <h2 className="text-lg font-serif text-[#f5f0e8] mb-1">Register to get your photos</h2>
          <p className="text-xs text-[#6b5e50] -mt-3">We'll use AI to find photos of you and send them to your email.</p>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-[0.12em] text-[#a89a85] font-medium">Full Name</label>
            <Input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Your name"
              required
              className="bg-[#1a1612] border-[#352f28] text-[#f5f0e8] placeholder:text-[#4a4038] h-10"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-[0.12em] text-[#a89a85] font-medium">Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
              className="bg-[#1a1612] border-[#352f28] text-[#f5f0e8] placeholder:text-[#4a4038] h-10"
            />
          </div>

          {/* Selfie Section */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.12em] text-[#a89a85] font-medium">Your Selfie</label>

            {selfiePreview ? (
              <div className="relative">
                <img src={selfiePreview} alt="Selfie preview" className="w-full h-48 object-cover rounded-md border border-[#352f28]" />
                <button
                  type="button"
                  onClick={() => { setSelfieFile(null); setSelfiePreview(null); }}
                  className="absolute top-2 right-2 bg-[#1a1612]/80 text-[#a89a85] text-xs px-2 py-1 rounded"
                >
                  Retake
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 h-20 flex-col gap-1 border-[#352f28] bg-[#1a1612] text-[#a89a85] hover:bg-[#231f1b] hover:text-[#f5f0e8]"
                >
                  <Camera className="h-5 w-5" />
                  <span className="text-[10px] uppercase tracking-wider">Take Selfie</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 h-20 flex-col gap-1 border-[#352f28] bg-[#1a1612] text-[#a89a85] hover:bg-[#231f1b] hover:text-[#f5f0e8]"
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-[10px] uppercase tracking-wider">Upload Photo</span>
                </Button>
                {/* Native camera capture — opens camera app on mobile */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {/* Fallback file picker */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={submitting || !guestName || !email || !selfieFile}
            className="w-full h-11 bg-[hsl(29,42%,59%)] hover:bg-[hsl(35,36%,35%)] text-[#1a1612] font-medium text-xs uppercase tracking-widest"
          >
            {submitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Detecting face...</>
            ) : (
              'Register'
            )}
          </Button>
        </form>

        {/* Privacy Notice */}
        <div className="mt-5 flex items-start gap-2 px-2">
          <Shield className="h-3.5 w-3.5 text-[#6b5e50] mt-0.5 shrink-0" />
          <p className="text-[10px] text-[#4a4038] leading-relaxed">
            Your selfie is processed securely and <strong className="text-[#6b5e50]">never stored</strong>. Only an anonymous face token is saved for matching. Your photos are accessible only via your unique email link.
          </p>
        </div>
      </div>

    </div>
  );
};

export default GuestRegister;
