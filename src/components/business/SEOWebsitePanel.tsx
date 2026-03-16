import { useState } from 'react';
import { useSEOEngine, SEOPage, BlogPost } from '@/hooks/use-seo-engine';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Globe, Search, FileText, Sparkles, TrendingUp, Eye,
  Trash2, CheckCircle2, Clock, Zap, MapPin, Tag,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SEOWebsitePanelProps {
  studioName?: string;
  location?: string;
}

export function SEOWebsitePanel({ studioName = '', location = '' }: SEOWebsitePanelProps) {
  const {
    seoPages, blogPosts, loading, generating, seoScore,
    generateSEOPages, generateBlogPost, updatePageStatus,
    deletePageById, toggleBlogPublish,
  } = useSEOEngine();

  const [loc, setLoc] = useState(location);
  const [name, setName] = useState(studioName);
  const [specialties, setSpecialties] = useState('Wedding, Candid, Portrait');
  const [eventName, setEventName] = useState('');
  const [eventLocation, setEventLocation] = useState('');

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  const published = seoPages.filter(p => p.status === 'published').length;
  const drafts = seoPages.filter(p => p.status === 'draft').length;
  const publishedBlogs = blogPosts.filter(b => b.published).length;

  return (
    <div className="space-y-6">
      {/* SEO Score Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">SEO Growth Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-light text-foreground">{seoScore}</span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {seoScore < 30 ? 'Get started — generate SEO pages' :
                 seoScore < 60 ? 'Growing — publish more pages & blogs' :
                 'Strong — keep publishing quality content'}
              </p>
            </div>
            <div className="text-right space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" /> {published} pages live
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" /> {publishedBlogs} blogs published
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Eye className="h-3 w-3" /> {seoPages.reduce((s, p) => s + p.views, 0)} total views
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pages">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="pages" className="text-xs">
            <Search className="h-3 w-3 mr-1" /> SEO Pages
          </TabsTrigger>
          <TabsTrigger value="blog" className="text-xs">
            <FileText className="h-3 w-3 mr-1" /> AI Blog
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" /> AI Tips
          </TabsTrigger>
        </TabsList>

        {/* SEO Pages Tab */}
        <TabsContent value="pages" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Generate Local SEO Pages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input placeholder="Studio name" value={name} onChange={e => setName(e.target.value)} className="text-sm" />
                <Input placeholder="City / Location" value={loc} onChange={e => setLoc(e.target.value)} className="text-sm" />
                <Input placeholder="Specialties" value={specialties} onChange={e => setSpecialties(e.target.value)} className="text-sm" />
              </div>
              <Button
                size="sm"
                onClick={() => generateSEOPages(loc, name, specialties)}
                disabled={generating || !loc || !name}
                className="w-full sm:w-auto"
              >
                {generating ? 'Generating...' : '✨ Generate 5 SEO Pages'}
              </Button>
            </CardContent>
          </Card>

          {seoPages.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Globe className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No SEO pages yet. Generate your first batch above.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {seoPages.map(page => (
                <SEOPageRow
                  key={page.id}
                  page={page}
                  onPublish={() => updatePageStatus(page.id, 'published')}
                  onUnpublish={() => updatePageStatus(page.id, 'draft')}
                  onDelete={() => deletePageById(page.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Blog Tab */}
        <TabsContent value="blog" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Generate Blog from Shoot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input placeholder="Event name (e.g., Rahul & Priya Wedding)" value={eventName} onChange={e => setEventName(e.target.value)} className="text-sm" />
                <Input placeholder="Location" value={eventLocation} onChange={e => setEventLocation(e.target.value)} className="text-sm" />
              </div>
              <Button
                size="sm"
                onClick={() => generateBlogPost({ name: eventName, location: eventLocation, event_type: 'wedding' }, name || studioName)}
                disabled={generating || !eventName}
                className="w-full sm:w-auto"
              >
                {generating ? 'Writing...' : '📝 Generate Blog Post'}
              </Button>
            </CardContent>
          </Card>

          {blogPosts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No blog posts yet. Generate one from a completed shoot.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {blogPosts.map(post => (
                <BlogRow
                  key={post.id}
                  post={post}
                  onTogglePublish={() => toggleBlogPublish(post.id, !post.published)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* AI Tips Tab */}
        <TabsContent value="suggestions" className="space-y-3 mt-4">
          <SEOSuggestions
            seoPages={seoPages}
            blogPosts={blogPosts}
            location={loc || location}
            studioName={name || studioName}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SEOPageRow({ page, onPublish, onUnpublish, onDelete }: {
  page: SEOPage;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="hover:border-primary/20 transition-colors">
      <CardContent className="py-3 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={page.status === 'published' ? 'default' : 'secondary'} className="text-[10px]">
                {page.status === 'published' ? <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> : <Clock className="h-2.5 w-2.5 mr-1" />}
                {page.status}
              </Badge>
              {page.location && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <MapPin className="h-2.5 w-2.5" /> {page.location}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-foreground truncate">{page.title}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{page.meta_description}</p>
            {page.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {page.keywords.slice(0, 4).map((kw, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-0.5">
                    <Tag className="h-2 w-2" /> {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {page.status === 'draft' ? (
              <Button size="sm" variant="outline" onClick={onPublish} className="text-xs h-7">
                Publish
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={onUnpublish} className="text-xs h-7">
                Unpublish
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onDelete} className="text-xs h-7 text-destructive hover:text-destructive">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BlogRow({ post, onTogglePublish }: { post: BlogPost; onTogglePublish: () => void }) {
  return (
    <Card className="hover:border-primary/20 transition-colors">
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={post.published ? 'default' : 'secondary'} className="text-[10px]">
                {post.published ? 'Published' : 'Draft'}
              </Badge>
            </div>
            <p className="text-sm font-medium text-foreground truncate">{post.title || 'Untitled'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{post.seo_description || 'No description'}</p>
          </div>
          <Button size="sm" variant="outline" onClick={onTogglePublish} className="text-xs h-7 shrink-0">
            {post.published ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SEOSuggestions({ seoPages, blogPosts, location, studioName }: {
  seoPages: SEOPage[];
  blogPosts: BlogPost[];
  location: string;
  studioName: string;
}) {
  const tips: { icon: React.ReactNode; text: string; priority: 'high' | 'medium' | 'low' }[] = [];

  if (seoPages.length === 0) {
    tips.push({ icon: <Globe className="h-4 w-4" />, text: 'Generate your first batch of SEO landing pages to start ranking on Google', priority: 'high' });
  }
  if (seoPages.filter(p => p.status === 'published').length === 0 && seoPages.length > 0) {
    tips.push({ icon: <CheckCircle2 className="h-4 w-4" />, text: 'Publish your draft SEO pages to make them visible to search engines', priority: 'high' });
  }
  if (blogPosts.length === 0) {
    tips.push({ icon: <FileText className="h-4 w-4" />, text: 'Create blog posts from completed shoots — blogs drive 3x more organic traffic', priority: 'high' });
  }
  if (location) {
    tips.push({ icon: <MapPin className="h-4 w-4" />, text: `Create pages targeting "${location}" keywords like "Best Wedding Photographer in ${location}"`, priority: 'medium' });
  }
  if (seoPages.length > 0 && seoPages.length < 10) {
    tips.push({ icon: <TrendingUp className="h-4 w-4" />, text: 'Generate more SEO pages — photographers with 10+ pages get 5x more organic leads', priority: 'medium' });
  }
  if (blogPosts.length > 0 && blogPosts.length < 5) {
    tips.push({ icon: <Sparkles className="h-4 w-4" />, text: 'Aim for 5+ blog posts. Consistent blogging signals freshness to search engines', priority: 'low' });
  }

  if (tips.length === 0) {
    tips.push({ icon: <Sparkles className="h-4 w-4" />, text: 'Your SEO setup is strong! Keep publishing fresh content regularly', priority: 'low' });
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  tips.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Entiran SEO Advisor</p>
      {tips.map((tip, i) => (
        <Card key={i} className={`${tip.priority === 'high' ? 'border-primary/30 bg-primary/5' : ''}`}>
          <CardContent className="py-3 px-4 flex items-start gap-3">
            <div className={`mt-0.5 ${tip.priority === 'high' ? 'text-primary' : 'text-muted-foreground'}`}>
              {tip.icon}
            </div>
            <div>
              <p className="text-sm text-foreground">{tip.text}</p>
              <Badge variant="outline" className="text-[9px] mt-1.5">
                {tip.priority} priority
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
