import * as THREE from 'three';

const CYAN = new THREE.Color(0x00ffff);
const MAGENTA = new THREE.Color(0xff00ff);

function lerp3(a: number[], b: number[], t: number): number[] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function createCheetahGeometry(): THREE.BufferGeometry {
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];

  const bodyProfile = [
    { x: -1.8, y: 0.7, rx: 0.03, ry: 0.03 },
    { x: -1.5, y: 0.74, rx: 0.09, ry: 0.07 },
    { x: -1.1, y: 0.80, rx: 0.17, ry: 0.14 },
    { x: -0.7, y: 0.86, rx: 0.21, ry: 0.18 },
    { x: -0.3, y: 0.83, rx: 0.19, ry: 0.17 },
    { x: 0.1, y: 0.79, rx: 0.17, ry: 0.15 },
    { x: 0.4, y: 0.81, rx: 0.19, ry: 0.17 },
    { x: 0.7, y: 0.86, rx: 0.22, ry: 0.20 },
    { x: 1.0, y: 0.94, rx: 0.14, ry: 0.12 },
    { x: 1.2, y: 1.02, rx: 0.10, ry: 0.09 },
    { x: 1.4, y: 1.09, rx: 0.14, ry: 0.12 },
    { x: 1.55, y: 1.11, rx: 0.12, ry: 0.10 },
    { x: 1.7, y: 1.07, rx: 0.06, ry: 0.05 },
  ];

  const R = 10;
  bodyProfile.forEach((s, i) => {
    for (let j = 0; j < R; j++) {
      const a = (j / R) * Math.PI * 2;
      pos.push(s.x, s.y + Math.sin(a) * s.ry, Math.cos(a) * s.rx);
      const t = (Math.sin(a) + 1) / 2;
      const c = lerp3([MAGENTA.r, MAGENTA.g, MAGENTA.b], [CYAN.r, CYAN.g, CYAN.b], t);
      col.push(c[0], c[1], c[2]);
    }
    if (i > 0) {
      const c0 = i * R, p0 = (i - 1) * R;
      for (let j = 0; j < R; j++) {
        const n = (j + 1) % R;
        idx.push(p0 + j, c0 + j, c0 + n, p0 + j, c0 + n, p0 + n);
      }
    }
  });

  // Legs
  const S = 6;
  const legs: [number, number, number][] = [[-0.7, 0.69, 0.15], [-0.7, 0.69, -0.15], [0.7, 0.67, 0.16], [0.7, 0.67, -0.16]];
  legs.forEach(([lx, ly, lz]) => {
    const base = pos.length / 3;
    for (let r = 0; r < 5; r++) {
      const t = r / 4;
      const y = ly * (1 - t);
      const rad = 0.04 * (1 - t * 0.3);
      for (let s = 0; s < S; s++) {
        const a = (s / S) * Math.PI * 2;
        pos.push(lx + Math.cos(a) * rad, y, lz + Math.sin(a) * rad);
        const c = lerp3([MAGENTA.r, MAGENTA.g, MAGENTA.b], [CYAN.r, CYAN.g, CYAN.b], 0.3 + t * 0.15);
        col.push(c[0], c[1], c[2]);
      }
      if (r > 0) {
        const c0 = base + r * S, p0 = base + (r - 1) * S;
        for (let s = 0; s < S; s++) {
          const n = (s + 1) % S;
          idx.push(p0 + s, c0 + s, c0 + n, p0 + s, c0 + n, p0 + n);
        }
      }
    }
  });

  // Tail
  {
    const base = pos.length / 3;
    const tailPts: [number, number][] = [[-1.8, 0.7], [-2.1, 0.82], [-2.35, 0.96], [-2.5, 1.05], [-2.65, 1.10]];
    tailPts.forEach(([tx, ty], i) => {
      const r = 0.025 * (1 - i * 0.12);
      for (let s = 0; s < S; s++) {
        const a = (s / S) * Math.PI * 2;
        pos.push(tx, ty + Math.sin(a) * r, Math.cos(a) * r);
        col.push(CYAN.r * 0.6, CYAN.g * 0.6, CYAN.b * 0.6);
      }
      if (i > 0) {
        const c0 = base + i * S, p0 = base + (i - 1) * S;
        for (let s = 0; s < S; s++) {
          const n = (s + 1) % S;
          idx.push(p0 + s, c0 + s, c0 + n, p0 + s, c0 + n, p0 + n);
        }
      }
    });
  }

  // Ears
  const eb = pos.length / 3;
  pos.push(1.38, 1.23, 0.08, 1.43, 1.37, 0.11, 1.48, 1.23, 0.09);
  pos.push(1.38, 1.23, -0.08, 1.43, 1.37, -0.11, 1.48, 1.23, -0.09);
  for (let i = 0; i < 6; i++) col.push(0, 1, 1);
  idx.push(eb, eb + 1, eb + 2, eb + 3, eb + 4, eb + 5);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}
