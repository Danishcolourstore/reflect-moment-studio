
UPDATE public.website_templates
SET demo_content = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          demo_content::jsonb,
          '{hero,image_url}',
          '"https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-couple-petals.jpg"'
        ),
        '{portfolio,demo_images}',
        '[
          "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-bride-portrait.jpg",
          "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-bride-closeup.jpg",
          "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-couple-colorful.jpg",
          "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-wedding-ceremony.jpg",
          "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-couple-petals.jpg",
          "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-bride-portrait.jpg",
          "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-bride-closeup.jpg",
          "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-couple-colorful.jpg",
          "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-wedding-ceremony.jpg"
        ]'
      ),
      '{gallery_images}',
      '[
        "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-bride-portrait.jpg",
        "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-bride-closeup.jpg",
        "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-couple-colorful.jpg",
        "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-wedding-ceremony.jpg",
        "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-couple-petals.jpg",
        "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-bride-portrait.jpg"
      ]'
    ),
    '{social_images}',
    '[
      "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-bride-closeup.jpg",
      "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-couple-colorful.jpg",
      "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-wedding-ceremony.jpg",
      "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-couple-petals.jpg",
      "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-bride-portrait.jpg",
      "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-bride-closeup.jpg"
    ]'
  ),
  '{about,profile_image_url}',
  '"https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-bride-portrait.jpg"'
)
WHERE slug = 'clean-minimal';

UPDATE public.website_templates
SET demo_content = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            demo_content::jsonb,
            '{hero,image_url}',
            '"https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-wedding-ceremony.jpg"'
          ),
          '{portfolio,demo_images}',
          '[
            "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-wedding-ceremony.jpg",
            "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-couple-colorful.jpg",
            "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-bride-portrait.jpg",
            "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-couple-petals.jpg",
            "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-bride-closeup.jpg",
            "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-wedding-ceremony.jpg",
            "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-couple-colorful.jpg",
            "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-bride-portrait.jpg",
            "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-couple-petals.jpg"
          ]'
        ),
        '{gallery_images}',
        '[
          "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-wedding-ceremony.jpg",
          "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-couple-colorful.jpg",
          "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-bride-portrait.jpg",
          "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-couple-petals.jpg",
          "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-bride-closeup.jpg",
          "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-wedding-ceremony.jpg"
        ]'
      ),
      '{social_images}',
      '[
        "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-couple-colorful.jpg",
        "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-bride-portrait.jpg",
        "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-couple-petals.jpg",
        "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-bride-closeup.jpg",
        "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-wedding-ceremony.jpg",
        "https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-couple-colorful.jpg"
      ]'
    ),
    '{about,profile_image_url}',
    '"https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-bride-closeup.jpg"'
  ),
  '{featured_stories}',
  '[
    {"title":"Eternal Frames","location":"Udaipur","image_url":"https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-wedding-ceremony.jpg"},
    {"title":"Golden Hour","location":"Jaipur","image_url":"https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-couple-colorful.jpg"},
    {"title":"Velvet Dreams","location":"Paris","image_url":"https://tiwatanqxacwrnytfcoy.supabase.co/storage/v1/object/public/studio-website-assets/demo/demo-couple-petals.jpg"}
  ]'
)
WHERE slug = 'magazine-editorial';
