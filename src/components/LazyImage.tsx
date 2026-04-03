import { useState, useRef, useEffect, CSSProperties, ImgHTMLAttributes } from "react";

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "style"> {
  src: string;
  alt: string;
  /** Fixed width for CLS prevention */
  width?: number | string;
  /** Fixed height for CLS prevention */
  height?: number | string;
  /** CSS aspect-ratio (e.g. "16/10", "1", "4/5") — prevents layout shift */
  aspectRatio?: string;
  /** Placeholder background color while loading */
  placeholderColor?: string;
  /** Additional inline styles on the wrapper */
  wrapperStyle?: CSSProperties;
  /** Additional inline styles on the img */
  imgStyle?: CSSProperties;
  /** className on the wrapper div */
  wrapperClassName?: string;
  /** className on the img */
  imgClassName?: string;
  /** Use a tiny thumbnail URL for blur-up (optional) */
  thumbnailSrc?: string;
  /** Border radius */
  borderRadius?: number | string;
  /** Object-fit */
  objectFit?: CSSProperties["objectFit"];
  /** Callback when image loads */
  onLoaded?: () => void;
}

/**
 * LazyImage — Intersection-observer-based lazy loading with blur-up placeholder.
 * Prevents CLS with aspect-ratio. Matches MirrorAI white editorial style.
 */
export function LazyImage({
  src,
  alt,
  width,
  height,
  aspectRatio,
  placeholderColor = "#F8F8F8",
  wrapperStyle,
  imgStyle,
  wrapperClassName,
  imgClassName,
  thumbnailSrc,
  borderRadius = 0,
  objectFit = "cover",
  onLoaded,
  ...imgProps
}: LazyImageProps) {
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" } // Start loading 200px before entering viewport
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setLoaded(true);
    onLoaded?.();
  };

  return (
    <div
      ref={ref}
      className={wrapperClassName}
      style={{
        position: "relative",
        overflow: "hidden",
        width: width ?? "100%",
        height: height ?? "auto",
        aspectRatio: aspectRatio,
        background: placeholderColor,
        borderRadius,
        ...wrapperStyle,
      }}
    >
      {/* Blur-up thumbnail */}
      {thumbnailSrc && inView && !loaded && (
        <img
          src={thumbnailSrc}
          alt=""
          aria-hidden
          onLoad={() => setThumbLoaded(true)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit,
            filter: "blur(20px)",
            transform: "scale(1.1)",
            opacity: thumbLoaded ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        />
      )}

      {/* Full resolution image */}
      {inView && (
        <img
          {...imgProps}
          src={src}
          alt={alt}
          width={typeof width === "number" ? width : undefined}
          height={typeof height === "number" ? height : undefined}
          onLoad={handleLoad}
          className={imgClassName}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit,
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.5s ease",
            borderRadius,
            ...imgStyle,
          }}
        />
      )}

      {/* Shimmer skeleton while not loaded */}
      {!loaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(90deg, ${placeholderColor} 25%, #F0F0F0 50%, ${placeholderColor} 75%)`,
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s ease-in-out infinite",
            borderRadius,
          }}
        />
      )}
    </div>
  );
}
