import { useParams } from 'react-router-dom';
import ClientPreviewPage from '@/components/colour-store/ClientPreviewPage';

export default function ClientPreview() {
  const { previewId } = useParams<{ previewId: string }>();

  // Try to load preview data from sessionStorage
  const stored = previewId ? sessionStorage.getItem(`preview-${previewId}`) : null;
  const data = stored ? JSON.parse(stored) : null;

  if (!data) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: '#080808' }}>
        <div className="text-center">
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 24, color: '#F0EDE8', fontWeight: 300 }}>
            Preview not found
          </p>
          <p className="mt-3" style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 10, color: '#3A3A3A', letterSpacing: '0.2em' }}>
            THIS LINK MAY HAVE EXPIRED
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClientPreviewPage
      originalUrl={data.originalUrl}
      retouchedUrl={data.retouchedUrl}
      studioName="Studio"
      previewId={previewId || ''}
      onSubmitAdjustment={() => {
      }}
    />
  );
}
