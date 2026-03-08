/**
 * Canva-style font picker with search, categories, previews,
 * recently used, favorites, and font pairings.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, Star, Clock, Sparkles, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FONT_LIBRARY, FONT_CATEGORIES, FONT_PAIRINGS,
  loadFont, isFontLoaded, preloadCommonFonts,
  getRecentFonts, addRecentFont,
  getFavoriteFonts, toggleFavoriteFont,
  type FontCategory, type FontDef,
} from './font-library';

interface Props {
  value: string;
  onChange: (family: string) => void;
  /** Compact mode for inline toolbar */
  compact?: boolean;
}

type Tab = 'all' | FontCategory | 'recent' | 'favorites' | 'pairings';

export default function FontPicker({ value, onChange, compact }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [recentFonts, setRecentFonts] = useState<string[]>(getRecentFonts);
  const [favFonts, setFavFonts] = useState<string[]>(getFavoriteFonts);
  const [visibleFonts, setVisibleFonts] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Preload common fonts on mount
  useEffect(() => { preloadCommonFonts(); }, []);

  // Load current font
  useEffect(() => { loadFont(value); }, [value]);

  // Intersection observer for lazy font loading
  useEffect(() => {
    if (!open || !listRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const family = entry.target.getAttribute('data-font-family');
            if (family && !isFontLoaded(family)) {
              loadFont(family).then(() => {
                setVisibleFonts(prev => new Set(prev).add(family));
              });
            }
          }
        });
      },
      { root: listRef.current, rootMargin: '100px' }
    );

    const items = listRef.current.querySelectorAll('[data-font-family]');
    items.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [open, tab, search]);

  const filteredFonts = useMemo(() => {
    let fonts = FONT_LIBRARY;
    if (tab !== 'all' && tab !== 'recent' && tab !== 'favorites' && tab !== 'pairings') {
      fonts = fonts.filter(f => f.category === tab);
    }
    if (search) {
      const q = search.toLowerCase();
      fonts = fonts.filter(f => f.family.toLowerCase().includes(q));
    }
    return fonts;
  }, [tab, search]);

  const handleSelect = useCallback((family: string) => {
    loadFont(family);
    addRecentFont(family);
    setRecentFonts(getRecentFonts());
    onChange(family);
    setOpen(false);
    setSearch('');
  }, [onChange]);

  const handleToggleFav = useCallback((family: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoriteFont(family);
    setFavFonts(getFavoriteFonts());
  }, []);

  const handlePairingSelect = useCallback((titleFont: string, bodyFont: string) => {
    loadFont(titleFont);
    loadFont(bodyFont);
    addRecentFont(titleFont);
    onChange(titleFont);
    setOpen(false);
  }, [onChange]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const tabs: { key: Tab; label: string; icon?: React.ReactNode }[] = [
    { key: 'all', label: 'All' },
    ...FONT_CATEGORIES.map(c => ({ key: c.key as Tab, label: c.label })),
    { key: 'recent', label: 'Recent', icon: <Clock className="h-3 w-3" /> },
    { key: 'favorites', label: 'Starred', icon: <Star className="h-3 w-3" /> },
    { key: 'pairings', label: 'Pairings', icon: <Sparkles className="h-3 w-3" /> },
  ];

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 transition-colors hover:border-foreground/20',
          compact && 'py-1.5 px-2'
        )}
      >
        <span
          className="text-sm text-foreground truncate"
          style={{ fontFamily: `'${value}', sans-serif` }}
        >
          {value}
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-xl overflow-hidden" style={{ width: compact ? '280px' : '100%' }}>
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search fonts..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-0.5 px-2 py-1.5 border-b border-border overflow-x-auto scrollbar-none">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] tracking-wider uppercase font-medium transition-colors',
                  tab === t.key ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Font list */}
          <div ref={listRef} className="max-h-[300px] overflow-y-auto">
            {tab === 'pairings' ? (
              <div className="p-2 space-y-1.5">
                {FONT_PAIRINGS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => handlePairingSelect(p.title.family, p.body.family)}
                    className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <p className="text-[9px] tracking-wider uppercase text-muted-foreground/60 mb-1">{p.label}</p>
                    <p
                      className="text-foreground text-base truncate"
                      style={{ fontFamily: `'${p.title.family}', serif` }}
                      data-font-family={p.title.family}
                    >
                      {p.title.family}
                    </p>
                    <p
                      className="text-muted-foreground text-xs mt-0.5"
                      style={{ fontFamily: `'${p.body.family}', sans-serif` }}
                      data-font-family={p.body.family}
                    >
                      {p.body.family}
                    </p>
                  </button>
                ))}
              </div>
            ) : tab === 'recent' ? (
              <FontList
                fonts={FONT_LIBRARY.filter(f => recentFonts.includes(f.family)).sort((a, b) => recentFonts.indexOf(a.family) - recentFonts.indexOf(b.family))}
                selected={value}
                favorites={favFonts}
                onSelect={handleSelect}
                onToggleFav={handleToggleFav}
                emptyMessage="No recently used fonts"
              />
            ) : tab === 'favorites' ? (
              <FontList
                fonts={FONT_LIBRARY.filter(f => favFonts.includes(f.family))}
                selected={value}
                favorites={favFonts}
                onSelect={handleSelect}
                onToggleFav={handleToggleFav}
                emptyMessage="No starred fonts yet"
              />
            ) : (
              <FontList
                fonts={filteredFonts}
                selected={value}
                favorites={favFonts}
                onSelect={handleSelect}
                onToggleFav={handleToggleFav}
                emptyMessage="No fonts match your search"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Font List ───────────────────────────────────

function FontList({
  fonts, selected, favorites, onSelect, onToggleFav, emptyMessage,
}: {
  fonts: FontDef[];
  selected: string;
  favorites: string[];
  onSelect: (f: string) => void;
  onToggleFav: (f: string, e: React.MouseEvent) => void;
  emptyMessage: string;
}) {
  if (fonts.length === 0) {
    return (
      <p className="text-center text-muted-foreground/50 text-xs py-8">{emptyMessage}</p>
    );
  }

  return (
    <div className="p-1">
      {fonts.map(font => (
        <button
          key={font.family}
          data-font-family={font.family}
          onClick={() => onSelect(font.family)}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors group',
            selected === font.family
              ? 'bg-foreground/10'
              : 'hover:bg-muted/50'
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="text-foreground text-[15px] truncate"
              style={{ fontFamily: `'${font.family}', sans-serif` }}
            >
              {font.family}
            </span>
            <span className="text-[8px] tracking-wider uppercase text-muted-foreground/40 shrink-0">
              {font.category}
            </span>
          </div>
          <button
            onClick={(e) => onToggleFav(font.family, e)}
            className={cn(
              'shrink-0 h-6 w-6 rounded-full flex items-center justify-center transition-all',
              favorites.includes(font.family)
                ? 'text-yellow-400'
                : 'text-muted-foreground/30 opacity-0 group-hover:opacity-100'
            )}
          >
            <Star className="h-3 w-3" fill={favorites.includes(font.family) ? 'currentColor' : 'none'} />
          </button>
        </button>
      ))}
    </div>
  );
}
