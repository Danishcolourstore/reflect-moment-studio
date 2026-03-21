// TODO: Replace useState with Supabase table queries
// TODO: Add image upload to Cloudflare R2
// TODO: Add real-time sync

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, X, Check, GripVertical, ArrowUp, ArrowDown, Circle } from 'lucide-react';

/* ── Types ── */
interface Photographer {
  id: string; name: string; location: string; bio: string; photoUrl: string; website: string; status: 'active' | 'draft';
}
interface Story {
  id: string; couple: string; location: string; date: string; snippet: string; coverUrl: string; status: 'active' | 'draft';
}
interface ManualNews {
  id: string; title: string; source: string; url: string; date: string; thumbnailUrl: string;
}
interface Tutorial {
  id: string; title: string; author: string; description: string; duration: string; tag: string; url: string; status: 'active' | 'draft';
}
interface DiscoverProfile {
  id: string; name: string; location: string; avatarUrl: string; profileLink: string;
}
interface GallerySettings {
  name: string; tagline: string; heroText: string; showEducation: boolean; showNews: boolean; showDiscover: boolean;
  rssFeeds: string[];
}

const uid = () => Math.random().toString(36).slice(2, 10);

/* ── Seed Data ── */
const SEED_PHOTOGRAPHERS: Photographer[] = [
  { id: uid(), name: 'Naman Verma', location: 'Delhi', bio: 'Fine art and editorial wedding photographer capturing love across India.', photoUrl: '', website: 'https://namanverma.com', status: 'active' },
  { id: uid(), name: 'Joseph Radhik', location: 'Hyderabad', bio: 'Storyteller of emotions, creating timeless wedding narratives.', photoUrl: '', website: '', status: 'active' },
  { id: uid(), name: 'Recall Pictures', location: 'Mumbai', bio: 'Cinematic wedding films and photography for the modern couple.', photoUrl: '', website: '', status: 'active' },
];
const SEED_STORIES: Story[] = [
  { id: uid(), couple: 'Meera & Arjun', location: 'Udaipur', date: '2025-12-14', snippet: 'A royal celebration at City Palace that blended centuries of tradition with modern elegance.', coverUrl: '', status: 'active' },
  { id: uid(), couple: 'Priya & Karthik', location: 'Kerala', date: '2026-01-20', snippet: 'A houseboat ceremony on the backwaters that felt like a dream.', coverUrl: '', status: 'active' },
  { id: uid(), couple: 'Zara & Imran', location: 'Lucknow', date: '2025-11-08', snippet: 'A Nawabi nikah that honored centuries of tradition.', coverUrl: '', status: 'active' },
  { id: uid(), couple: 'Simran & Raj', location: 'Amritsar', date: '2026-02-15', snippet: 'An Anand Karaj at the Golden Temple, bathed in golden light.', coverUrl: '', status: 'active' },
];
const SEED_NEWS: ManualNews[] = [
  { id: uid(), title: 'New Sony A1 II — Full Frame Gets Major Update', source: 'PETAPIXEL', url: '#', date: '2026-03-18', thumbnailUrl: '' },
  { id: uid(), title: 'The Rise of Film Photography at Indian Weddings', source: 'FSTOPPERS', url: '#', date: '2026-03-12', thumbnailUrl: '' },
  { id: uid(), title: 'Best Lenses for Wedding Photography in 2026', source: 'DIY PHOTOGRAPHY', url: '#', date: '2026-02-28', thumbnailUrl: '' },
];
const SEED_TUTORIALS: Tutorial[] = [
  { id: uid(), title: 'Mastering Natural Light in Indian Wedding Venues', author: 'Naman Verma', description: 'Dark mandaps, mixed lighting, and 500 guests.', duration: '12 min read', tag: 'Free Tutorial', url: '#', status: 'active' },
  { id: uid(), title: 'Business of Wedding Photography in India', author: 'Joseph Radhik', description: 'Pricing, packages, and scaling your studio.', duration: '20 min read', tag: 'Premium', url: '#', status: 'active' },
  { id: uid(), title: 'Editing Indian Skin Tones in Lightroom', author: 'Colour Store', description: 'Warm tones, golden hour, indoor ceremony presets.', duration: '8 min read', tag: 'Free Tutorial', url: '#', status: 'active' },
];
const SEED_DISCOVER: DiscoverProfile[] = [
  { id: uid(), name: 'Naman Verma', location: 'Delhi', avatarUrl: '', profileLink: '' },
  { id: uid(), name: 'Joseph Radhik', location: 'Hyderabad', avatarUrl: '', profileLink: '' },
  { id: uid(), name: 'Recall Pictures', location: 'Mumbai', avatarUrl: '', profileLink: '' },
  { id: uid(), name: 'The Wedding Filmer', location: 'Mumbai', avatarUrl: '', profileLink: '' },
  { id: uid(), name: 'Plush Affairs', location: 'Delhi', avatarUrl: '', profileLink: '' },
  { id: uid(), name: 'Beginnings For You', location: 'Kochi', avatarUrl: '', profileLink: '' },
  { id: uid(), name: 'Infinite Memories', location: 'Pune', avatarUrl: '', profileLink: '' },
  { id: uid(), name: 'Shades Photography', location: 'Bangalore', avatarUrl: '', profileLink: '' },
];

const TABS = ['FEATURED', 'STORIES', 'NEWS', 'EDUCATION', 'DISCOVER', 'SETTINGS'] as const;
type Tab = typeof TABS[number];
const TAG_OPTIONS = ['Free Tutorial', 'Premium', 'Workshop', 'Webinar'];

/* ── Shared styles ── */
const s = {
  label: { fontSize: 11, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' as const, color: 'rgba(240,237,232,0.4)', marginBottom: 6 },
  input: { background: '#1A1A1A', border: '1px solid rgba(240,237,232,0.08)', color: '#F0EDE8', borderRadius: 4, padding: '8px 12px', fontSize: 13, width: '100%', outline: 'none' },
  textarea: { background: '#1A1A1A', border: '1px solid rgba(240,237,232,0.08)', color: '#F0EDE8', borderRadius: 4, padding: '8px 12px', fontSize: 13, width: '100%', outline: 'none', minHeight: 80, resize: 'vertical' as const },
  goldBtn: { background: 'transparent', border: '1px solid #E8C97A', color: '#E8C97A', borderRadius: 4, padding: '8px 16px', fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 },
  saveBtn: { background: '#E8C97A', color: '#080808', border: 'none', borderRadius: 4, padding: '8px 20px', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  cancelBtn: { background: 'transparent', border: '1px solid rgba(240,237,232,0.1)', color: 'rgba(240,237,232,0.4)', borderRadius: 4, padding: '8px 16px', fontSize: 12, cursor: 'pointer' },
  td: { padding: '10px 12px', borderBottom: '1px solid rgba(240,237,232,0.06)', fontSize: 13, color: '#F0EDE8', verticalAlign: 'top' as const },
  th: { padding: '8px 12px', borderBottom: '1px solid rgba(240,237,232,0.1)', fontSize: 10, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, color: 'rgba(240,237,232,0.3)', textAlign: 'left' as const },
  badge: (active: boolean) => ({ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: active ? 'rgba(76,175,80,0.15)' : 'rgba(240,237,232,0.06)', color: active ? '#4CAF50' : 'rgba(240,237,232,0.3)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' as const }),
  card: { background: '#0E0E0E', border: '1px solid rgba(240,237,232,0.06)', borderRadius: 4, padding: 20, marginBottom: 16 },
  circle: { width: 36, height: 36, borderRadius: '50%', background: 'rgba(240,237,232,0.06)', flexShrink: 0 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(240,237,232,0.3)' },
};

/* ── Inline Form Field ── */
function Field({ label, value, onChange, type = 'text', placeholder = '' }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={s.label}>{label}</div>
      {type === 'textarea' ? (
        <textarea style={s.textarea as any} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <input style={s.input} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════ */
export default function SuperAdminArtGallery() {
  const [tab, setTab] = useState<Tab>('FEATURED');

  // ── Featured ──
  const [photographers, setPhotographers] = useState<Photographer[]>(SEED_PHOTOGRAPHERS);
  const [editingP, setEditingP] = useState<Photographer | null>(null);
  const [addingP, setAddingP] = useState(false);
  const blankP = (): Photographer => ({ id: uid(), name: '', location: '', bio: '', photoUrl: '', website: '', status: 'active' });

  // ── Stories ──
  const [stories, setStories] = useState<Story[]>(SEED_STORIES);
  const [editingS, setEditingS] = useState<Story | null>(null);
  const [addingS, setAddingS] = useState(false);
  const blankS = (): Story => ({ id: uid(), couple: '', location: '', date: '', snippet: '', coverUrl: '', status: 'active' });

  // ── News ──
  const [manualNews, setManualNews] = useState<ManualNews[]>(SEED_NEWS);
  const [editingN, setEditingN] = useState<ManualNews | null>(null);
  const [addingN, setAddingN] = useState(false);
  const [showRss, setShowRss] = useState(true);
  const [showManual, setShowManual] = useState(true);
  const blankN = (): ManualNews => ({ id: uid(), title: '', source: '', url: '', date: '', thumbnailUrl: '' });

  // ── Education ──
  const [tutorials, setTutorials] = useState<Tutorial[]>(SEED_TUTORIALS);
  const [editingT, setEditingT] = useState<Tutorial | null>(null);
  const [addingT, setAddingT] = useState(false);
  const blankT = (): Tutorial => ({ id: uid(), title: '', author: '', description: '', duration: '', tag: 'Free Tutorial', url: '', status: 'active' });

  // ── Discover ──
  const [profiles, setProfiles] = useState<DiscoverProfile[]>(SEED_DISCOVER);
  const [editingD, setEditingD] = useState<DiscoverProfile | null>(null);
  const [addingD, setAddingD] = useState(false);
  const blankD = (): DiscoverProfile => ({ id: uid(), name: '', location: '', avatarUrl: '', profileLink: '' });

  // ── Settings ──
  const [settings, setSettings] = useState<GallerySettings>({
    name: 'Art Gallery', tagline: 'Shoot. Share. Inspire.',
    heroText: 'India Celebrates Love Like No Other Nation On Earth',
    showEducation: true, showNews: true, showDiscover: true,
    rssFeeds: ['https://petapixel.com/feed/', 'https://fstoppers.com/feed', 'https://www.diyphotography.net/feed/'],
  });

  /* ── Generic CRUD helpers ── */
  function saveItem<T extends { id: string }>(list: T[], item: T, setList: (l: T[]) => void) {
    const idx = list.findIndex(x => x.id === item.id);
    if (idx >= 0) { const c = [...list]; c[idx] = item; setList(c); }
    else setList([...list, item]);
  }
  function deleteItem<T extends { id: string }>(list: T[], id: string, setList: (l: T[]) => void) {
    setList(list.filter(x => x.id !== id));
  }
  function moveItem<T>(list: T[], idx: number, dir: -1 | 1, setList: (l: T[]) => void) {
    const ni = idx + dir;
    if (ni < 0 || ni >= list.length) return;
    const c = [...list]; [c[idx], c[ni]] = [c[ni], c[idx]]; setList(c);
  }

  /* ── Inline form renderer ── */
  function renderForm<T extends Record<string, any>>(item: T, setItem: (i: T) => void, fields: { key: keyof T; label: string; type?: string; options?: string[] }[], onSave: () => void, onCancel: () => void) {
    return (
      <div style={s.card}>
        {fields.map(f => (
          f.options ? (
            <div key={String(f.key)} style={{ marginBottom: 12 }}>
              <div style={s.label}>{f.label}</div>
              <select style={{ ...s.input, cursor: 'pointer' }} value={String(item[f.key])} onChange={e => setItem({ ...item, [f.key]: e.target.value })}>
                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ) : (
            <Field key={String(f.key)} label={f.label} value={String(item[f.key] ?? '')} onChange={v => setItem({ ...item, [f.key]: v })} type={f.type || 'text'} />
          )
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button style={s.saveBtn} onClick={onSave}>Save</button>
          <button style={s.cancelBtn} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 22, fontWeight: 600, color: '#F0EDE8', margin: 0 }}>Art Gallery Editor</h1>
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: 'rgba(240,237,232,0.4)', margin: '4px 0 0' }}>Manage all community content</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', borderBottom: '1px solid rgba(240,237,232,0.06)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            fontFamily: '"DM Sans", sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase',
            padding: '10px 16px', cursor: 'pointer', border: 'none', borderBottom: tab === t ? '2px solid #E8C97A' : '2px solid transparent',
            background: 'transparent', color: tab === t ? '#E8C97A' : 'rgba(240,237,232,0.3)', transition: 'color 0.2s', whiteSpace: 'nowrap',
          }}>{t}</button>
        ))}
      </div>

      {/* ═══ TAB: FEATURED ═══ */}
      {tab === 'FEATURED' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#F0EDE8' }}>{photographers.length} Photographers</span>
            <button style={s.goldBtn} onClick={() => { setAddingP(true); setEditingP(blankP()); }}>
              <Plus size={14} /> Add Photographer
            </button>
          </div>
          {addingP && editingP && renderForm(editingP, setEditingP,
            [{ key: 'name', label: 'Name' }, { key: 'location', label: 'Location' }, { key: 'bio', label: 'Bio', type: 'textarea' }, { key: 'photoUrl', label: 'Photo URL' }, { key: 'website', label: 'Website' }],
            () => { saveItem(photographers, editingP, setPhotographers); setAddingP(false); setEditingP(null); },
            () => { setAddingP(false); setEditingP(null); },
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={s.th}>Photo</th><th style={s.th}>Name</th><th style={s.th}>Location</th><th style={s.th}>Bio</th><th style={s.th}>Status</th><th style={s.th}>Actions</th>
            </tr></thead>
            <tbody>
              {photographers.map(p => (
                <tr key={p.id}>
                  <td style={s.td}><div style={s.circle} /></td>
                  <td style={{ ...s.td, fontWeight: 500 }}>{p.name}</td>
                  <td style={s.td}>{p.location}</td>
                  <td style={{ ...s.td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(240,237,232,0.5)' }}>{p.bio}</td>
                  <td style={s.td}><span style={s.badge(p.status === 'active')}>{p.status}</span></td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button style={s.iconBtn} onClick={() => { setEditingP({ ...p }); setAddingP(true); }}><Pencil size={14} /></button>
                      <button style={s.iconBtn} onClick={() => deleteItem(photographers, p.id, setPhotographers)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ TAB: STORIES ═══ */}
      {tab === 'STORIES' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#F0EDE8' }}>{stories.length} Stories</span>
            <button style={s.goldBtn} onClick={() => { setAddingS(true); setEditingS(blankS()); }}>
              <Plus size={14} /> Add Story
            </button>
          </div>
          {addingS && editingS && renderForm(editingS, setEditingS,
            [{ key: 'couple', label: 'Couple Name' }, { key: 'location', label: 'Location' }, { key: 'date', label: 'Date', type: 'date' }, { key: 'snippet', label: 'Snippet', type: 'textarea' }, { key: 'coverUrl', label: 'Cover Image URL' }],
            () => { saveItem(stories, editingS, setStories); setAddingS(false); setEditingS(null); },
            () => { setAddingS(false); setEditingS(null); },
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={s.th}>Couple</th><th style={s.th}>Location</th><th style={s.th}>Date</th><th style={s.th}>Snippet</th><th style={s.th}>Status</th><th style={s.th}>Actions</th>
            </tr></thead>
            <tbody>
              {stories.map(st => (
                <tr key={st.id}>
                  <td style={{ ...s.td, fontWeight: 500 }}>{st.couple}</td>
                  <td style={s.td}>{st.location}</td>
                  <td style={s.td}>{st.date}</td>
                  <td style={{ ...s.td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(240,237,232,0.5)' }}>{st.snippet}</td>
                  <td style={s.td}><span style={s.badge(st.status === 'active')}>{st.status}</span></td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button style={s.iconBtn} onClick={() => { setEditingS({ ...st }); setAddingS(true); }}><Pencil size={14} /></button>
                      <button style={s.iconBtn} onClick={() => deleteItem(stories, st.id, setStories)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ TAB: NEWS ═══ */}
      {tab === 'NEWS' && (
        <div>
          {/* RSS Status */}
          <div style={{ ...s.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4CAF50' }} />
              <span style={{ fontSize: 13, color: '#F0EDE8' }}>Auto-fetching from PetaPixel, Fstoppers, DIY Photography</span>
              <span style={{ ...s.badge(true), marginLeft: 8 }}>LIVE</span>
            </div>
          </div>
          {/* Toggles */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(240,237,232,0.5)', cursor: 'pointer' }}>
              <input type="checkbox" checked={showRss} onChange={e => setShowRss(e.target.checked)} style={{ accentColor: '#E8C97A' }} />
              Show RSS Feed
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(240,237,232,0.5)', cursor: 'pointer' }}>
              <input type="checkbox" checked={showManual} onChange={e => setShowManual(e.target.checked)} style={{ accentColor: '#E8C97A' }} />
              Show Manual Entries
            </label>
          </div>
          {/* Manual entries */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#F0EDE8' }}>Manual News ({manualNews.length})</span>
            <button style={s.goldBtn} onClick={() => { setAddingN(true); setEditingN(blankN()); }}>
              <Plus size={14} /> Add Article
            </button>
          </div>
          {addingN && editingN && renderForm(editingN, setEditingN,
            [{ key: 'title', label: 'Title' }, { key: 'source', label: 'Source' }, { key: 'url', label: 'URL' }, { key: 'date', label: 'Date', type: 'date' }, { key: 'thumbnailUrl', label: 'Thumbnail URL' }],
            () => { saveItem(manualNews, editingN, setManualNews); setAddingN(false); setEditingN(null); },
            () => { setAddingN(false); setEditingN(null); },
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={s.th}>Title</th><th style={s.th}>Source</th><th style={s.th}>Date</th><th style={s.th}>Actions</th>
            </tr></thead>
            <tbody>
              {manualNews.map(n => (
                <tr key={n.id}>
                  <td style={{ ...s.td, fontWeight: 500 }}>{n.title}</td>
                  <td style={s.td}><span style={{ ...s.badge(true), background: 'rgba(232,201,122,0.12)', color: '#E8C97A' }}>{n.source}</span></td>
                  <td style={s.td}>{n.date}</td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button style={s.iconBtn} onClick={() => { setEditingN({ ...n }); setAddingN(true); }}><Pencil size={14} /></button>
                      <button style={s.iconBtn} onClick={() => deleteItem(manualNews, n.id, setManualNews)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ TAB: EDUCATION ═══ */}
      {tab === 'EDUCATION' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#F0EDE8' }}>{tutorials.length} Tutorials</span>
            <button style={s.goldBtn} onClick={() => { setAddingT(true); setEditingT(blankT()); }}>
              <Plus size={14} /> Add Tutorial
            </button>
          </div>
          {addingT && editingT && renderForm(editingT, setEditingT,
            [{ key: 'title', label: 'Title' }, { key: 'author', label: 'Author' }, { key: 'description', label: 'Description', type: 'textarea' }, { key: 'duration', label: 'Duration' }, { key: 'tag', label: 'Tag', options: TAG_OPTIONS }, { key: 'url', label: 'URL' }],
            () => { saveItem(tutorials, editingT, setTutorials); setAddingT(false); setEditingT(null); },
            () => { setAddingT(false); setEditingT(null); },
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={s.th}>Title</th><th style={s.th}>Author</th><th style={s.th}>Duration</th><th style={s.th}>Tag</th><th style={s.th}>Status</th><th style={s.th}>Actions</th>
            </tr></thead>
            <tbody>
              {tutorials.map(t => (
                <tr key={t.id}>
                  <td style={{ ...s.td, fontWeight: 500 }}>{t.title}</td>
                  <td style={s.td}>{t.author}</td>
                  <td style={s.td}>{t.duration}</td>
                  <td style={s.td}><span style={{ ...s.badge(true), background: t.tag === 'Premium' ? 'rgba(232,201,122,0.12)' : 'rgba(76,175,80,0.15)', color: t.tag === 'Premium' ? '#E8C97A' : '#4CAF50' }}>{t.tag}</span></td>
                  <td style={s.td}><span style={s.badge(t.status === 'active')}>{t.status}</span></td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button style={s.iconBtn} onClick={() => { setEditingT({ ...t }); setAddingT(true); }}><Pencil size={14} /></button>
                      <button style={s.iconBtn} onClick={() => deleteItem(tutorials, t.id, setTutorials)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ TAB: DISCOVER ═══ */}
      {tab === 'DISCOVER' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#F0EDE8' }}>{profiles.length} Profiles</span>
            <button style={s.goldBtn} onClick={() => { setAddingD(true); setEditingD(blankD()); }}>
              <Plus size={14} /> Add Profile
            </button>
          </div>
          {addingD && editingD && renderForm(editingD, setEditingD,
            [{ key: 'name', label: 'Name' }, { key: 'location', label: 'Location' }, { key: 'avatarUrl', label: 'Avatar URL' }, { key: 'profileLink', label: 'Profile Link' }],
            () => { saveItem(profiles, editingD, setProfiles); setAddingD(false); setEditingD(null); },
            () => { setAddingD(false); setEditingD(null); },
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 16 }}>
            {profiles.map((p, i) => (
              <div key={p.id} style={{ ...s.card, textAlign: 'center', padding: 16, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 8 }}>
                  <button style={s.iconBtn} onClick={() => moveItem(profiles, i, -1, setProfiles)}><ArrowUp size={12} /></button>
                  <button style={s.iconBtn} onClick={() => moveItem(profiles, i, 1, setProfiles)}><ArrowDown size={12} /></button>
                </div>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(240,237,232,0.06)', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 12, fontWeight: 500, color: '#F0EDE8' }}>{p.name}</div>
                <div style={{ fontSize: 10, color: 'rgba(240,237,232,0.3)' }}>{p.location}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 8 }}>
                  <button style={s.iconBtn} onClick={() => { setEditingD({ ...p }); setAddingD(true); }}><Pencil size={12} /></button>
                  <button style={s.iconBtn} onClick={() => deleteItem(profiles, p.id, setProfiles)}><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TAB: SETTINGS ═══ */}
      {tab === 'SETTINGS' && (
        <div style={{ maxWidth: 600 }}>
          <Field label="Art Gallery Name" value={settings.name} onChange={v => setSettings({ ...settings, name: v })} />
          <Field label="Tagline" value={settings.tagline} onChange={v => setSettings({ ...settings, tagline: v })} />
          <Field label="Hero Text" value={settings.heroText} onChange={v => setSettings({ ...settings, heroText: v })} type="textarea" />

          <div style={{ marginTop: 24, marginBottom: 24 }}>
            <div style={{ ...s.label, marginBottom: 16 }}>Section Visibility</div>
            {([['showEducation', 'Show Education Bar'], ['showNews', 'Show News Section'], ['showDiscover', 'Show Discover Section']] as const).map(([key, label]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontSize: 13, color: '#F0EDE8', cursor: 'pointer' }}>
                <input type="checkbox" checked={settings[key]} onChange={e => setSettings({ ...settings, [key]: e.target.checked })} style={{ accentColor: '#E8C97A' }} />
                {label}
              </label>
            ))}
          </div>

          <div style={{ ...s.label, marginBottom: 12 }}>RSS Feed URLs</div>
          {settings.rssFeeds.map((url, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <input style={s.input} value={url} onChange={e => { const c = [...settings.rssFeeds]; c[i] = e.target.value; setSettings({ ...settings, rssFeeds: c }); }} placeholder={`Feed URL ${i + 1}`} />
            </div>
          ))}

          <button style={{ ...s.saveBtn, marginTop: 20 }} onClick={() => alert('Settings saved (local state only)')}>
            Save Settings
          </button>
        </div>
      )}
    </div>
  );
}
