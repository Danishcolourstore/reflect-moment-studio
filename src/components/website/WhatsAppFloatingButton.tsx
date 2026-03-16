import { MessageCircle } from 'lucide-react';

interface WhatsAppFloatingButtonProps {
  phoneNumber: string;
  studioName?: string;
}

/**
 * Floating WhatsApp CTA button for public photographer websites
 * Positioned bottom-right, above any bottom navigation
 */
export function WhatsAppFloatingButton({ phoneNumber, studioName }: WhatsAppFloatingButtonProps) {
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  if (!cleanNumber) return null;

  const message = encodeURIComponent(
    `Hi${studioName ? `, I saw ${studioName}'s portfolio` : ''} and I'm interested in booking. Can we discuss?`
  );

  return (
    <a
      href={`https://wa.me/${cleanNumber}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed z-[400] flex items-center gap-2 rounded-full shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl group"
      style={{
        bottom: 24,
        right: 24,
        backgroundColor: '#25D366',
        padding: '14px',
      }}
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-6 w-6 text-white" fill="white" />
      <span className="hidden group-hover:inline-block text-white text-xs font-medium pr-2 whitespace-nowrap animate-in fade-in slide-in-from-right-2 duration-200">
        Chat with us
      </span>
    </a>
  );
}
