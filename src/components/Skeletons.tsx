import { CSSProperties } from "react";

const shimmerBg = (color = "#F8F8F8"): CSSProperties => ({
  background: `linear-gradient(90deg, ${color} 25%, #F0F0F0 50%, ${color} 75%)`,
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s ease-in-out infinite",
});

/** A single skeleton rectangle */
export function SkeletonBox({
  width = "100%",
  height = 16,
  borderRadius = 8,
  style,
}: {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        ...shimmerBg(),
        ...style,
      }}
    />
  );
}

/** Skeleton for an event card (matches the white editorial card style) */
export function EventCardSkeleton() {
  return (
    <div
      style={{
        borderRadius: 20,
        border: "1px solid #EEEEEE",
        background: "#FFFFFF",
        overflow: "hidden",
        boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ aspectRatio: "16/10", ...shimmerBg("#F5F5F5") }} />
      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
        <SkeletonBox width="70%" height={18} borderRadius={4} />
        <SkeletonBox width="50%" height={12} borderRadius={4} />
        <SkeletonBox width="30%" height={10} borderRadius={4} />
      </div>
    </div>
  );
}

/** Skeleton for the dashboard hero section */
export function HeroSkeleton({ mobile }: { mobile: boolean }) {
  return (
    <div
      style={{
        width: "100%",
        height: mobile ? "55vh" : "80vh",
        ...shimmerBg("#F0F0F0"),
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", bottom: mobile ? 32 : 60, left: mobile ? 20 : 60 }}>
        <SkeletonBox width={mobile ? 200 : 350} height={mobile ? 32 : 56} borderRadius={4} style={{ marginBottom: 10 }} />
        <SkeletonBox width={mobile ? 140 : 220} height={14} borderRadius={4} />
      </div>
    </div>
  );
}

/** Skeleton for stat strip */
export function StatsSkeleton({ mobile }: { mobile: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: mobile ? 32 : 64, padding: mobile ? "28px 16px" : "40px 24px" }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ textAlign: "center" }}>
          <SkeletonBox width={mobile ? 40 : 60} height={mobile ? 28 : 40} borderRadius={4} style={{ margin: "0 auto" }} />
          <SkeletonBox width={50} height={10} borderRadius={4} style={{ margin: "8px auto 0" }} />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for gallery grid */
export function GalleryGridSkeleton({ count = 6, mobile }: { count?: number; mobile: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: mobile ? 24 : 20 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div style={{ aspectRatio: "4/5", borderRadius: 20, ...shimmerBg("#F5F5F5") }} />
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            <SkeletonBox width="60%" height={18} borderRadius={4} />
            <SkeletonBox width="40%" height={12} borderRadius={4} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton for photo mosaic */
export function MosaicSkeleton({ count = 12, mobile }: { count?: number; mobile: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(3, 1fr)" : "repeat(6, 1fr)", gap: mobile ? 2 : 3 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ aspectRatio: "1", borderRadius: 4, ...shimmerBg("#F5F5F5") }} />
      ))}
    </div>
  );
}

/** Skeleton for feed item */
export function FeedItemSkeleton() {
  return (
    <div style={{ marginBottom: 56 }}>
      <div style={{ width: "100%", aspectRatio: "4/3", ...shimmerBg("#F5F5F5") }} />
      <div style={{ padding: "16px 24px 0", display: "flex", flexDirection: "column", gap: 8 }}>
        <SkeletonBox width={60} height={10} borderRadius={4} />
        <SkeletonBox width="70%" height={22} borderRadius={4} />
        <SkeletonBox width="40%" height={12} borderRadius={4} />
      </div>
    </div>
  );
}
