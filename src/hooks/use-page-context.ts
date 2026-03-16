import { useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';

export type PageContext = {
  page: 'dashboard' | 'album_builder' | 'event_gallery' | 'gallery_delivery' | 'settings' | 'domains' | 'other';
  pageLabel: string;
  entityId: string | null;
  entityName: string | null;
};

export function usePageContext(): PageContext {
  const location = useLocation();
  const path = location.pathname;

  return useMemo(() => {
    // Album builder
    const albumMatch = path.match(/\/dashboard\/album-editor\/([^/]+)/);
    if (albumMatch) return { page: 'album_builder' as const, pageLabel: 'Album Builder', entityId: albumMatch[1], entityName: null };

    const albumDesigner = path.match(/\/dashboard\/album-designer/);
    if (albumDesigner) return { page: 'album_builder' as const, pageLabel: 'Album Designer', entityId: null, entityName: null };

    // Gallery delivery
    const deliverMatch = path.match(/\/dashboard\/gallery\/([^/]+)\/deliver/);
    if (deliverMatch) return { page: 'gallery_delivery' as const, pageLabel: 'Gallery Delivery', entityId: deliverMatch[1], entityName: null };

    // Event gallery
    const galleryMatch = path.match(/\/dashboard\/gallery\/([^/]+)/);
    if (galleryMatch) return { page: 'event_gallery' as const, pageLabel: 'Event Gallery', entityId: galleryMatch[1], entityName: null };

    const eventMatch = path.match(/\/dashboard\/events\/([^/]+)/);
    if (eventMatch) return { page: 'event_gallery' as const, pageLabel: 'Event Gallery', entityId: eventMatch[1], entityName: null };

    // Domains
    if (path.includes('/dashboard/domains')) return { page: 'domains' as const, pageLabel: 'Domains', entityId: null, entityName: null };

    // Settings
    if (path.includes('/dashboard/settings') || path.includes('/dashboard/profile') || path.includes('/dashboard/branding'))
      return { page: 'settings' as const, pageLabel: 'Settings', entityId: null, entityName: null };

    // Dashboard
    if (path.startsWith('/dashboard'))
      return { page: 'dashboard' as const, pageLabel: 'Dashboard', entityId: null, entityName: null };

    return { page: 'other' as const, pageLabel: 'Mirror AI', entityId: null, entityName: null };
  }, [path]);
}
