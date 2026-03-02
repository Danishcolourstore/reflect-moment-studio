import { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Bug, Upload, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function BetaFeedbackButton() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const authPages = ['/', '/login', '/signup', '/reset-password', '/forgot-password'];
  if (!user || authPages.includes(location.pathname)) return null;

  const handleSubmit = async () => {
    if (!message.trim()) { toast.error('Please describe what happened'); return; }
    setSubmitting(true);

    let screenshotUrl: string | null = null;
    if (screenshot) {
      const ext = screenshot.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('feedback-screenshots').upload(path, screenshot);
      if (!error) {
        screenshotUrl = supabase.storage.from('feedback-screenshots').getPublicUrl(path).data.publicUrl;
      }
    }

    const { error } = await supabase.from('beta_feedback').insert({
      user_id: user.id,
      page: location.pathname,
      message: message.trim(),
      screenshot_url: screenshotUrl,
    } as any);

    if (error) {
      toast.error('Failed to submit feedback');
    } else {
      toast.success('Feedback submitted — thank you!');
      setOpen(false);
      setMessage('');
      setScreenshot(null);
    }
    setSubmitting(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 lg:bottom-6 right-4 z-40 flex items-center gap-1.5 px-3 py-2 rounded-full bg-card border border-border shadow-lg text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
      >
        <Bug className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Report Issue</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Report an Issue</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Page</label>
              <p className="text-[13px] text-foreground mt-1 bg-secondary/50 px-3 py-2 rounded-md font-mono">{location.pathname}</p>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">What happened? *</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the issue you encountered..."
                className="mt-1 bg-background min-h-[120px] text-[13px]"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Screenshot (optional)</label>
              {screenshot ? (
                <div className="mt-1 flex items-center gap-2 bg-secondary/50 px-3 py-2 rounded-md">
                  <span className="text-[12px] text-foreground truncate flex-1">{screenshot.name}</span>
                  <button onClick={() => setScreenshot(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="mt-1 h-8 text-[11px]" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-3 w-3 mr-1.5" /> Attach Screenshot
                </Button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setScreenshot(f); }} />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || !message.trim()}
              className="w-full bg-primary text-primary-foreground text-[11px] uppercase tracking-wider"
            >
              {submitting ? <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Submitting...</> : 'Submit Feedback'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
