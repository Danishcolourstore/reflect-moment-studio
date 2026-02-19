import { ReactNode } from 'react';

export function GalleryShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
