import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function azureDetect(endpoint: string, apiKey: string, imageUrl: string) {
  const res = await fetch(`${endpoint}/face/v1.0/detect?returnFaceId=true&recognitionModel=recognition_04&detectionModel=detection_03`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url: imageUrl }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Azure Detect failed [${res.status}]: ${err}`);
  }
  return await res.json();
}

async function azureFindSimilar(endpoint: string, apiKey: string, faceId: string, faceIds: string[]) {
  const res = await fetch(`${endpoint}/face/v1.0/findsimilars`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      faceId,
      faceIds,
      maxNumOfCandidatesReturned: faceIds.length,
      mode: 'matchPerson',
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Azure FindSimilar failed [${res.status}]: ${err}`);
  }
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

    const AZURE_KEY = Deno.env.get('AZURE_FACE_API_KEY');
    const AZURE_ENDPOINT = Deno.env.get('AZURE_FACE_ENDPOINT');
    const FACEPP_KEY = Deno.env.get('FACEPP_API_KEY');
    const FACEPP_SECRET = Deno.env.get('FACEPP_API_SECRET');

    // ── Try Azure Face API first ──
    if (AZURE_KEY && AZURE_ENDPOINT) {
      try {
        // Detect face in selfie
        const detectResult = await azureDetect(AZURE_ENDPOINT, AZURE_KEY, imageUrl);
        if (!detectResult || detectResult.length === 0) {
          await supabase.from('guest_selfies').update({ processing_status: 'completed', match_results: [] }).eq('id', selfieId);
          return new Response(JSON.stringify({ success: true, matches: 0, reason: 'no_face_detected' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const selfieFaceId = detectResult[0].faceId;

        // Check for pre-indexed faces
        const { data: indexedFaces } = await supabase
          .from('photo_faces')
          .select('photo_id, azure_face_id')
          .eq('event_id', eventId)
          .not('azure_face_id', 'is', null);

        if (indexedFaces && indexedFaces.length > 0) {
          // Use FindSimilar with indexed face IDs
          // Azure faceIds expire after 24h, so we may need to re-detect
          const faceTokens = indexedFaces.map((f: any) => f.azure_face_id);
          const faceToPhoto = new Map<string, string>();
          indexedFaces.forEach((f: any) => faceToPhoto.set(f.azure_face_id, f.photo_id));

          // Batch in groups of 1000 (Azure limit)
          const matchedPhotoIds: string[] = [];
          for (let i = 0; i < faceTokens.length; i += 1000) {
            const batch = faceTokens.slice(i, i + 1000);
            try {
              const similar = await azureFindSimilar(AZURE_ENDPOINT, AZURE_KEY, selfieFaceId, batch);
              for (const match of similar) {
                if (match.confidence >= 0.6) {
                  const photoId = faceToPhoto.get(match.faceId);
                  if (photoId) matchedPhotoIds.push(photoId);
                }
              }
            } catch (e) {
              console.error('FindSimilar batch error:', e);
            }
          }

          const unique = [...new Set(matchedPhotoIds)];
          await supabase.from('guest_selfies').update({ processing_status: 'completed', match_results: unique }).eq('id', selfieId);
          return new Response(JSON.stringify({ success: true, matches: unique.length, engine: 'azure' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // No indexed faces — detect on-the-fly for up to 50 photos
        const { data: eventPhotos } = await supabase
          .from('photos')
          .select('id, url')
          .eq('event_id', eventId)
          .limit(50);

        const matchedPhotoIds: string[] = [];
        for (const photo of (eventPhotos || [])) {
          try {
            const photoFaces = await azureDetect(AZURE_ENDPOINT, AZURE_KEY, photo.url);
            if (photoFaces && photoFaces.length > 0) {
              const photoFaceIds = photoFaces.map((f: any) => f.faceId);
              const similar = await azureFindSimilar(AZURE_ENDPOINT, AZURE_KEY, selfieFaceId, photoFaceIds);
              for (const match of similar) {
                if (match.confidence >= 0.6) {
                  matchedPhotoIds.push(photo.id);
                  break;
                }
              }
            }
            // Rate limiting
            await new Promise(r => setTimeout(r, 350));
          } catch (e) {
            console.error(`Azure detect/compare failed for photo ${photo.id}:`, e);
          }
        }

        const unique = [...new Set(matchedPhotoIds)];
        await supabase.from('guest_selfies').update({ processing_status: 'completed', match_results: unique }).eq('id', selfieId);
        return new Response(JSON.stringify({ success: true, matches: unique.length, engine: 'azure-live' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      } catch (azureErr) {
        console.error('Azure Face API error, falling back:', azureErr);
      }
    }

    // ── Fallback: Face++ ──
    if (FACEPP_KEY && FACEPP_SECRET) {
      const detectForm = new FormData();
      detectForm.append('api_key', FACEPP_KEY);
      detectForm.append('api_secret', FACEPP_SECRET);
      detectForm.append('image_url', imageUrl);

      const detectRes = await fetch('https://api-us.faceplusplus.com/facepp/v3/detect', { method: 'POST', body: detectForm });
      const detectData = await detectRes.json();

      if (!detectData.faces || detectData.faces.length === 0) {
        await supabase.from('guest_selfies').update({ processing_status: 'completed', match_results: [] }).eq('id', selfieId);
        return new Response(JSON.stringify({ success: true, matches: 0, reason: 'no_face_detected' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const selfieFaceToken = detectData.faces[0].face_token;
      const { data: eventPhotos } = await supabase
        .from('photos').select('id, url').eq('event_id', eventId).limit(100);

      const matchedPhotoIds: string[] = [];
      for (const photo of (eventPhotos || [])) {
        try {
          const cForm = new FormData();
          cForm.append('api_key', FACEPP_KEY);
          cForm.append('api_secret', FACEPP_SECRET);
          cForm.append('face_token1', selfieFaceToken);
          cForm.append('image_url2', photo.url);

          const cRes = await fetch('https://api-us.faceplusplus.com/facepp/v3/compare', { method: 'POST', body: cForm });
          const cData = await cRes.json();
          if (cData.confidence && cData.confidence >= 70) matchedPhotoIds.push(photo.id);
          await new Promise(r => setTimeout(r, 200));
        } catch (e) {
          console.error(`Face++ compare failed for ${photo.id}:`, e);
        }
      }

      await supabase.from('guest_selfies').update({ processing_status: 'completed', match_results: matchedPhotoIds }).eq('id', selfieId);
      return new Response(JSON.stringify({ success: true, matches: matchedPhotoIds.length, engine: 'facepp' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── No API configured — demo mode ──
    console.log('No face API configured — demo mode');
    const { data: recentPhotos } = await supabase
      .from('photos').select('id').eq('event_id', eventId)
      .order('created_at', { ascending: false }).limit(12);

    const matchIds = (recentPhotos || []).map((p: any) => p.id);
    await supabase.from('guest_selfies').update({ processing_status: 'completed', match_results: matchIds }).eq('id', selfieId);
    return new Response(JSON.stringify({ success: true, mode: 'demo', matches: matchIds.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('process-guest-selfie error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
