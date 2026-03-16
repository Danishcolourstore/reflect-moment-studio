import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SEOPage {
  id: string;
  slug: string;
  title: string;
  meta_description: string | null;
  heading: string | null;
  body_html: string | null;
  keywords: string[];
  location: string | null;
  page_type: string;
  status: string;
  views: number;
  leads_captured: number;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  title: string | null;
  slug: string | null;
  content: string | null;
  cover_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published: boolean | null;
  created_at: string;
}

export function useSEOEngine() {
  const [seoPages, setSeoPages] = useState<SEOPage[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [pagesRes, blogsRes] = await Promise.all([
      (supabase.from('seo_pages' as any).select('*') as any).eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('blog_posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);

    setSeoPages((pagesRes.data || []) as SEOPage[]);
    setBlogPosts((blogsRes.data || []) as BlogPost[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const generateSEOPages = async (location: string, studioName: string, specialties: string) => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-seo-content', {
        body: { type: 'seo_pages', location, studioName, specialties },
      });
      if (error) throw error;

      const pages = data.result;
      if (!Array.isArray(pages)) throw new Error('Invalid response');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const inserts = pages.map((p: any) => ({
        user_id: user.id,
        slug: p.slug,
        title: p.title,
        meta_description: p.meta_description,
        heading: p.heading,
        body_html: p.body_html,
        keywords: p.keywords || [],
        location: p.location,
        page_type: 'landing',
        status: 'draft',
      }));

      const { error: insertError } = await (supabase.from('seo_pages' as any).insert(inserts) as any);
      if (insertError) throw insertError;

      toast({ title: '✨ SEO pages generated', description: `${pages.length} landing pages created as drafts` });
      await fetchData();
    } catch (e: any) {
      toast({ title: 'Generation failed', description: e.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const generateBlogPost = async (eventData: any, studioName: string) => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-seo-content', {
        body: { type: 'blog_post', eventData, studioName, location: eventData?.location },
      });
      if (error) throw error;

      const post = data.result;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: insertError } = await supabase.from('blog_posts').insert({
        user_id: user.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        seo_title: post.seo_title,
        seo_description: post.seo_description,
        published: false,
      });
      if (insertError) throw insertError;

      toast({ title: '📝 Blog post generated', description: 'Draft blog post created from shoot data' });
      await fetchData();
    } catch (e: any) {
      toast({ title: 'Blog generation failed', description: e.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const updatePageStatus = async (pageId: string, status: string) => {
    const { error } = await (supabase.from('seo_pages' as any).update({ status } as any) as any).eq('id', pageId);
    if (!error) {
      setSeoPages(prev => prev.map(p => p.id === pageId ? { ...p, status } : p));
      toast({ title: status === 'published' ? '🚀 Page published' : '📋 Status updated' });
    }
  };

  const deletePageById = async (pageId: string) => {
    const { error } = await (supabase.from('seo_pages' as any).delete() as any).eq('id', pageId);
    if (!error) {
      setSeoPages(prev => prev.filter(p => p.id !== pageId));
      toast({ title: 'Page deleted' });
    }
  };

  const toggleBlogPublish = async (postId: string, published: boolean) => {
    const { error } = await supabase.from('blog_posts').update({ published }).eq('id', postId);
    if (!error) {
      setBlogPosts(prev => prev.map(p => p.id === postId ? { ...p, published } : p));
      toast({ title: published ? '🚀 Blog published' : 'Blog unpublished' });
    }
  };

  const seoScore = (() => {
    const published = seoPages.filter(p => p.status === 'published').length;
    const blogs = blogPosts.filter(b => b.published).length;
    const hasPages = Math.min(30, published * 6);
    const hasBlogs = Math.min(30, blogs * 5);
    const hasKeywords = seoPages.some(p => p.keywords.length > 0) ? 20 : 0;
    const hasLocation = seoPages.some(p => p.location) ? 20 : 0;
    return hasPages + hasBlogs + hasKeywords + hasLocation;
  })();

  return {
    seoPages, blogPosts, loading, generating, seoScore,
    generateSEOPages, generateBlogPost, updatePageStatus,
    deletePageById, toggleBlogPublish, refresh: fetchData,
  };
}
