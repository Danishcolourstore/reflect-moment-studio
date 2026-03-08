-- Enable realtime for admin-managed tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.website_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blog_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_inquiries;