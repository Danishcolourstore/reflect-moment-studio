import { useState } from 'react';
import { Globe, Eye, Search, Users, Settings, ExternalLink, Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PreviewTab } from './PreviewTab';
import { SEOTab } from './SEOTab';
import { LeadsTab } from './LeadsTab';
import { SettingsTab } from './SettingsTab';
import type { WebsiteProfile } from '@/pages/WebsiteBuilder';

const TABS = [
  { key: 'preview', label: 'Preview', icon: Eye },
  { key: 'seo', label: 'SEO', icon: Search },
  { key: 'leads', label: 'Leads', icon: Users },
  { key: 'settings', label: 'Settings', icon: Settings },
];

interface Props {
  websiteId: string;
  profile: WebsiteProfile;
  userId: string;
}

export function BuilderDashboard({ websiteId, profile, userId }: Props) {
  const [activeTab, setActiveTab] = useState('preview');
  const siteUrl = `${profile.subdomain}.mirrorai.site`;

  const copyUrl = () => {
    navigator.clipboard.writeText(`https://${siteUrl}`);
    toast.success('URL copied!');
  };

  return (
    <div className="min-h-screen bg-[#080808] text-foreground">
      {/* Grain overlay */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.5\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat' }}
      />

      <div className="relative z-10">
        {/* Success banner */}
        <div className="border-b border-border/50 bg-secondary/30 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/30" />
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-mono text-foreground">{siteUrl}</span>
                </div>
                <span className="text-[10px] uppercase tracking-[0.15em] text-green-500 font-medium">Live</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyUrl} className="h-8 text-xs gap-1.5">
                <Copy className="h-3 w-3" /> Copy URL
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <Share2 className="h-3 w-3" /> Share
              </Button>
              <Button size="sm" className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground">
                <ExternalLink className="h-3 w-3" /> Custom Domain
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border/30">
          <div className="max-w-5xl mx-auto px-4 flex gap-0">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-xs font-medium tracking-wider uppercase border-b-2 transition-all duration-200 ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <div className="max-w-5xl mx-auto px-4 py-6">
          {activeTab === 'preview' && <PreviewTab profile={profile} />}
          {activeTab === 'seo' && <SEOTab profile={profile} />}
          {activeTab === 'leads' && <LeadsTab websiteId={websiteId} userId={userId} />}
          {activeTab === 'settings' && <SettingsTab websiteId={websiteId} profile={profile} userId={userId} />}
        </div>
      </div>
    </div>
  );
}
