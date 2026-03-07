import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { selfieId, eventId } = await req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch selfie record
    const { data: selfie, error: fetchError } = await supabase
      .from('guest_selfies')
      .select('*')
      .eq('id', selfieId)
      .single();

    if (fetchError || !selfie) {
      return new Response(
        JSON.stringify({ error: 'selfie_not_found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imageUrl = selfie.image_url;
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'selfie_url_missing' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabase
      .from('guest_selfies')
      .update({ processing_status: 'processing' })
      .eq('id', selfieId);

    const FACEPP_API_KEY = Deno.env.get('FACEPP_API_KEY');
    const FACEPP_API_SECRET = Deno.env.get('FACEPP_API_SECRET');

    // If Face++ is not configured, fall back to returning all photos (demo mode)
    if (!FACEPP_API_KEY || !FACEPP_API_SECRET) {
      console.log('Face++ not configured — running in demo mode, returning recent photos');
      const { data: recentPhotos } = await supabase
        .from('photos')
        .select('id')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(12);

      const matchIds = (recentPhotos || []).map((p: any) => p.id);

      await supabase
        .from('guest_selfies')
        .update({ processing_status: 'completed', match_results: matchIds })
        .eq('id', selfieId);

      return new Response(
        JSON.stringify({ success: true, mode: 'demo', matches: matchIds.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Step 1: Detect face in selfie using Face++ ──
    const detectForm = new FormData();
    detectForm.append('api_key', FACEPP_API_KEY);
    detectForm.append('api_secret', FACEPP_API_SECRET);
    detectForm.append('image_url', imageUrl);

    const detectRes = await fetch('https://api-us.faceplusplus.com/facepp/v3/detect', {
      method: 'POST',
      body: detectForm,
    });
    const detectData = await detectRes.json();

    if (!detectData.faces || detectData.faces.length === 0) {
      await supabase
        .from('guest_selfies')
        .update({ processing_status: 'completed', match_results: [] })
        .eq('id', selfieId);

      return new Response(
        JSON.stringify({ success: true, matches: 0, reason: 'no_face_detected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const selfieFaceToken = detectData.faces[0].face_token;

    // ── Step 2: Get indexed faces for this event ──
    const { data: indexedFaces } = await supabase
      .from('photo_faces')
      .select('photo_id, azure_face_id')
      .eq('event_id', eventId)
      .not('azure_face_id', 'is', null);

    if (!indexedFaces || indexedFaces.length === 0) {
      // No indexed faces — try to detect faces in event photos on-the-fly (limited)
      const { data: eventPhotos } = await supabase
        .from('photos')
        .select('id, url')
        .eq('event_id', eventId)
        .limit(100);

      const matchedPhotoIds: string[] = [];

      for (const photo of (eventPhotos || [])) {
        try {
          const compareForm = new FormData();
          compareForm.append('api_key', FACEPP_API_KEY);
          compareForm.append('api_secret', FACEPP_API_SECRET);
          compareForm.append('face_token1', selfieFaceToken);
          compareForm.append('image_url2', photo.url);

          const compareRes = await fetch('https://api-us.faceplusplus.com/facepp/v3/compare', {
            method: 'POST',
            body: compareForm,
          });
          const compareData = await compareRes.json();

          if (compareData.confidence && compareData.confidence >= 70) {
            matchedPhotoIds.push(photo.id);
          }

          // Rate limit — Face++ free tier
          await new Promise(r => setTimeout(r, 200));
        } catch (e) {
          console.error(`Compare failed for photo ${photo.id}:`, e);
        }
      }

      await supabase
        .from('guest_selfies')
        .update({ processing_status: 'completed', match_results: matchedPhotoIds })
        .eq('id', selfieId);

      return new Response(
        JSON.stringify({ success: true, matches: matchedPhotoIds.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Step 3: Compare selfie with indexed faces ──
    const matchedPhotoIds: string[] = [];
    const seen = new Set<string>();

    for (const face of indexedFaces) {
      if (seen.has(face.photo_id)) continue;
      try {
        const compareForm = new FormData();
        compareForm.append('api_key', FACEPP_API_KEY);
        compareForm.append('api_secret', FACEPP_API_SECRET);
        compareForm.append('face_token1', selfieFaceToken);
        compareForm.append('face_token2', face.azure_face_id!);

        const compareRes = await fetch('https://api-us.faceplusplus.com/facepp/v3/compare', {
          method: 'POST',
          body: compareForm,
        });
        const compareData = await compareRes.json();

        if (compareData.confidence && compareData.confidence >= 70) {
          matchedPhotoIds.push(face.photo_id);
          seen.add(face.photo_id);
        }

        await new Promise(r => setTimeout(r, 100));
      } catch (e) {
        console.error(`Compare failed for face ${face.azure_face_id}:`, e);
      }
    }

    await supabase
      .from('guest_selfies')
      .update({ processing_status: 'completed', match_results: matchedPhotoIds })
      .eq('id', selfieId);

    return new Response(
      JSON.stringify({ success: true, matches: matchedPhotoIds.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('process-guest-selfie error:', error);

    // Try to mark as failed
    try {
      const { selfieId } = await new Response(error.message).json().catch(() => ({}));
    } catch {}

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
