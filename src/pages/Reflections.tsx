import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useReflections, ReflectionPost, useMoodBoardDrops, usePhotographerSpotlight } from '@/hooks/use-reflections';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Bookmark, BookmarkCheck, Sparkles, TrendingUp, Gift, Tag,
  Lightbulb, Megaphone, ShoppingBag, Smile, Star, ArrowRight,
  Flame, Download, ExternalLink, FolderPlus,
} from 'lucide-react';
import { PresetMarketplace } from '@/components/reflections/PresetMarketplace';
import { WeeklyMoodBoard } from '@/components/reflections/WeeklyMoodBoard';
import { CollectionsGallery } from '@/components/reflections/CollectionsGallery';
import { SaveToCollectionSheet } from '@/components/reflections/SaveToCollectionSheet';
import { PhotographerSpotlightCard } from '@/components/reflections/PhotographerSpotlightCard';

const TABS = [
  { value: 'for_you', label: 'For You' },
  { value: 'latest', label: 'Latest' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'learn', label: 'Learn' },
  { value: 'collections', label: 'Collections' },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  inspiration: <Star className="h-3 w-3" />,
  tips: <Lightbulb className="h-3 w-3" />,
  announcements: <Megaphone className="h-3 w-3" />,
  offers: <Gift className="h-3 w-3" />,
  products: <ShoppingBag className="h-3 w-3" />,
  fun: <Smile className="h-3 w-3" />,
};

const TAG_VARIANTS: Record<string, { icon: React.ReactNode; className: string }> = {
  new: { icon: <Sparkles className="h-2.5 w-2.5" />, className: 'bg-primary/20 text-primary border-primary/30' },
  trending: { icon: <TrendingUp className="h-2.5 w-2.5" />, className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  recommended: { icon: <Flame className="h-2.5 w-2.5" />, className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  offer: { icon: <Tag className="h-2.5 w-2.5" />, className: 'bg-green-500/20 text-green-400 border-green-500/30' },
};

const TYPE_COLORS: Record<string, string> = {
  inspiration: 'from-purple-500/10 to-transparent',
  tips: 'from-amber-500/10 to-transparent',
  announcements: 'from-blue-500/10 to-transparent',
  offers: 'from-green-500/10 to-transparent',
  products: 'from-pink-500/10 to-transparent',
  fun: 'from-cyan-500/10 to-transparent',
};

export default function Reflections() {
  const { posts, loading, toggleSave } = useReflections();
  const { drops } = useMoodBoardDrops();
  const { spotlight } = usePhotographerSpotlight();
  const [activeTab, setActiveTab] = useState('for_you');
  const [saveSheetOpen, setSaveSheetOpen] = useState(false);
  const [itemToSave, setItemToSave] = useState<any>(null);
  const navigate = useNavigate();

  const todayPosts = posts.filter(p => p.is_today);
  const filteredPosts = activeTab === 'collections'
    ? []
    : posts.filter(p => p.tab === activeTab);

  const handleCTA = (post: ReflectionPost) => {
    if (post.cta_action === 'route' && post.cta_route) {
      navigate(post.cta_route);
    }
  };

  const handleSaveToCollection = useCallback((item: any) => {
    setItemToSave({
      item_type: item.theme ? 'mood_board' : 'post',
      item_id: item.id,
      item_title: item.title,
      item_image: item.image_url || item.cover_image,
    });
    setSaveSheetOpen(true);
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-3 overflow-hidden">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-44 shrink-0 rounded-xl" />)}
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1
            className="text-foreground"
            style={{ fontFamily: 'var(--editorial-heading)', fontSize: '24px', fontWeight: 400, letterSpacing: '-0.3px' }}
          >
            Reflections
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Your daily dose of inspiration, tips & tools</p>
        </div>

        {/* Today Strip */}
        {todayPosts.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2 font-medium flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" /> Today in Reflections
            </p>
            <ScrollArea className="w-full">
              <div className="flex gap-3 pb-2">
                {todayPosts.map(post => (
                  <TodayCard key={post.id} post={post} onSave={() => toggleSave(post.id)} onCTA={() => handleCTA(post)} />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${TABS.length}, 1fr)` }}>
            {TABS.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* For You Tab */}
          <TabsContent value="for_you" className="mt-4 space-y-6">
            {/* Photographer Spotlight */}
            <PhotographerSpotlightCard spotlight={spotlight} />

            {/* Mood Board */}
            <WeeklyMoodBoard drops={drops} onSaveToCollection={handleSaveToCollection} />

            {/* Feed */}
            {filteredPosts.length > 0 && (
              <div className="space-y-3">
                {filteredPosts.map(post => (
                  <FeedCard
                    key={post.id}
                    post={post}
                    onSave={() => toggleSave(post.id)}
                    onCTA={() => handleCTA(post)}
                    onSaveToCollection={() => handleSaveToCollection(post)}
                  />
                ))}
              </div>
            )}

            {filteredPosts.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
                  <p className="text-sm text-muted-foreground">More content coming soon</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Latest Tab */}
          <TabsContent value="latest" className="mt-4 space-y-3">
            {posts.filter(p => p.tab === 'latest').length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Bookmark className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
                  <p className="text-sm text-muted-foreground">No posts here yet. Check back soon!</p>
                </CardContent>
              </Card>
            ) : (
              posts.filter(p => p.tab === 'latest').map(post => (
                <FeedCard
                  key={post.id}
                  post={post}
                  onSave={() => toggleSave(post.id)}
                  onCTA={() => handleCTA(post)}
                  onSaveToCollection={() => handleSaveToCollection(post)}
                />
              ))
            )}
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="mt-4">
            <PresetMarketplace />
          </TabsContent>

          {/* Learn Tab */}
          <TabsContent value="learn" className="mt-4 space-y-3">
            {posts.filter(p => p.tab === 'learn').length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Lightbulb className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
                  <p className="text-sm text-muted-foreground">Learning content drops weekly!</p>
                </CardContent>
              </Card>
            ) : (
              posts.filter(p => p.tab === 'learn').map(post => (
                <FeedCard
                  key={post.id}
                  post={post}
                  onSave={() => toggleSave(post.id)}
                  onCTA={() => handleCTA(post)}
                  onSaveToCollection={() => handleSaveToCollection(post)}
                />
              ))
            )}
          </TabsContent>

          {/* Collections Tab */}
          <TabsContent value="collections" className="mt-4">
            <CollectionsGallery />
          </TabsContent>
        </Tabs>

        {/* Save to Collection Sheet */}
        <SaveToCollectionSheet
          open={saveSheetOpen}
          onClose={() => { setSaveSheetOpen(false); setItemToSave(null); }}
          itemToSave={itemToSave}
        />
      </div>
    </DashboardLayout>
  );
}

/* ─── Today Horizontal Card ─── */
function TodayCard({ post, onSave, onCTA }: { post: ReflectionPost; onSave: () => void; onCTA: () => void }) {
  const tagStyle = TAG_VARIANTS[post.tag || ''] || TAG_VARIANTS.new;

  return (
    <Card className="w-44 shrink-0 overflow-hidden hover:border-primary/20 transition-colors group">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={`text-[8px] px-1.5 py-0 h-4 gap-0.5 ${tagStyle.className}`}>
            {tagStyle.icon} {post.tag}
          </Badge>
          <button onClick={onSave} className="p-0.5 hover:text-primary transition-colors">
            {post.saved
              ? <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
              : <Bookmark className="h-3.5 w-3.5 text-muted-foreground/40" />}
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground/60">
          {TYPE_ICONS[post.card_type]}
          <span className="text-[9px] uppercase tracking-wider">{post.card_type}</span>
        </div>
        <p className="text-xs font-medium text-foreground leading-snug line-clamp-2">{post.title}</p>
        {post.cta_label && (
          <Button size="sm" variant="ghost" className="text-[10px] h-6 px-2 text-primary hover:text-primary" onClick={onCTA}>
            {post.cta_label} <ArrowRight className="h-2.5 w-2.5 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Feed Card ─── */
function FeedCard({
  post, onSave, onCTA, onSaveToCollection
}: {
  post: ReflectionPost;
  onSave: () => void;
  onCTA: () => void;
  onSaveToCollection?: () => void;
}) {
  const tagStyle = TAG_VARIANTS[post.tag || ''] || TAG_VARIANTS.new;
  const gradient = TYPE_COLORS[post.card_type] || 'from-muted/50 to-transparent';

  return (
    <Card className={`overflow-hidden hover:border-primary/20 transition-all group bg-gradient-to-br ${gradient}`}>
      <CardContent className="p-4 space-y-3">
        {/* Top row: tag + type + save */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-[9px] px-1.5 py-0.5 h-5 gap-1 ${tagStyle.className}`}>
              {tagStyle.icon} {post.tag}
            </Badge>
            <span className="flex items-center gap-1 text-muted-foreground/50 text-[9px] uppercase tracking-wider">
              {TYPE_ICONS[post.card_type]} {post.card_type}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {onSaveToCollection && (
              <button
                onClick={onSaveToCollection}
                className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors opacity-0 group-hover:opacity-100"
                title="Save to collection"
              >
                <FolderPlus className="h-3.5 w-3.5 text-muted-foreground/30 hover:text-primary" />
              </button>
            )}
            <button
              onClick={onSave}
              className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
            >
              {post.saved
                ? <BookmarkCheck className="h-4 w-4 text-primary" />
                : <Bookmark className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60" />}
            </button>
          </div>
        </div>

        {/* Image */}
        {post.image_url && (
          <div className="rounded-lg overflow-hidden">
            <img src={post.image_url} alt={post.title} className="w-full h-40 object-cover" loading="lazy" />
          </div>
        )}

        {/* Content */}
        <div>
          <h3 className="text-sm font-semibold text-foreground leading-snug">{post.title}</h3>
          {post.body && (
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">{post.body}</p>
          )}
        </div>

        {/* CTA */}
        {post.cta_label && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8 gap-1.5 border-primary/20 text-primary hover:bg-primary/10 hover:text-primary"
            onClick={onCTA}
          >
            {post.cta_action === 'download' && <Download className="h-3 w-3" />}
            {post.cta_action === 'route' && <ExternalLink className="h-3 w-3" />}
            {post.cta_action === 'feature' && <Sparkles className="h-3 w-3" />}
            {post.cta_label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
