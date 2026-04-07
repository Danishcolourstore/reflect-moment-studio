import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getOptimizedUrl } from '@/lib/image-utils';
import type { LightboxPhoto } from './CinematicLightbox';

interface LightboxImageProps {
  photo: LightboxPhoto;
  dragX: number;
  dragY: number;
  scale: number;
  panX: number;
  panY: number;
  isDragging: boolean;
  entryAnimation: {
    initial: object;
    animate: object;
    exit: object;
    transition: object;
  };
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

export function LightboxImage({
  photo, dragX, dragY, scale, panX, panY, isDragging,
  entryAnimation, onTouchStart, onTouchMove, onTouchEnd,
}: LightboxImageProps) {
  const [fullLoaded, setFullLoaded] = useState(false);

  useEffect(() => {
    setFullLoaded(false);
    const img = new Image();
    img.onload = () => setFullLoaded(true);
    img.src = photo.url;
  }, [photo.url]);

  const tx = scale > 1.05 ? panX : dragX;
  const ty = scale > 1.05 ? panY : dragY;

  return (
    <motion.img
      key={photo.id}
      src={fullLoaded ? photo.url : getOptimizedUrl(photo.url, 'medium')}
      alt=""
      draggable={false}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={(e) => e.stopPropagation()}
      className="select-none"
      style={{
        width: '100vw',
        height: '100dvh',
        objectFit: 'contain',
        objectPosition: 'center',
        display: 'block',
        userSelect: 'none',
        willChange: 'transform',
        transform: `translateX(${tx}px) translateY(${ty}px) scale(${scale})`,
        transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.32,0,0.15,1)',
      }}
      {...entryAnimation}
    />
  );
}
