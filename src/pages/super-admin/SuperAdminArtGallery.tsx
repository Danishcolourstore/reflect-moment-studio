import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, MessageSquare, X, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

/* ── Types ── */
interface Photographer { id: string; name: string; location: string; bio: string; photo_url: string; website: string; status: string; sort_order: number; }
interface Story { id: string; couple: string; location: string; story_date: string; snippet: string; cover_url: string; status: string; sort_order: number; }
interface ManualNews { id: string; title: string; source: string; url: string; news_date: string; thumbnail_url: string; sort_order: number; }
interface Tutorial { id: string; title: string; author: string; description: string; duration: string; tag: string; url: string; status: string; sort_order: number; }
interface DiscoverProfile { id: string; name: string; location: string; avatar_url: string; profile_link: string; sort_order: number; }
interface FeedPost { id: string; user_id: string; title: string; caption: string | null; image_url: string | null; location: string | null; visible: boolean; created_at: string; }
interface GallerySettings { name: string; tagline: string; heroText: string; showEducation: boolean; showNews: boolean; showDiscover: boolean; showRss: boolean; showManual: boolean; rssFeeds: string[]; }
interface ChatMsg { role: 'user' | 'assistant'; content: string; }

const TABS = ['FEATURED', 'STORIES', 'FEED', 'NEWS', 'EDUCATION', 'DISCOVER', 'SETTINGS'] as const;
type Tab = typeof TABS[number];
const TAG_OPTIONS = ['Free Tutorial', 'Premium', 'Workshop', 'Webinar'];

/* ── Reusable className constants ── */
const labelCls = "text-[10px] font-medium tracking-[0.15em] uppercase text-[var(--ink-muted)] mb-2";
const inputCls = "bg-white border border-[var(--rule)] text-[var(--ink)] px-3 py-2 text-[13px] w-full outline-none focus:border-[var(--rule-strong)]";
const textareaCls = `${inputCls} min-h-20 resize-y`;
const ghostBtnCls = "bg-transparent border border-[var(--ink)] text-[var(--ink)] px-4 py-2 text-[11px] cursor-pointer inline-flex items-center gap-1.5 font-medium tracking-[0.05em] hover:bg-[var(--wash)]";
const saveBtnCls = "bg-[var(--ink)] text-white border-0 px-5 py-2 text-[11px] font-semibold cursor-pointer";
const cancelBtnCls = "bg-transparent border border-[var(--rule)] text-[var(--ink-muted)] px-4 py-2 text-[11px] cursor-pointer";
const tdCls = "px-3 py-2.5 border-b border-[var(--rule)] text-[13px] text-[var(--ink)] align-top";
const thCls = "px-3 py-2 border-b border-[var(--rule-strong)] text-[9px] font-semibold tracking-[0.15em] uppercase text-[var(--ink-muted)] text-left";
const cardCls = "bg-white border border-[var(--rule)] p-5 mb-4";
const iconBtnCls = "bg-transparent border-0 cursor-pointer p-1 text-[var(--ink-muted)] hover:text-[var(--ink)]";

function StatusBadge({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.08em] uppercase text-[var(--ink)]">
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-[var(--ink)]' : 'border border-[var(--ink-whisper)]'}`} />
      {children}
    </span>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div className="mb-3">
      <div className={labelCls}>{label}</div>
      {type === 'textarea' ? (
        <textarea className={textareaCls} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <input className={inputCls} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════ */
export default function SuperAdminArtGallery() {
  const [tab, setTab] = useState<Tab>('FEATURED');
  const [chatOpen, setChatOpen] = useState(false);

  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [manualNews, setManualNews] = useState<ManualNews[]>([]);
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [settings, setSettings] = useState<GallerySettings>({
    name: 'Art Gallery', tagline: 'Shoot. Share. Inspire.',
    heroText: 'India Celebrates Love Like No Other Nation On Earth',
    showEducation: true, showNews: true, showDiscover: true, showRss: true, showManual: true,
    rssFeeds: ['https://petapixel.com/feed/', 'https://fstoppers.com/feed', 'https://www.diyphotography.net/feed/'],
  });

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

  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadAll = async () => {
    const [p, st, n, t, d, cfg, fp] = await Promise.all([
      (supabase.from('ag_featured_photographers').select('*').order('sort_order') as any),
      (supabase.from('ag_stories').select('*').order('sort_order') as any),
      (supabase.from('ag_manual_news').select('*').order('sort_order') as any),
      (supabase.from('ag_education').select('*').order('sort_order') as any),
      (supabase.from('ag_discover_profiles').select('*').order('sort_order') as any),
      (supabase.from('ag_settings').select('setting_value').eq('setting_key', 'gallery_config').maybeSingle() as any),
      (supabase.from('feed_posts').select('*').order('created_at', { ascending: false }).limit(50) as any),
    ]);
    if (p.data) setPhotographers(p.data);
    if (st.data) setStories(st.data);
    if (n.data) setManualNews(n.data);
    if (t.data) setTutorials(t.data);
    if (d.data) setProfiles(d.data);
    if (cfg.data?.setting_value) setSettings(cfg.data.setting_value);
    if (fp.data) setFeedPosts(fp.data);
  };

  useEffect(() => { loadAll(); }, []);

  // ── CRUD helpers ──
  const savePhotographer = async (item: any) => {
    if (photographers.find(x => x.id === item.id)) {
      await (supabase.from('ag_featured_photographers').update({ name: item.name, location: item.location, bio: item.bio, photo_url: item.photo_url || '', website: item.website, status: item.status }).eq('id', item.id) as any);
    } else {
      await (supabase.from('ag_featured_photographers').insert({ name: item.name, location: item.location || '', bio: item.bio || '', photo_url: item.photo_url || '', website: item.website || '', status: item.status || 'active', sort_order: photographers.length }) as any);
    }
    loadAll();
  };
  const deletePhotographer = async (id: string) => { await (supabase.from('ag_featured_photographers').delete().eq('id', id) as any); loadAll(); };

  const saveStory = async (item: any) => {
    if (stories.find(x => x.id === item.id)) {
      await (supabase.from('ag_stories').update({ couple: item.couple, location: item.location, story_date: item.story_date || '', snippet: item.snippet, cover_url: item.cover_url || '', status: item.status }).eq('id', item.id) as any);
    } else {
      await (supabase.from('ag_stories').insert({ couple: item.couple, location: item.location || '', story_date: item.story_date || '', snippet: item.snippet || '', cover_url: item.cover_url || '', status: item.status || 'active', sort_order: stories.length }) as any);
    }
    loadAll();
  };
  const deleteStory = async (id: string) => { await (supabase.from('ag_stories').delete().eq('id', id) as any); loadAll(); };

  const saveNews = async (item: any) => {
    if (manualNews.find(x => x.id === item.id)) {
      await (supabase.from('ag_manual_news').update({ title: item.title, source: item.source, url: item.url, news_date: item.news_date || '', thumbnail_url: item.thumbnail_url || '' }).eq('id', item.id) as any);
    } else {
      await (supabase.from('ag_manual_news').insert({ title: item.title, source: item.source || '', url: item.url || '', news_date: item.news_date || '', thumbnail_url: item.thumbnail_url || '', sort_order: manualNews.length }) as any);
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
      await (supabase.from('ag_discover_profiles').update({ name: item.name, location: item.location, avatar_url: item.avatar_url || '', profile_link: item.profile_link || '' }).eq('id', item.id) as any);
    } else {
      await (supabase.from('ag_discover_profiles').insert({ name: item.name, location: item.location || '', avatar_url: item.avatar_url || '', profile_link: item.profile_link || '', sort_order: profiles.length }) as any);
    }
    loadAll();
  };
  const deleteProfile = async (id: string) => { await (supabase.from('ag_discover_profiles').delete().eq('id', id) as any); loadAll(); };

  const deleteFeedPost = async (id: string) => { await (supabase.from('feed_posts').delete().eq('id', id) as any); loadAll(); };
  const toggleFeedVis = async (id: string, visible: boolean) => { await (supabase.from('feed_posts').update({ visible: !visible } as any).eq('id', id) as any); loadAll(); };

  const saveSettings = async () => {
    await (supabase.from('ag_settings').update({ setting_value: settings as any, updated_at: new Date().toISOString() }).eq('setting_key', 'gallery_config') as any);
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
      setChatMessages(prev => [...prev, { role: 'assistant', content: data?.reply || 'Done.' }]);
      loadAll();
    } catch (e: any) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message || 'Something went wrong'}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  function renderForm(item: any, setItem: (i: any) => void, fields: { key: string; label: string; type?: string; options?: string[] }[], onSave: () => void, onCancel: () => void) {
    return (
      <div className={cardCls}>
        {fields.map(f => (
          f.options ? (
            <div key={f.key} className="mb-3">
              <div className={labelCls}>{f.label}</div>
              <select className={`${inputCls} cursor-pointer`} value={String(item[f.key] ?? '')} onChange={e => setItem({ ...item, [f.key]: e.target.value })}>
                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ) : (
            <Field key={f.key} label={f.label} value={String(item[f.key] ?? '')} onChange={v => setItem({ ...item, [f.key]: v })} type={f.type || 'text'} />
          )
        ))}
        <div className="flex gap-2 mt-1">
          <button className={saveBtnCls} onClick={onSave}>Save</button>
          <button className={cancelBtnCls} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1100px]">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-[26px] font-semibold text-[var(--ink)] m-0">Art Gallery Editor</h1>
          <div className="w-10 h-px bg-[var(--ink)] mt-2" />
          <p className="text-xs text-[var(--ink-muted)] mt-2 mb-0">Manage community content & photographer feeds</p>
        </div>
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className={chatOpen
            ? `${saveBtnCls} inline-flex items-center gap-1.5`
            : ghostBtnCls}
        >
          <MessageSquare size={14} /> AI Assistant
        </button>
      </div>

      {/* AI Chat Panel */}
      {chatOpen && (
        <div className="bg-white border border-[var(--rule)] mb-6 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--rule)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--ink)]" />
              <span className="text-sm font-semibold text-[var(--ink)]">Art Gallery AI</span>
            </div>
            <button className={iconBtnCls} onClick={() => setChatOpen(false)}><X size={16} /></button>
          </div>

          <div className="h-80 overflow-y-auto p-4 flex flex-col gap-3 bg-[var(--wash)]">
            {chatMessages.length === 0 && (
              <div className="text-center px-5 py-10">
                <div className="text-xs text-[var(--ink-muted)] leading-[1.8]">
                  Ask me to manage Art Gallery content.<br />
                  <span className="text-[var(--ink-whisper)] text-[11px]">
                    "Add photographer Amrit from Chandigarh"<br />
                    "List all feed posts" · "Delete the Kerala story"<br />
                    "Hide feed post by title..." · "Change hero text to..."
                  </span>
                </div>
              </div>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3.5 py-2.5 text-[13px] leading-[1.6] ${
                  m.role === 'user'
                    ? 'bg-[var(--ink)] text-white'
                    : 'bg-white text-[var(--ink)] border border-[var(--rule)]'
                }`}>
                  {m.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : m.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="px-3.5 py-2.5 bg-white border border-[var(--rule)] text-[var(--ink-muted)] text-[13px]">
                  Thinking…
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="px-4 py-3 border-t border-[var(--rule)] flex gap-2">
            <input
              className={`${inputCls} flex-1`}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
              placeholder="Ask AI to manage content…"
              disabled={chatLoading}
            />
            <button
              onClick={sendChat}
              disabled={chatLoading || !chatInput.trim()}
              className={`${saveBtnCls} inline-flex items-center gap-1 disabled:opacity-40`}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 mb-8 overflow-x-auto border-b border-[var(--rule)]">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-[10px] font-semibold tracking-[0.15em] uppercase px-5 py-3 cursor-pointer border-0 bg-transparent whitespace-nowrap transition-colors ${
              tab === t
                ? 'text-[var(--ink)] [border-bottom:2px_solid_var(--ink)]'
                : 'text-[var(--ink-muted)] [border-bottom:2px_solid_transparent]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ═══ TAB: FEATURED ═══ */}
      {tab === 'FEATURED' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-[13px] font-medium text-[var(--ink)]">{photographers.length} Photographers</span>
            <button className={ghostBtnCls} onClick={() => { setAddingP(true); setEditingP({ name: '', location: '', bio: '', photo_url: '', website: '', status: 'active' }); }}>
              <Plus size={14} /> Add
            </button>
          </div>
          {addingP && editingP && renderForm(editingP, setEditingP,
            [{ key: 'name', label: 'Name' }, { key: 'location', label: 'Location' }, { key: 'bio', label: 'Bio', type: 'textarea' }, { key: 'photo_url', label: 'Photo URL' }, { key: 'website', label: 'Website' }],
            () => { savePhotographer(editingP); setAddingP(false); setEditingP(null); },
            () => { setAddingP(false); setEditingP(null); },
          )}
          <table className="w-full border-collapse bg-white">
            <thead><tr><th className={thCls}>Photo</th><th className={thCls}>Name</th><th className={thCls}>Location</th><th className={thCls}>Status</th><th className={thCls}>Actions</th></tr></thead>
            <tbody>
              {photographers.map(p => (
                <tr key={p.id}>
                  <td className={tdCls}><div className="w-9 h-9 rounded-full bg-[var(--wash)] shrink-0" /></td>
                  <td className={`${tdCls} font-medium`}>{p.name}</td>
                  <td className={tdCls}>{p.location}</td>
                  <td className={tdCls}><StatusBadge active={p.status === 'active'}>{p.status}</StatusBadge></td>
                  <td className={tdCls}>
                    <div className="flex gap-1">
                      <button className={iconBtnCls} onClick={() => { setEditingP({ ...p }); setAddingP(true); }}><Pencil size={14} /></button>
                      <button className={iconBtnCls} onClick={() => deletePhotographer(p.id)}><Trash2 size={14} /></button>
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
          <div className="flex justify-between items-center mb-4">
            <span className="text-[13px] font-medium text-[var(--ink)]">{stories.length} Stories</span>
            <button className={ghostBtnCls} onClick={() => { setAddingS(true); setEditingS({ couple: '', location: '', story_date: '', snippet: '', cover_url: '', status: 'active' }); }}>
              <Plus size={14} /> Add Story
            </button>
          </div>
          {addingS && editingS && renderForm(editingS, setEditingS,
            [{ key: 'couple', label: 'Couple' }, { key: 'location', label: 'Location' }, { key: 'story_date', label: 'Date' }, { key: 'snippet', label: 'Snippet', type: 'textarea' }, { key: 'cover_url', label: 'Cover URL' }],
            () => { saveStory(editingS); setAddingS(false); setEditingS(null); },
            () => { setAddingS(false); setEditingS(null); },
          )}
          <table className="w-full border-collapse bg-white">
            <thead><tr><th className={thCls}>Couple</th><th className={thCls}>Location</th><th className={thCls}>Date</th><th className={thCls}>Status</th><th className={thCls}>Actions</th></tr></thead>
            <tbody>
              {stories.map(st => (
                <tr key={st.id}>
                  <td className={`${tdCls} font-serif italic font-medium`}>{st.couple}</td>
                  <td className={tdCls}>{st.location}</td>
                  <td className={tdCls}>{st.story_date}</td>
                  <td className={tdCls}><StatusBadge active={st.status === 'active'}>{st.status}</StatusBadge></td>
                  <td className={tdCls}>
                    <div className="flex gap-1">
                      <button className={iconBtnCls} onClick={() => { setEditingS({ ...st }); setAddingS(true); }}><Pencil size={14} /></button>
                      <button className={iconBtnCls} onClick={() => deleteStory(st.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ TAB: FEED ═══ */}
      {tab === 'FEED' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-[13px] font-medium text-[var(--ink)]">
              {feedPosts.length} Feed Posts (All Photographers)
            </span>
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mb-5 leading-[1.6]">
            Manage all photographer feed posts. Use AI Assistant to bulk edit, hide, or delete posts.
          </p>
          <table className="w-full border-collapse bg-white">
            <thead><tr>
              <th className={thCls}>Image</th><th className={thCls}>Title</th><th className={thCls}>Caption</th><th className={thCls}>Visible</th><th className={thCls}>Created</th><th className={thCls}>Actions</th>
            </tr></thead>
            <tbody>
              {feedPosts.map(fp => (
                <tr key={fp.id}>
                  <td className={tdCls}>
                    {fp.image_url ? (
                      <img src={fp.image_url} alt="" className="w-10 h-10 object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-10 h-10 bg-[var(--wash)]" />
                    )}
                  </td>
                  <td className={`${tdCls} font-medium max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap`}>{fp.title}</td>
                  <td className={`${tdCls} max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap text-[var(--ink-muted)]`}>{fp.caption || '—'}</td>
                  <td className={tdCls}>
                    <button
                      className="bg-transparent border-0 cursor-pointer p-0"
                      onClick={() => toggleFeedVis(fp.id, fp.visible)}
                    >
                      <StatusBadge active={fp.visible}>{fp.visible ? 'visible' : 'hidden'}</StatusBadge>
                    </button>
                  </td>
                  <td className={`${tdCls} text-[11px] text-[var(--ink-muted)]`}>
                    {new Date(fp.created_at).toLocaleDateString()}
                  </td>
                  <td className={tdCls}>
                    <button className={iconBtnCls} onClick={() => deleteFeedPost(fp.id)}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
              {feedPosts.length === 0 && (
                <tr><td colSpan={6} className={`${tdCls} text-center text-[var(--ink-whisper)] p-10`}>No feed posts yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ TAB: NEWS ═══ */}
      {tab === 'NEWS' && (
        <div>
          <div className={`${cardCls} flex items-center gap-2`}>
            <span className="w-2 h-2 rounded-full bg-[var(--ink)]" />
            <span className="text-xs text-[var(--ink)]">Auto-fetching from PetaPixel, Fstoppers, DIY Photography</span>
            <span className="ml-2"><StatusBadge active>LIVE</StatusBadge></span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-[13px] font-medium text-[var(--ink)]">Manual News ({manualNews.length})</span>
            <button className={ghostBtnCls} onClick={() => { setAddingN(true); setEditingN({ title: '', source: '', url: '', news_date: '', thumbnail_url: '' }); }}>
              <Plus size={14} /> Add Article
            </button>
          </div>
          {addingN && editingN && renderForm(editingN, setEditingN,
            [{ key: 'title', label: 'Title' }, { key: 'source', label: 'Source' }, { key: 'url', label: 'URL' }, { key: 'news_date', label: 'Date' }, { key: 'thumbnail_url', label: 'Thumbnail URL' }],
            () => { saveNews(editingN); setAddingN(false); setEditingN(null); },
            () => { setAddingN(false); setEditingN(null); },
          )}
          <table className="w-full border-collapse bg-white">
            <thead><tr><th className={thCls}>Title</th><th className={thCls}>Source</th><th className={thCls}>Date</th><th className={thCls}>Actions</th></tr></thead>
            <tbody>
              {manualNews.map(n => (
                <tr key={n.id}>
                  <td className={`${tdCls} font-medium`}>{n.title}</td>
                  <td className={tdCls}><span className="text-[10px] tracking-[0.08em] uppercase text-[var(--ink)]">{n.source}</span></td>
                  <td className={tdCls}>{n.news_date}</td>
                  <td className={tdCls}>
                    <div className="flex gap-1">
                      <button className={iconBtnCls} onClick={() => { setEditingN({ ...n }); setAddingN(true); }}><Pencil size={14} /></button>
                      <button className={iconBtnCls} onClick={() => deleteNews(n.id)}><Trash2 size={14} /></button>
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
          <div className="flex justify-between items-center mb-4">
            <span className="text-[13px] font-medium text-[var(--ink)]">{tutorials.length} Tutorials</span>
            <button className={ghostBtnCls} onClick={() => { setAddingT(true); setEditingT({ title: '', author: '', description: '', duration: '', tag: 'Free Tutorial', url: '', status: 'active' }); }}>
              <Plus size={14} /> Add Tutorial
            </button>
          </div>
          {addingT && editingT && renderForm(editingT, setEditingT,
            [{ key: 'title', label: 'Title' }, { key: 'author', label: 'Author' }, { key: 'description', label: 'Description', type: 'textarea' }, { key: 'duration', label: 'Duration' }, { key: 'tag', label: 'Tag', options: TAG_OPTIONS }, { key: 'url', label: 'URL' }],
            () => { saveTutorial(editingT); setAddingT(false); setEditingT(null); },
            () => { setAddingT(false); setEditingT(null); },
          )}
          <table className="w-full border-collapse bg-white">
            <thead><tr><th className={thCls}>Title</th><th className={thCls}>Author</th><th className={thCls}>Duration</th><th className={thCls}>Tag</th><th className={thCls}>Actions</th></tr></thead>
            <tbody>
              {tutorials.map(t => (
                <tr key={t.id}>
                  <td className={`${tdCls} font-medium`}>{t.title}</td>
                  <td className={tdCls}>{t.author}</td>
                  <td className={tdCls}>{t.duration}</td>
                  <td className={tdCls}><span className="text-[10px] tracking-[0.08em] uppercase text-[var(--ink)]">{t.tag}</span></td>
                  <td className={tdCls}>
                    <div className="flex gap-1">
                      <button className={iconBtnCls} onClick={() => { setEditingT({ ...t }); setAddingT(true); }}><Pencil size={14} /></button>
                      <button className={iconBtnCls} onClick={() => deleteTutorial(t.id)}><Trash2 size={14} /></button>
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
          <div className="flex justify-between items-center mb-4">
            <span className="text-[13px] font-medium text-[var(--ink)]">{profiles.length} Profiles</span>
            <button className={ghostBtnCls} onClick={() => { setAddingD(true); setEditingD({ name: '', location: '', avatar_url: '', profile_link: '' }); }}>
              <Plus size={14} /> Add Profile
            </button>
          </div>
          {addingD && editingD && renderForm(editingD, setEditingD,
            [{ key: 'name', label: 'Name' }, { key: 'location', label: 'Location' }, { key: 'avatar_url', label: 'Avatar URL' }, { key: 'profile_link', label: 'Profile Link' }],
            () => { saveProfile(editingD); setAddingD(false); setEditingD(null); },
            () => { setAddingD(false); setEditingD(null); },
          )}
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(130px,1fr))]">
            {profiles.map(p => (
              <div key={p.id} className={`${cardCls} text-center p-4 relative`}>
                <div className="w-12 h-12 rounded-full bg-[var(--wash)] mx-auto mb-2" />
                <div className="text-xs font-medium text-[var(--ink)]">{p.name}</div>
                <div className="text-[10px] text-[var(--ink-muted)]">{p.location}</div>
                <div className="flex justify-center gap-1 mt-2">
                  <button className={iconBtnCls} onClick={() => { setEditingD({ ...p }); setAddingD(true); }}><Pencil size={12} /></button>
                  <button className={iconBtnCls} onClick={() => deleteProfile(p.id)}><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TAB: SETTINGS ═══ */}
      {tab === 'SETTINGS' && (
        <div className="max-w-[600px]">
          <Field label="Art Gallery Name" value={settings.name} onChange={v => setSettings({ ...settings, name: v })} />
          <Field label="Tagline" value={settings.tagline} onChange={v => setSettings({ ...settings, tagline: v })} />
          <Field label="Hero Text" value={settings.heroText} onChange={v => setSettings({ ...settings, heroText: v })} type="textarea" />

          <div className="mt-6 mb-6">
            <div className={`${labelCls} mb-4`}>Section Visibility</div>
            {([['showEducation', 'Education Bar'], ['showNews', 'News Section'], ['showDiscover', 'Discover Section']] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2.5 mb-3 text-xs text-[var(--ink)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={(settings as any)[key]}
                  onChange={e => setSettings({ ...settings, [key]: e.target.checked })}
                  className="[accent-color:var(--ink)]"
                />
                {label}
              </label>
            ))}
          </div>

          <div className={`${labelCls} mb-3`}>RSS Feed URLs</div>
          {settings.rssFeeds.map((url, i) => (
            <div key={i} className="mb-2">
              <input className={inputCls} value={url} onChange={e => { const c = [...settings.rssFeeds]; c[i] = e.target.value; setSettings({ ...settings, rssFeeds: c }); }} placeholder={`Feed URL ${i + 1}`} />
            </div>
          ))}

          <button className={`${saveBtnCls} mt-5`} onClick={saveSettings}>
            Save Settings
          </button>
        </div>
      )}
    </div>
  );
}
