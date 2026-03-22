import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, MessageSquare, X, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const dm = '"DM Sans", sans-serif';

/* ── Types ── */
interface Photographer { id: string; name: string; location: string; bio: string; photo_url: string; website: string; status: string; sort_order: number; }
interface Story { id: string; couple: string; location: string; story_date: string; snippet: string; cover_url: string; status: string; sort_order: number; }
interface ManualNews { id: string; title: string; source: string; url: string; news_date: string; thumbnail_url: string; sort_order: number; }
interface Tutorial { id: string; title: string; author: string; description: string; duration: string; tag: string; url: string; status: string; sort_order: number; }
interface DiscoverProfile { id: string; name: string; location: string; avatar_url: string; profile_link: string; sort_order: number; }
interface GallerySettings { name: string; tagline: string; heroText: string; showEducation: boolean; showNews: boolean; showDiscover: boolean; showRss: boolean; showManual: boolean; rssFeeds: string[]; }
interface ChatMsg { role: 'user' | 'assistant'; content: string; }

const TABS = ['FEATURED', 'STORIES', 'NEWS', 'EDUCATION', 'DISCOVER', 'SETTINGS'] as const;
type Tab = typeof TABS[number];
const TAG_OPTIONS = ['Free Tutorial', 'Premium', 'Workshop', 'Webinar'];

/* ── Styles ── */
const s = {
  label: { fontSize: 11, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' as const, color: 'rgba(240,237,232,0.4)', marginBottom: 6, fontFamily: dm },
  input: { background: '#1A1A1A', border: '1px solid rgba(240,237,232,0.08)', color: '#F0EDE8', borderRadius: 4, padding: '8px 12px', fontSize: 13, width: '100%', outline: 'none', fontFamily: dm },
  textarea: { background: '#1A1A1A', border: '1px solid rgba(240,237,232,0.08)', color: '#F0EDE8', borderRadius: 4, padding: '8px 12px', fontSize: 13, width: '100%', outline: 'none', minHeight: 80, resize: 'vertical' as const, fontFamily: dm },
  goldBtn: { background: 'transparent', border: '1px solid #E8C97A', color: '#E8C97A', borderRadius: 4, padding: '8px 16px', fontSize: 12, cursor: 'pointer', display: 'inline-flex' as const, alignItems: 'center' as const, gap: 6, fontFamily: dm },
  saveBtn: { background: '#E8C97A', color: '#080808', border: 'none', borderRadius: 4, padding: '8px 20px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: dm },
  cancelBtn: { background: 'transparent', border: '1px solid rgba(240,237,232,0.1)', color: 'rgba(240,237,232,0.4)', borderRadius: 4, padding: '8px 16px', fontSize: 12, cursor: 'pointer', fontFamily: dm },
  td: { padding: '10px 12px', borderBottom: '1px solid rgba(240,237,232,0.06)', fontSize: 13, color: '#F0EDE8', verticalAlign: 'top' as const, fontFamily: dm },
  th: { padding: '8px 12px', borderBottom: '1px solid rgba(240,237,232,0.1)', fontSize: 10, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, color: 'rgba(240,237,232,0.3)', textAlign: 'left' as const, fontFamily: dm },
  badge: (active: boolean) => ({ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: active ? 'rgba(76,175,80,0.15)' : 'rgba(240,237,232,0.06)', color: active ? '#4CAF50' : 'rgba(240,237,232,0.3)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' as const }),
  card: { background: '#0E0E0E', border: '1px solid rgba(240,237,232,0.06)', borderRadius: 4, padding: 20, marginBottom: 16 },
  circle: { width: 36, height: 36, borderRadius: '50%', background: 'rgba(240,237,232,0.06)', flexShrink: 0 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(240,237,232,0.3)' },
};

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
  const [chatOpen, setChatOpen] = useState(false);

  // ── Data from DB ──
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [manualNews, setManualNews] = useState<ManualNews[]>([]);
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [settings, setSettings] = useState<GallerySettings>({
    name: 'Art Gallery', tagline: 'Shoot. Share. Inspire.',
    heroText: 'India Celebrates Love Like No Other Nation On Earth',
    showEducation: true, showNews: true, showDiscover: true, showRss: true, showManual: true,
    rssFeeds: ['https://petapixel.com/feed/', 'https://fstoppers.com/feed', 'https://www.diyphotography.net/feed/'],
  });

  // ── Editing state ──
  const [editingP, setEditingP] = useState<any>(null);
  const [addingP, setAddingP] = useState(false);
  const [editingS, setEditingS] = useState<any>(null);
  const [addingS, setAddingS] = useState(false);
  const [editingN, setEditingN] = useState<any>(null);
  const [addingN, setAddingN] = useState(false);
  const [editingT, setEditingT] = useState<any>(null);
  const [addingT, setAddingT] = useState(false);
  const [editingD, setEditingD] = useState<any>(null);
  const [addingD, setAddingD] = useState(false);

  // ── Chat state ──
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Load data from Supabase ──
  const loadAll = async () => {
    const [p, st, n, t, d, cfg] = await Promise.all([
      (supabase.from('ag_featured_photographers').select('*').order('sort_order') as any),
      (supabase.from('ag_stories').select('*').order('sort_order') as any),
      (supabase.from('ag_manual_news').select('*').order('sort_order') as any),
      (supabase.from('ag_education').select('*').order('sort_order') as any),
      (supabase.from('ag_discover_profiles').select('*').order('sort_order') as any),
      (supabase.from('ag_settings').select('setting_value').eq('setting_key', 'gallery_config').maybeSingle() as any),
    ]);
    if (p.data) setPhotographers(p.data);
    if (st.data) setStories(st.data);
    if (n.data) setManualNews(n.data);
    if (t.data) setTutorials(t.data);
    if (d.data) setProfiles(d.data);
    if (cfg.data?.setting_value) setSettings(cfg.data.setting_value);
  };

  useEffect(() => { loadAll(); }, []);

  // ── DB CRUD helpers ──
  const savePhotographer = async (item: any) => {
    if (photographers.find(x => x.id === item.id)) {
      await (supabase.from('ag_featured_photographers').update({ name: item.name, location: item.location, bio: item.bio, photo_url: item.photo_url || item.photoUrl || '', website: item.website, status: item.status }).eq('id', item.id) as any);
    } else {
      await (supabase.from('ag_featured_photographers').insert({ name: item.name, location: item.location || '', bio: item.bio || '', photo_url: item.photo_url || item.photoUrl || '', website: item.website || '', status: item.status || 'active', sort_order: photographers.length }) as any);
    }
    loadAll();
  };
  const deletePhotographer = async (id: string) => { await (supabase.from('ag_featured_photographers').delete().eq('id', id) as any); loadAll(); };

  const saveStory = async (item: any) => {
    if (stories.find(x => x.id === item.id)) {
      await (supabase.from('ag_stories').update({ couple: item.couple, location: item.location, story_date: item.story_date || item.date || '', snippet: item.snippet, cover_url: item.cover_url || item.coverUrl || '', status: item.status }).eq('id', item.id) as any);
    } else {
      await (supabase.from('ag_stories').insert({ couple: item.couple, location: item.location || '', story_date: item.story_date || item.date || '', snippet: item.snippet || '', cover_url: item.cover_url || item.coverUrl || '', status: item.status || 'active', sort_order: stories.length }) as any);
    }
    loadAll();
  };
  const deleteStory = async (id: string) => { await (supabase.from('ag_stories').delete().eq('id', id) as any); loadAll(); };

  const saveNews = async (item: any) => {
    if (manualNews.find(x => x.id === item.id)) {
      await (supabase.from('ag_manual_news').update({ title: item.title, source: item.source, url: item.url, news_date: item.news_date || item.date || '', thumbnail_url: item.thumbnail_url || item.thumbnailUrl || '' }).eq('id', item.id) as any);
    } else {
      await (supabase.from('ag_manual_news').insert({ title: item.title, source: item.source || '', url: item.url || '', news_date: item.news_date || item.date || '', thumbnail_url: item.thumbnail_url || item.thumbnailUrl || '', sort_order: manualNews.length }) as any);
    }
    loadAll();
  };
  const deleteNews = async (id: string) => { await (supabase.from('ag_manual_news').delete().eq('id', id) as any); loadAll(); };

  const saveTutorial = async (item: any) => {
    if (tutorials.find(x => x.id === item.id)) {
      await (supabase.from('ag_education').update({ title: item.title, author: item.author, description: item.description, duration: item.duration, tag: item.tag, url: item.url, status: item.status }).eq('id', item.id) as any);
    } else {
      await (supabase.from('ag_education').insert({ title: item.title, author: item.author || '', description: item.description || '', duration: item.duration || '', tag: item.tag || 'Free Tutorial', url: item.url || '', status: item.status || 'active', sort_order: tutorials.length }) as any);
    }
    loadAll();
  };
  const deleteTutorial = async (id: string) => { await (supabase.from('ag_education').delete().eq('id', id) as any); loadAll(); };

  const saveProfile = async (item: any) => {
    if (profiles.find(x => x.id === item.id)) {
      await (supabase.from('ag_discover_profiles').update({ name: item.name, location: item.location, avatar_url: item.avatar_url || item.avatarUrl || '', profile_link: item.profile_link || item.profileLink || '' }).eq('id', item.id) as any);
    } else {
      await (supabase.from('ag_discover_profiles').insert({ name: item.name, location: item.location || '', avatar_url: item.avatar_url || item.avatarUrl || '', profile_link: item.profile_link || item.profileLink || '', sort_order: profiles.length }) as any);
    }
    loadAll();
  };
  const deleteProfile = async (id: string) => { await (supabase.from('ag_discover_profiles').delete().eq('id', id) as any); loadAll(); };

  const saveSettings = async () => {
    await (supabase.from('ag_settings').update({ setting_value: settings as any, updated_at: new Date().toISOString() }).eq('setting_key', 'gallery_config') as any);
  };

  const moveItem = async (table: string, list: any[], idx: number, dir: -1 | 1) => {
    const ni = idx + dir;
    if (ni < 0 || ni >= list.length) return;
    const a = list[idx], b = list[ni];
    await Promise.all([
      (supabase.from(table as any).update({ sort_order: ni } as any).eq('id', a.id) as any),
      (supabase.from(table as any).update({ sort_order: idx } as any).eq('id', b.id) as any),
    ]);
    loadAll();
  };

  // ── Chat ──
  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMsg = { role: 'user', content: chatInput.trim() };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput('');
    setChatLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ag-gallery-chat', {
        body: { messages: newMessages.map(m => ({ role: m.role, content: m.content })) },
      });
      if (error) throw error;
      const reply = data?.reply || 'Done.';
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      // Refresh data after AI actions
      loadAll();
    } catch (e: any) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message || 'Something went wrong'}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  /* ── Inline form renderer ── */
  function renderForm(item: any, setItem: (i: any) => void, fields: { key: string; label: string; type?: string; options?: string[] }[], onSave: () => void, onCancel: () => void) {
    return (
      <div style={s.card}>
        {fields.map(f => (
          f.options ? (
            <div key={f.key} style={{ marginBottom: 12 }}>
              <div style={s.label}>{f.label}</div>
              <select style={{ ...s.input, cursor: 'pointer' }} value={String(item[f.key] ?? '')} onChange={e => setItem({ ...item, [f.key]: e.target.value })}>
                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ) : (
            <Field key={f.key} label={f.label} value={String(item[f.key] ?? '')} onChange={v => setItem({ ...item, [f.key]: v })} type={f.type || 'text'} />
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
    <div style={{ position: 'relative' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontFamily: dm, fontSize: 22, fontWeight: 600, color: '#F0EDE8', margin: 0 }}>Art Gallery Editor</h1>
          <p style={{ fontFamily: dm, fontSize: 13, color: 'rgba(240,237,232,0.4)', margin: '4px 0 0' }}>Manage all community content</p>
        </div>
        <button
          onClick={() => setChatOpen(!chatOpen)}
          style={{
            ...s.goldBtn,
            background: chatOpen ? '#E8C97A' : 'transparent',
            color: chatOpen ? '#080808' : '#E8C97A',
          }}
        >
          <MessageSquare size={14} /> AI Assistant
        </button>
      </div>

      {/* AI Chat Panel */}
      {chatOpen && (
        <div style={{
          background: '#0A0A0A', border: '1px solid rgba(240,237,232,0.08)', borderRadius: 8,
          marginBottom: 24, overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(240,237,232,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E8C97A' }} />
              <span style={{ fontFamily: dm, fontSize: 14, fontWeight: 600, color: '#F0EDE8' }}>Art Gallery AI</span>
            </div>
            <button style={s.iconBtn} onClick={() => setChatOpen(false)}><X size={16} /></button>
          </div>

          {/* Messages */}
          <div style={{ height: 320, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {chatMessages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontFamily: dm, fontSize: 13, color: 'rgba(240,237,232,0.3)', lineHeight: 1.7 }}>
                  Ask me to manage Art Gallery content.<br />
                  <span style={{ color: 'rgba(240,237,232,0.15)', fontSize: 11 }}>
                    "Add photographer Amrit Singh from Chandigarh"<br />
                    "List all stories" · "Delete the Kerala story"<br />
                    "Change the hero text to..."
                  </span>
                </div>
              </div>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: 12,
                  background: m.role === 'user' ? '#E8C97A' : '#1A1A1A',
                  color: m.role === 'user' ? '#080808' : '#F0EDE8',
                  fontFamily: dm, fontSize: 13, lineHeight: 1.6,
                }}>
                  {m.role === 'assistant' ? (
                    <div className="prose prose-sm prose-invert" style={{ maxWidth: 'none' }}>
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : m.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '10px 14px', borderRadius: 12, background: '#1A1A1A', color: 'rgba(240,237,232,0.3)', fontFamily: dm, fontSize: 13 }}>
                  Thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(240,237,232,0.06)', display: 'flex', gap: 8 }}>
            <input
              style={{ ...s.input, flex: 1 }}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
              placeholder="Ask AI to manage content..."
              disabled={chatLoading}
            />
            <button
              onClick={sendChat}
              disabled={chatLoading || !chatInput.trim()}
              style={{
                ...s.saveBtn,
                opacity: chatLoading || !chatInput.trim() ? 0.4 : 1,
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', borderBottom: '1px solid rgba(240,237,232,0.06)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            fontFamily: dm, fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase',
            padding: '10px 16px', cursor: 'pointer', border: 'none', borderBottom: tab === t ? '2px solid #E8C97A' : '2px solid transparent',
            background: 'transparent', color: tab === t ? '#E8C97A' : 'rgba(240,237,232,0.3)', transition: 'color 0.2s', whiteSpace: 'nowrap',
          }}>{t}</button>
        ))}
      </div>

      {/* ═══ TAB: FEATURED ═══ */}
      {tab === 'FEATURED' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#F0EDE8', fontFamily: dm }}>{photographers.length} Photographers</span>
            <button style={s.goldBtn} onClick={() => { setAddingP(true); setEditingP({ name: '', location: '', bio: '', photo_url: '', website: '', status: 'active' }); }}>
              <Plus size={14} /> Add Photographer
            </button>
          </div>
          {addingP && editingP && renderForm(editingP, setEditingP,
            [{ key: 'name', label: 'Name' }, { key: 'location', label: 'Location' }, { key: 'bio', label: 'Bio', type: 'textarea' }, { key: 'photo_url', label: 'Photo URL' }, { key: 'website', label: 'Website' }],
            () => { savePhotographer(editingP); setAddingP(false); setEditingP(null); },
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
                      <button style={s.iconBtn} onClick={() => deletePhotographer(p.id)}><Trash2 size={14} /></button>
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
            <span style={{ fontSize: 14, fontWeight: 500, color: '#F0EDE8', fontFamily: dm }}>{stories.length} Stories</span>
            <button style={s.goldBtn} onClick={() => { setAddingS(true); setEditingS({ couple: '', location: '', story_date: '', snippet: '', cover_url: '', status: 'active' }); }}>
              <Plus size={14} /> Add Story
            </button>
          </div>
          {addingS && editingS && renderForm(editingS, setEditingS,
            [{ key: 'couple', label: 'Couple Name' }, { key: 'location', label: 'Location' }, { key: 'story_date', label: 'Date' }, { key: 'snippet', label: 'Snippet', type: 'textarea' }, { key: 'cover_url', label: 'Cover Image URL' }],
            () => { saveStory(editingS); setAddingS(false); setEditingS(null); },
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
                  <td style={s.td}>{st.story_date}</td>
                  <td style={{ ...s.td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(240,237,232,0.5)' }}>{st.snippet}</td>
                  <td style={s.td}><span style={s.badge(st.status === 'active')}>{st.status}</span></td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button style={s.iconBtn} onClick={() => { setEditingS({ ...st }); setAddingS(true); }}><Pencil size={14} /></button>
                      <button style={s.iconBtn} onClick={() => deleteStory(st.id)}><Trash2 size={14} /></button>
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
          <div style={{ ...s.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4CAF50' }} />
              <span style={{ fontSize: 13, color: '#F0EDE8', fontFamily: dm }}>Auto-fetching from PetaPixel, Fstoppers, DIY Photography</span>
              <span style={{ ...s.badge(true), marginLeft: 8 }}>LIVE</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#F0EDE8', fontFamily: dm }}>Manual News ({manualNews.length})</span>
            <button style={s.goldBtn} onClick={() => { setAddingN(true); setEditingN({ title: '', source: '', url: '', news_date: '', thumbnail_url: '' }); }}>
              <Plus size={14} /> Add Article
            </button>
          </div>
          {addingN && editingN && renderForm(editingN, setEditingN,
            [{ key: 'title', label: 'Title' }, { key: 'source', label: 'Source' }, { key: 'url', label: 'URL' }, { key: 'news_date', label: 'Date' }, { key: 'thumbnail_url', label: 'Thumbnail URL' }],
            () => { saveNews(editingN); setAddingN(false); setEditingN(null); },
            () => { setAddingN(false); setEditingN(null); },
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={s.th}>Title</th><th style={s.th}>Source</th><th style={s.th}>Date</th><th style={s.th}>Actions</th></tr></thead>
            <tbody>
              {manualNews.map(n => (
                <tr key={n.id}>
                  <td style={{ ...s.td, fontWeight: 500 }}>{n.title}</td>
                  <td style={s.td}><span style={{ ...s.badge(true), background: 'rgba(232,201,122,0.12)', color: '#E8C97A' }}>{n.source}</span></td>
                  <td style={s.td}>{n.news_date}</td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button style={s.iconBtn} onClick={() => { setEditingN({ ...n }); setAddingN(true); }}><Pencil size={14} /></button>
                      <button style={s.iconBtn} onClick={() => deleteNews(n.id)}><Trash2 size={14} /></button>
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
            <span style={{ fontSize: 14, fontWeight: 500, color: '#F0EDE8', fontFamily: dm }}>{tutorials.length} Tutorials</span>
            <button style={s.goldBtn} onClick={() => { setAddingT(true); setEditingT({ title: '', author: '', description: '', duration: '', tag: 'Free Tutorial', url: '', status: 'active' }); }}>
              <Plus size={14} /> Add Tutorial
            </button>
          </div>
          {addingT && editingT && renderForm(editingT, setEditingT,
            [{ key: 'title', label: 'Title' }, { key: 'author', label: 'Author' }, { key: 'description', label: 'Description', type: 'textarea' }, { key: 'duration', label: 'Duration' }, { key: 'tag', label: 'Tag', options: TAG_OPTIONS }, { key: 'url', label: 'URL' }],
            () => { saveTutorial(editingT); setAddingT(false); setEditingT(null); },
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
                      <button style={s.iconBtn} onClick={() => deleteTutorial(t.id)}><Trash2 size={14} /></button>
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
            <span style={{ fontSize: 14, fontWeight: 500, color: '#F0EDE8', fontFamily: dm }}>{profiles.length} Profiles</span>
            <button style={s.goldBtn} onClick={() => { setAddingD(true); setEditingD({ name: '', location: '', avatar_url: '', profile_link: '' }); }}>
              <Plus size={14} /> Add Profile
            </button>
          </div>
          {addingD && editingD && renderForm(editingD, setEditingD,
            [{ key: 'name', label: 'Name' }, { key: 'location', label: 'Location' }, { key: 'avatar_url', label: 'Avatar URL' }, { key: 'profile_link', label: 'Profile Link' }],
            () => { saveProfile(editingD); setAddingD(false); setEditingD(null); },
            () => { setAddingD(false); setEditingD(null); },
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 16 }}>
            {profiles.map((p, i) => (
              <div key={p.id} style={{ ...s.card, textAlign: 'center' as const, padding: 16, position: 'relative' as const }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 8 }}>
                  <button style={s.iconBtn} onClick={() => moveItem('ag_discover_profiles', profiles, i, -1)}><ArrowUp size={12} /></button>
                  <button style={s.iconBtn} onClick={() => moveItem('ag_discover_profiles', profiles, i, 1)}><ArrowDown size={12} /></button>
                </div>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(240,237,232,0.06)', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 12, fontWeight: 500, color: '#F0EDE8', fontFamily: dm }}>{p.name}</div>
                <div style={{ fontSize: 10, color: 'rgba(240,237,232,0.3)', fontFamily: dm }}>{p.location}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 8 }}>
                  <button style={s.iconBtn} onClick={() => { setEditingD({ ...p }); setAddingD(true); }}><Pencil size={12} /></button>
                  <button style={s.iconBtn} onClick={() => deleteProfile(p.id)}><Trash2 size={12} /></button>
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
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontSize: 13, color: '#F0EDE8', cursor: 'pointer', fontFamily: dm }}>
                <input type="checkbox" checked={(settings as any)[key]} onChange={e => setSettings({ ...settings, [key]: e.target.checked })} style={{ accentColor: '#E8C97A' }} />
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

          <button style={{ ...s.saveBtn, marginTop: 20 }} onClick={saveSettings}>
            Save Settings
          </button>
        </div>
      )}
    </div>
  );
}
