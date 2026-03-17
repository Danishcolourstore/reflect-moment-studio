import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AZURE_BATCH_LIMIT = 1000;
const FACEPP_CONFIDENCE_THRESHOLD = 70;
const AZURE_CONFIDENCE_THRESHOLD = 0.6;

async function azureDetect(endpoint: string, apiKey: string, imageUrl: string) {
  const res = await fetch(
    `${endpoint}/face/v1.0/detect?returnFaceId=true&recognitionModel=recognition_04&detectionModel=detection_03`,
    {
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: imageUrl }),
    }
  );
  if (!res.ok) throw new Error(`Azure Detect [${res.status}]: ${await res.text()}`);
  return await res.json();
}

async function azureFindSimilar(endpoint: string, apiKey: string, faceId: string, faceIds: string[]) {
  const res = await fetch(`${endpoint}/face/v1.0/findsimilars`, {
    method: 'POST',
    headers: { 'Ocp-Apim-Subscription-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ faceId, faceIds, maxNumOfCandidatesReturned: faceIds.length, mode: 'matchPerson' }),
  });
  if (!res.ok) throw new Error(`Azure FindSimilar [${res.status}]: ${await res.text()}`);
  return await res.json();
}

async function faceppCompare(apiKey: string, apiSecret: string, faceToken1: string, imageUrl2: string) {
  const form = new FormData();
  form.append('api_key', apiKey);
  form.append('api_secret', apiSecret);
  form.append('face_token1', faceToken1);
  form.append('image_url2', imageUrl2);
  const res = await fetch('https://api-us.faceplusplus.com/facepp/v3/compare', { method: 'POST', body: form });
  return await res.json();
}

async function faceppDetect(apiKey: string, apiSecret: string, imageUrl: string) {
  const form = new FormData();
  form.append('api_key', apiKey);
  form.append('api_secret', apiSecret);
  form.append('image_url', imageUrl);
  const res = await fetch('https://api-us.faceplusplus.com/facepp/v3/detect', { method: 'POST', body: form });
  return await res.json();
}

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

    // Get selfie record
    const { data: selfie, error: fetchError } = await supabase
      .from('guest_selfies')
      .select('*')
      .eq('id', selfieId)
      .single();

    if (fetchError || !selfie) {
      return new Response(JSON.stringify({ error: 'selfie_not_found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const imageUrl = selfie.image_url;
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: 'selfie_url_missing' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    await supabase.from('guest_selfies').update({ processing_status: 'processing' }).eq('id', selfieId);

    const AZURE_KEY = Deno.env.get('AZURE_FACE_API_KEY');
    const AZURE_ENDPOINT = Deno.env.get('AZURE_FACE_ENDPOINT');
    const FACEPP_KEY = Deno.env.get('FACEPP_API_KEY');
    const FACEPP_SECRET = Deno.env.get('FACEPP_API_SECRET');

    // ── STRATEGY 1: Azure with pre-indexed faces ──
    if (AZURE_KEY && AZURE_ENDPOINT) {
      try {
        const detectResult = await azureDetect(AZURE_ENDPOINT, AZURE_KEY, imageUrl);
        if (!detectResult?.length) {
          await supabase.from('guest_selfies').update({ processing_status: 'completed', match_results: [] }).eq('id', selfieId);
          return new Response(JSON.stringify({ success: true, matches: 0, reason: 'no_face_detected' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const selfieFaceId = detectResult[0].faceId;

        // Check for pre-indexed faces (from batch indexing)
        const { data: indexedFaces } = await supabase
          .from('photo_faces')
          .select('photo_id, azure_face_id')
          .eq('event_id', eventId)
          .not('azure_face_id', 'is', null);

        if (indexedFaces && indexedFaces.length > 0) {
          // Try FindSimilar with indexed tokens
          // Note: Azure faceIds expire in 24h, so some may fail
          const faceToPhoto = new Map<string, string>();
          indexedFaces.forEach((f: any) => faceToPhoto.set(f.azure_face_id, f.photo_id));
          const faceTokens = indexedFaces.map((f: any) => f.azure_face_id);

          const matchedPhotoIds: string[] = [];
          let indexedWorked = false;

          for (let i = 0; i < faceTokens.length; i += AZURE_BATCH_LIMIT) {
            const batch = faceTokens.slice(i, i + AZURE_BATCH_LIMIT);
            try {
              const similar = await azureFindSimilar(AZURE_ENDPOINT, AZURE_KEY, selfieFaceId, batch);
              indexedWorked = true;
              for (const match of similar) {
                if (match.confidence >= AZURE_CONFIDENCE_THRESHOLD) {
                  const photoId = faceToPhoto.get(match.faceId);
                  if (photoId) matchedPhotoIds.push(photoId);
                }
              }
            } catch (e: any) {
              console.warn('FindSimilar batch error (tokens may be expired):', e.message);
              // If tokens expired, fall through to live detection
            }
          }

          if (indexedWorked) {
            const unique = [...new Set(matchedPhotoIds)];
            await supabase.from('guest_selfies').update({ processing_status: 'completed', match_results: unique }).eq('id', selfieId);
            return new Response(JSON.stringify({ success: true, matches: unique.length, engine: 'azure-indexed' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }

        // FALLBACK: Live detection — only for photos WITH faces (from index) or limited set
        const { data: photosWithFaces } = await supabase
          .from('photo_faces')
          .select('photo_id')
          .eq('event_id', eventId);

        let photoIdsToScan: string[];
        if (photosWithFaces && photosWithFaces.length > 0) {
          // Only scan photos we know have faces
          photoIdsToScan = [...new Set(photosWithFaces.map((f: any) => f.photo_id))];
        } else {
          // No index at all — scan up to 100 photos
          const { data: eventPhotos } = await supabase
            .from('photos')
            .select('id')
            .eq('event_id', eventId)
            .limit(100);
          photoIdsToScan = (eventPhotos || []).map((p: any) => p.id);
        }

        // Fetch photo URLs
        const { data: photosToScan } = await supabase
          .from('photos')
          .select('id, original_url, thumbnail_url')
          .in('id', photoIdsToScan.slice(0, 200));

        const matchedPhotoIds: string[] = [];
        for (const photo of (photosToScan || [])) {
          try {
            const url = photo.thumbnail_url || photo.original_url;
            const photoFaces = await azureDetect(AZURE_ENDPOINT, AZURE_KEY, url);
            if (photoFaces?.length > 0) {
              const photoFaceIds = photoFaces.map((f: any) => f.faceId);
              const similar = await azureFindSimilar(AZURE_ENDPOINT, AZURE_KEY, selfieFaceId, photoFaceIds);
              for (const match of similar) {
                if (match.confidence >= AZURE_CONFIDENCE_THRESHOLD) {
                  matchedPhotoIds.push(photo.id);
                  break;
                }
              }
            }
            await new Promise(r => setTimeout(r, 350));
          } catch (e: any) {
            console.error(`Azure live scan failed for ${photo.id}:`, e.message);
          }
        }

        const unique = [...new Set(matchedPhotoIds)];
        await supabase.from('guest_selfies').update({ processing_status: 'completed', match_results: unique }).eq('id', selfieId);
        return new Response(JSON.stringify({ success: true, matches: unique.length, engine: 'azure-live' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      } catch (azureErr: any) {
        console.error('Azure Face API error, falling back:', azureErr.message);
      }
    }

    // ── STRATEGY 2: Face++ fallback ──
    if (FACEPP_KEY && FACEPP_SECRET) {
      const detectData = await faceppDetect(FACEPP_KEY, FACEPP_SECRET, imageUrl);

      if (!detectData.faces?.length) {
        await supabase.from('guest_selfies').update({ processing_status: 'completed', match_results: [] }).eq('id', selfieId);
        return new Response(JSON.stringify({ success: true, matches: 0, reason: 'no_face_detected' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const selfieFaceToken = detectData.faces[0].face_token;

      // Check indexed faces first
      const { data: indexedFaces } = await supabase
        .from('photo_faces')
        .select('photo_id, azure_face_id')
        .eq('event_id', eventId)
        .not('azure_face_id', 'is', null);

      let photoIdsToScan: string[];
      if (indexedFaces && indexedFaces.length > 0) {
        photoIdsToScan = [...new Set(indexedFaces.map((f: any) => f.photo_id))];
      } else {
        const { data: eventPhotos } = await supabase
          .from('photos').select('id').eq('event_id', eventId).limit(100);
        photoIdsToScan = (eventPhotos || []).map((p: any) => p.id);
      }

      const { data: photosToScan } = await supabase
        .from('photos')
        .select('id, original_url, thumbnail_url')
        .in('id', photoIdsToScan.slice(0, 200));

      const matchedPhotoIds: string[] = [];
      for (const photo of (photosToScan || [])) {
        try {
          const url = photo.thumbnail_url || photo.original_url;
          const cData = await faceppCompare(FACEPP_KEY, FACEPP_SECRET, selfieFaceToken, url);
          if (cData.confidence && cData.confidence >= FACEPP_CONFIDENCE_THRESHOLD) {
            matchedPhotoIds.push(photo.id);
          }
          await new Promise(r => setTimeout(r, 200));
        } catch (e: any) {
          console.error(`Face++ compare failed for ${photo.id}:`, e.message);
        }
      }

      await supabase.from('guest_selfies').update({ processing_status: 'completed', match_results: matchedPhotoIds }).eq('id', selfieId);
      return new Response(JSON.stringify({ success: true, matches: matchedPhotoIds.length, engine: 'facepp' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── STRATEGY 3: Demo mode ──
    console.log('No face API configured — demo mode');
    const { data: recentPhotos } = await supabase
      .from('photos').select('id').eq('event_id', eventId)
      .order('created_at', { ascending: false }).limit(12);

    const matchIds = (recentPhotos || []).map((p: any) => p.id);
    await supabase.from('guest_selfies').update({ processing_status: 'completed', match_results: matchIds }).eq('id', selfieId);
    return new Response(JSON.stringify({ success: true, mode: 'demo', matches: matchIds.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('process-guest-selfie error:', error);
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
