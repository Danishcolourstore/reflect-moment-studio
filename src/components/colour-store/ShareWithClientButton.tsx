import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const dm = '"DM Sans", sans-serif';
const ease = [0.16, 1, 0.3, 1];

interface Props {
  photoUrl: string;
}

export default function ShareWithClientButton({ photoUrl }: Props) {
  const [shared, setShared] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const { toast } = useToast();

  const handleShare = useCallback(() => {
    // Generate a unique preview ID
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const url = `${window.location.origin}/preview/${id}`;

    // Store preview data in sessionStorage for demo
    sessionStorage.setItem(`preview-${id}`, JSON.stringify({
      originalUrl: photoUrl,
      retouchedUrl: photoUrl,
      createdAt: Date.now(),
    }));

    setShareUrl(url);
    setShared(true);

    // Copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: 'Link copied', description: 'Client preview link copied to clipboard' });
    }).catch(() => {
      toast({ title: 'Link generated', description: url });
    });
  }, [photoUrl, toast]);

  return (
    <div className="w-full max-w-sm">
      <AnimatePresence mode="wait">
        {!shared ? (
          <motion.button
            key="share-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleShare}
            className="w-full py-3 rounded-full text-center transition-all duration-300 hover:border-[rgba(232,201,122,0.3)]"
            style={{
              fontFamily: dm,
              fontSize: 10,
              color: '#E8C97A',
              letterSpacing: '0.15em',
              border: '1px solid rgba(232,201,122,0.2)',
              background: 'transparent',
            }}
          >
            SHARE WITH CLIENT
          </motion.button>
        ) : (
          <motion.div
            key="share-result"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className="flex flex-col items-center gap-2"
          >
            <p className="text-[10px] tracking-[0.15em] uppercase" style={{ fontFamily: dm, color: '#E8C97A' }}>
              ✓ Client preview link copied
            </p>
            <p className="text-[9px] text-center break-all px-4" style={{ fontFamily: dm, color: '#3A3A3A' }}>
              {shareUrl}
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                toast({ title: 'Copied again' });
              }}
              className="text-[9px] uppercase tracking-[0.2em] mt-1"
              style={{ fontFamily: dm, color: 'rgba(240,237,232,0.3)' }}
            >
              Copy again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
