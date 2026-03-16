import { useState, useEffect, useMemo } from 'react';

export type DeviceOS = 'android' | 'ios' | 'macos' | 'windows' | 'linux' | 'unknown';
export type DeviceType = 'phone' | 'tablet' | 'desktop';
export type InputMethod = 'touch' | 'mouse' | 'hybrid';

export interface DeviceInfo {
  os: DeviceOS;
  type: DeviceType;
  input: InputMethod;
  isAndroid: boolean;
  isIOS: boolean;
  isMac: boolean;
  isWindows: boolean;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  isMouse: boolean;
  isHybrid: boolean;
  /** True for iPads / Android tablets with touch */
  isTouchTablet: boolean;
  /** True for Surface-style touch laptops */
  isTouchLaptop: boolean;
  isStandalone: boolean;
  hasSafeArea: boolean;
  platformClass: string;
}

function detectOS(): DeviceOS {
  const ua = navigator.userAgent;
  // iPad on iOS 13+ reports as Mac
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document)) return 'ios';
  if (/iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Mac/.test(ua)) return 'macos';
  if (/Win/.test(ua)) return 'windows';
  if (/Linux/.test(ua)) return 'linux';
  return 'unknown';
}

function detectType(os: DeviceOS): DeviceType {
  const ua = navigator.userAgent;
  const w = window.innerWidth;

  // iPads
  if (os === 'ios' && (/iPad/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document))) {
    return 'tablet';
  }

  // Android tablets (no "Mobile" token, or large screen)
  if (os === 'android' && (!/Mobile/.test(ua) || w >= 768)) {
    return w >= 768 ? 'tablet' : 'phone';
  }

  // Phones
  if (os === 'ios' || os === 'android') return 'phone';

  // Desktop
  return 'desktop';
}

function detectInput(): InputMethod {
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;

  if (hasTouch && hasFinePointer) return 'hybrid';
  if (hasTouch) return 'touch';
  return 'mouse';
}

function buildPlatformClass(os: DeviceOS, type: DeviceType, input: InputMethod): string {
  return `platform-${os} device-${type} input-${input}`;
}

function detect(): DeviceInfo {
  const os = detectOS();
  const type = detectType(os);
  const input = detectInput();
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || (navigator as any).standalone === true;

  // Safe area present on iPhones with notch/dynamic island
  const hasSafeArea = os === 'ios' && type === 'phone';

  return {
    os,
    type,
    input,
    isAndroid: os === 'android',
    isIOS: os === 'ios',
    isMac: os === 'macos',
    isWindows: os === 'windows',
    isPhone: type === 'phone',
    isTablet: type === 'tablet',
    isDesktop: type === 'desktop',
    isTouch: input === 'touch',
    isMouse: input === 'mouse',
    isHybrid: input === 'hybrid',
    isTouchTablet: type === 'tablet' && (input === 'touch' || input === 'hybrid'),
    isTouchLaptop: type === 'desktop' && input === 'hybrid',
    isStandalone,
    hasSafeArea,
    platformClass: buildPlatformClass(os, type, input),
  };
}

/**
 * Detects user device, OS, and input method.
 * Applies platform classes to <html> for CSS targeting.
 */
export function useDeviceDetect(): DeviceInfo {
  const [info, setInfo] = useState<DeviceInfo>(detect);

  useEffect(() => {
    // Apply platform classes to <html>
    const el = document.documentElement;
    const classes = info.platformClass.split(' ');
    classes.forEach(c => el.classList.add(c));

    if (info.isStandalone) el.classList.add('is-standalone');
    if (info.hasSafeArea) el.classList.add('has-safe-area');

    return () => {
      classes.forEach(c => el.classList.remove(c));
      el.classList.remove('is-standalone', 'has-safe-area');
    };
  }, [info]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const handleChange = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setInfo(detect()), 150);
    };
    window.addEventListener('resize', handleChange);
    const mql = window.matchMedia('(pointer: fine)');
    mql.addEventListener('change', handleChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleChange);
      mql.removeEventListener('change', handleChange);
    };
  }, []);

  return info;
}

/**
 * Returns a value based on device type
 */
export function useDeviceValue<T>(values: {
  phone: T;
  tablet?: T;
  desktop?: T;
}): T {
  const { type } = useDeviceDetect();
  if (type === 'desktop') return values.desktop ?? values.tablet ?? values.phone;
  if (type === 'tablet') return values.tablet ?? values.phone;
  return values.phone;
}
