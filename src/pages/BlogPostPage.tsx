import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Post {
  title: string | null;
  content: string | null;
  cover_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
}

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (supabase.from('blog_posts' as any).select('*') as any)
      .eq('slug', slug).eq('published', true).maybeSingle()
      .then(({ data }: any) => {
        if (!data) { setNotFound(true); setLoading(false); return; }
        const p = data as Post;
        setPost(p);
        document.title = `${p.seo_title || p.title || 'Blog'} — MirrorAI`;
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground/50 text-sm">Loading...</p></div>;
  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">Post not found</h1>
      <p className="text-[12px] text-muted-foreground/50">This blog post doesn't exist or isn't published.</p>
    </div>
  );
  if (!post) return null;

  return (
    <div className="min-h-screen bg-background page-fade-in">
      {post.cover_url && (
        <div className="h-[50vh] overflow-hidden">
          <img src={post.cover_url} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <article className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-4 leading-tight">
          {post.seo_title || post.title}
        </h1>
        <div className="prose prose-sm text-foreground/80 leading-relaxed whitespace-pre-wrap text-[14px]">
          {post.content}
        </div>
      </article>
      <div className="text-center pb-8">
        <p className="text-[9px] text-muted-foreground/30 tracking-[0.15em] uppercase">Powered by MirrorAI</p>
      </div>
    </div>
  );
};

export default BlogPostPage;
