/**
 * Generate ~4000 points distributed across the cheetah body volume.
 * Returns Float32Arrays for positions (xyz) and colors (rgb).
 * Cyan on top/back, magenta on belly/legs, interpolated.
 */

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function ellipsoidSample(cx: number, cy: number, cz: number, rx: number, ry: number, rz: number): [number, number, number] {
  const u = Math.random() * Math.PI * 2;
  const v = Math.acos(2 * Math.random() - 1);
  const r = Math.cbrt(Math.random());
  return [
    cx + rx * r * Math.sin(v) * Math.cos(u),
    cy + ry * r * Math.sin(v) * Math.sin(u),
    cz + rz * r * Math.cos(v),
  ];
}

interface BodyRegion {
  cx: number; cy: number; cz: number;
  rx: number; ry: number; rz: number;
  count: number;
  colorBias: number; // 0=magenta, 1=cyan
}

export function generateCheetahPoints(totalTarget = 4000): { positions: Float32Array; colors: Float32Array } {
  const regions: BodyRegion[] = [
    // Torso (main body) — largest region
    { cx: 0, cy: 0.85, cz: 0, rx: 0.7, ry: 0.22, rz: 0.18, count: Math.floor(totalTarget * 0.30), colorBias: 0.6 },
    // Chest/front torso
    { cx: 0.55, cy: 0.88, cz: 0, rx: 0.25, ry: 0.20, rz: 0.16, count: Math.floor(totalTarget * 0.08), colorBias: 0.7 },
    // Rear torso
    { cx: -0.5, cy: 0.82, cz: 0, rx: 0.25, ry: 0.20, rz: 0.17, count: Math.floor(totalTarget * 0.08), colorBias: 0.5 },
    // Neck
    { cx: 0.85, cy: 0.98, cz: 0, rx: 0.18, ry: 0.14, rz: 0.10, count: Math.floor(totalTarget * 0.07), colorBias: 0.8 },
    // Head
    { cx: 1.15, cy: 1.08, cz: 0, rx: 0.14, ry: 0.12, rz: 0.10, count: Math.floor(totalTarget * 0.08), colorBias: 0.9 },
    // Snout
    { cx: 1.35, cy: 1.05, cz: 0, rx: 0.08, ry: 0.06, rz: 0.06, count: Math.floor(totalTarget * 0.03), colorBias: 0.9 },
    // Front-left leg
    { cx: 0.45, cy: 0.42, cz: 0.10, rx: 0.06, ry: 0.30, rz: 0.05, count: Math.floor(totalTarget * 0.05), colorBias: 0.2 },
    // Front-right leg
    { cx: 0.45, cy: 0.42, cz: -0.10, rx: 0.06, ry: 0.30, rz: 0.05, count: Math.floor(totalTarget * 0.05), colorBias: 0.2 },
    // Rear-left leg
    { cx: -0.45, cy: 0.40, cz: 0.12, rx: 0.07, ry: 0.32, rz: 0.06, count: Math.floor(totalTarget * 0.05), colorBias: 0.15 },
    // Rear-right leg
    { cx: -0.45, cy: 0.40, cz: -0.12, rx: 0.07, ry: 0.32, rz: 0.06, count: Math.floor(totalTarget * 0.05), colorBias: 0.15 },
    // Tail
    { cx: -1.0, cy: 0.82, cz: 0, rx: 0.04, ry: 0.04, rz: 0.03, count: Math.floor(totalTarget * 0.03), colorBias: 0.5 },
    { cx: -1.3, cy: 0.90, cz: 0, rx: 0.04, ry: 0.03, rz: 0.03, count: Math.floor(totalTarget * 0.03), colorBias: 0.4 },
    { cx: -1.55, cy: 1.00, cz: 0, rx: 0.03, ry: 0.03, rz: 0.02, count: Math.floor(totalTarget * 0.03), colorBias: 0.3 },
    { cx: -1.75, cy: 1.08, cz: 0, rx: 0.025, ry: 0.025, rz: 0.02, count: Math.floor(totalTarget * 0.02), colorBias: 0.3 },
    // Ears
    { cx: 1.12, cy: 1.28, cz: 0.08, rx: 0.03, ry: 0.05, rz: 0.02, count: Math.floor(totalTarget * 0.015), colorBias: 1.0 },
    { cx: 1.12, cy: 1.28, cz: -0.08, rx: 0.03, ry: 0.05, rz: 0.02, count: Math.floor(totalTarget * 0.015), colorBias: 1.0 },
    // Shoulder hump
    { cx: 0.3, cy: 0.95, cz: 0, rx: 0.15, ry: 0.08, rz: 0.14, count: Math.floor(totalTarget * 0.04), colorBias: 0.85 },
  ];

  // Calculate total and pad to target
  let totalCount = regions.reduce((s, r) => s + r.count, 0);
  if (totalCount < totalTarget) {
    regions[0].count += totalTarget - totalCount;
  }
  totalCount = totalTarget;

  const positions = new Float32Array(totalCount * 3);
  const colors = new Float32Array(totalCount * 3);

  let idx = 0;
  for (const region of regions) {
    for (let i = 0; i < region.count; i++) {
      const [x, y, z] = ellipsoidSample(region.cx, region.cy, region.cz, region.rx, region.ry, region.rz);
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;

      // Color: lerp cyan (0,1,1) ↔ magenta (1,0,1) based on height + region bias
      const heightFactor = Math.max(0, Math.min(1, (y - 0.1) / 1.2));
      const t = Math.max(0, Math.min(1, heightFactor * 0.4 + region.colorBias * 0.6));
      // t=1 → cyan, t=0 → magenta
      colors[idx * 3] = 1 - t;       // R
      colors[idx * 3 + 1] = t;       // G
      colors[idx * 3 + 2] = 1;       // B (always 1)

      idx++;
    }
  }

  return { positions, colors };
}

/** Generate the glow sprite texture as a data URL */
export function createGlowTexture(): string {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.15, 'rgba(200,255,255,0.8)');
  gradient.addColorStop(0.4, 'rgba(100,200,255,0.3)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return canvas.toDataURL();
}
