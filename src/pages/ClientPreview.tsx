import { useParams, useNavigate } from 'react-router-dom';

export default function ClientPreview() {
  const { previewId } = useParams<{ previewId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-xl font-serif text-foreground">Preview not found</p>
        <p className="mt-3 text-xs text-muted-foreground tracking-widest uppercase">
          This link may have expired
        </p>
        <button
          onClick={() => navigate('/home')}
          className="mt-6 text-sm text-primary underline"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
