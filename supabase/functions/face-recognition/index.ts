import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const selfieFile = formData.get('selfie') as File | null;
    const eventId = formData.get('event_id') as string | null;

    if (!selfieFile || !eventId) {
      return new Response(JSON.stringify({ error: 'selfie and event_id are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const FACEPP_API_KEY = Deno.env.get('FACEPP_API_KEY');
    const FACEPP_API_SECRET = Deno.env.get('FACEPP_API_SECRET');
    if (!FACEPP_API_KEY || !FACEPP_API_SECRET) {
      return new Response(JSON.stringify({ error: 'Face++ credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create supabase admin client to read photos
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if face recognition is enabled for this event
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('face_recognition_enabled')
      .eq('id', eventId)
      .single();

    if (eventError || !eventData?.face_recognition_enabled) {
      return new Response(JSON.stringify({ error: 'Face recognition not enabled for this event' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all photos for the event
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('id, url, file_name')
      .eq('event_id', eventId);

    if (photosError || !photos || photos.length === 0) {
      return new Response(JSON.stringify({ matched_photo_ids: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Convert selfie to base64
    // Convert selfie to base64 (chunked to avoid stack overflow on large images)
    const selfieBytes = new Uint8Array(await selfieFile.arrayBuffer());
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < selfieBytes.length; i += chunkSize) {
      binary += String.fromCharCode(...selfieBytes.slice(i, i + chunkSize));
    }
    const selfieBase64 = btoa(binary);

    const CONFIDENCE_THRESHOLD = 80;
    const BATCH_SIZE = 5;
    const matchedPhotoIds: string[] = [];

    // Process photos in batches
    for (let i = 0; i < photos.length; i += BATCH_SIZE) {
      const batch = photos.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (photo) => {
          const body = new FormData();
          body.append('api_key', FACEPP_API_KEY);
          body.append('api_secret', FACEPP_API_SECRET);
          body.append('image_base64_1', selfieBase64);
          body.append('image_url2', photo.url);

          const res = await fetch('https://api-us.faceplusplus.com/facepp/v3/compare', {
            method: 'POST',
            body,
          });

          if (!res.ok) {
            const text = await res.text();
            console.error(`Face++ error for photo ${photo.id}:`, text);
            return null;
          }

          const json = await res.json();
          return { photoId: photo.id, confidence: json.confidence ?? 0 };
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value && result.value.confidence >= CONFIDENCE_THRESHOLD) {
          matchedPhotoIds.push(result.value.photoId);
        }
      }
    }

    // Build matched photos with URLs for the client
    const matchedPhotos = photos
      .filter(p => matchedPhotoIds.includes(p.id))
      .map(p => ({ id: p.id, url: p.url, file_name: p.file_name ?? null }));

    return new Response(JSON.stringify({ matched_photo_ids: matchedPhotoIds, matched_photos: matchedPhotos }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Face recognition error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
