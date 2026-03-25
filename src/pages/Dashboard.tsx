import React from "react";

// \u2500\u2500 Types \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

interface StatCardProps {
  num: number | string;
  label: string;
}

interface FeatureCardProps {
  icon: React.ReactNode;
  name: string;
  sub: string;
}

interface WorkCardProps {
  name: string;
  date: string;
  thumb?: React.ReactNode;
}

// \u2500\u2500 Icons \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" style={styles.featureSvg}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const MirrorAIIcon = () => (
  <svg viewBox="0 0 24 24" style={styles.featureSvg}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 12a3 3 0 0 0 6 0" />
    <circle cx="9" cy="9" r="1" fill="#888888" stroke="none" />
    <circle cx="15" cy="9" r="1" fill="#888888" stroke="none" />
  </svg>
);

const AlbumsIcon = () => (
  <svg viewBox="0 0 24 24" style={styles.featureSvg}>
    <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    <path d="M3 9h18M9 21V9" />
  </svg>
);

const GridIcon = () => (
  <svg viewBox="0 0 24 24" style={styles.featureSvg}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const ClientsIcon = () => (
  <svg viewBox="0 0 24 24" style={styles.featureSvg}>
    <circle cx="9" cy="7" r="4" />
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
  </svg>
);

const AnalyticsIcon = () => (
  <svg viewBox="0 0 24 24" style={styles.featureSvg}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const ImagePlaceholderIcon = () => (
  <svg viewBox="0 0 24 24" style={styles.thumbSvg}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

// \u2500\u2500 Thumbnails \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

const ColoursOfLifeThumb = () => (
  <svg
    viewBox="0 0 160 210"
    style={{ width: "100%", height: "100%" }}
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <linearGradient id="wg1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#8B6914" stopOpacity={0.6} />
        <stop offset="100%" stopColor="#2a1a08" stopOpacity={0.9} />
      </linearGradient>
    </defs>
    <rect width="160" height="210" fill="url(#wg1)" />
    <line x1="30" y1="210" x2="130" y2="60" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
    <line x1="60" y1="210" x2="160" y2="60" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
    <ellipse cx="90" cy="120" rx="12" ry="22" fill="rgba(255,220,180,0.3)" />
    <ellipse cx="110" cy="130" rx="14" ry="24" fill="rgba(220,160,120,0.35)" />
  </svg>
);

const DanceThumb = () => (
  <svg
    viewBox="0 0 160 210"
    style={{ width: "100%", height: "100%" }}
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <radialGradient id="spot" cx="50%" cy="60%">
        <stop offset="0%" stopColor="white" stopOpacity={0.6} />
        <stop offset="60%" stopColor="white" stopOpacity={0.05} />
        <stop offset="100%" stopColor="white" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect width="160" height="210" fill="#0a0a0a" />
    <ellipse cx="80" cy="130" rx="70" ry="80" fill="url(#spot)" />
    <ellipse cx="80" cy="95" rx="9" ry="12" fill="rgba(255,255,255,0.7)" />
    <rect x="72" y="107" width="16" height="30" rx="3" fill="rgba(255,255,255,0.65)" />
    <line x1="72" y1="115" x2="55" y2="130" stroke="rgba(255,255,255,0.6)" strokeWidth="3" strokeLinecap="round" />
    <line x1="88" y1="115" x2="105" y2="128" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round" />
    <line x1="76" y1="137" x2="68" y2="165" stroke="rgba(255,255,255,0.6)" strokeWidth="3" strokeLinecap="round" />
    <line x1="84" y1="137" x2="90" y2="165" stroke="rgba(255,255,255,0.6)" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const CoupleThumb = () => (
  <svg
    viewBox="0 0 160 210"
    style={{ width: "100%", height: "100%" }}
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <radialGradient id="wl" cx="50%" cy="40%">
        <stop offset="0%" stopColor="#d4b896" stopOpacity={0.5} />
        <stop offset="100%" stopColor="#c9a882" stopOpacity={0.1} />
      </radialGradient>
    </defs>
    <rect width="160" height="210" fill="#e8e0d5" />
    <rect width="160" height="210" fill="url(#wl)" />
    <ellipse cx="75" cy="90" rx="10" ry="13" fill="rgba(50,40,30,0.7)" />
    <rect x="65" y="103" width="20" height="55" rx="4" fill="rgba(30,25,20,0.8)" />
    <ellipse cx="100" cy="78" rx="8" ry="11" fill="