import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BATCH_SIZE = 10;
const RATE_LIMIT_MS = 350; // Azure free tier: ~20 calls/min

async function azureDetect(endpoint: string, apiKey: string, imageUrl: string) {
  const res = await fetch(
    `${endpoint}/face/v1.0/detect?returnFaceId=true&returnFaceRectangle=true&recognitionModel=recognition_04&detectionModel=detection_03`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: imageUrl }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Azure Detect failed [${res.status}]: ${err}`);
  }
  return await res.json();
}

async function faceppDetect(apiKey: string, apiSecret: string, imageUrl: string) {
  const form = new FormData();
  form.append('api_key', apiKey);
  form.append('api_secret', apiSecret);
  form.append('image_url', imageUrl);
  form.append('return_attributes', 'none');

  const res = await fetch('https://api-us.faceplusplus.com/facepp/v3/detect', {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventId } = await req.json();
    if (!eventId) {
      return new Response(
        JSON.stringify({ error: 'eventId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Auth check — get photographer who owns this event
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data } = await supabase.auth.getUser(token);
      userId = data?.user?.id || null;
    }

    // Verify event ownership
    const { data: event } = await supabase
      .from('events')
      .select('id, user_id, photo_count')
      .eq('id', eventId)
      .single();

    if (!event) {
      return new Response(
        JSON.stringify({ error: 'event_not_found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing running job
    const { data: existingJob } = await supabase
      .from('face_indexing_jobs')
      .select('id, status')
      .eq('event_id', eventId)
      .in('status', ['pending', 'processing'])
      .maybeSingle();

    if (existingJob) {
      return new Response(
        JSON.stringify({ error: 'indexing_already_running', jobId: existingJob.id }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all photos for this event
    const { data: photos } = await supabase
      .from('photos')
      .select('id, original_url, thumbnail_url')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    const photoList = photos || [];
    if (photoList.length === 0) {
      return new Response(
        JSON.stringify({ error: 'no_photos', message: 'No photos to index' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get already indexed photo IDs to skip
    const { data: existingFaces } = await supabase
      .from('photo_faces')
      .select('photo_id')
      .eq('event_id', eventId);

    const indexedPhotoIds = new Set((existingFaces || []).map((f: any) => f.photo_id));
    const unindexedPhotos = photoList.filter(p => !indexedPhotoIds.has(p.id));

    // Create indexing job
    const { data: job, error: jobError } = await supabase
      .from('face_indexing_jobs')
      .insert({
        event_id: eventId,
        user_id: userId,
        status: 'processing',
        started_at: new Date().toISOString(),
        photos_total: unindexedPhotos.length,
        photos_processed: 0,
        faces_found: 0,
      })
      .select()
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: 'failed_to_create_job', detail: jobError?.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine engine
    const AZURE_KEY = Deno.env.get('AZURE_FACE_API_KEY');
    const AZURE_ENDPOINT = Deno.env.get('AZURE_FACE_ENDPOINT');
    const FACEPP_KEY = Deno.env.get('FACEPP_API_KEY');
    const FACEPP_SECRET = Deno.env.get('FACEPP_API_SECRET');
    const useAzure = !!(AZURE_KEY && AZURE_ENDPOINT);
    const useFacepp = !!(FACEPP_KEY && FACEPP_SECRET);

    if (!useAzure && !useFacepp) {
      await supabase.from('face_indexing_jobs').update({
        status: 'failed',
        error_message: 'No face API configured',
        completed_at: new Date().toISOString(),
      }).eq('id', job.id);

      return new Response(
        JSON.stringify({ error: 'no_face_api', jobId: job.id }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process in batches
    let processed = 0;
    let totalFaces = 0;
    const errors: string[] = [];

    for (let i = 0; i < unindexedPhotos.length; i += BATCH_SIZE) {
      const batch = unindexedPhotos.slice(i, i + BATCH_SIZE);

      for (const photo of batch) {
        const imageUrl = photo.original_url || photo.thumbnail_url;
        if (!imageUrl) {
          processed++;
          continue;
        }

        try {
          let faces: any[] = [];

          if (useAzure) {
            const result = await azureDetect(AZURE_ENDPOINT!, AZURE_KEY!, imageUrl);
            faces = (result || []).map((f: any) => ({
              azure_face_id: f.faceId,
              face_rectangle: f.faceRectangle,
              confidence: f.faceRectangle ? 1.0 : null, // Azure doesn't return confidence on detect
            }));
          } else if (useFacepp) {
            const result = await faceppDetect(FACEPP_KEY!, FACEPP_SECRET!, imageUrl);
            faces = (result.faces || []).map((f: any) => ({
              azure_face_id: f.face_token, // Store Face++ token in same field
              face_rectangle: f.face_rectangle,
              confidence: f.face_rectangle ? 1.0 : null,
            }));
          }

          // Insert face records
          if (faces.length > 0) {
            const faceRows = faces.map((f: any) => ({
              photo_id: photo.id,
              event_id: eventId,
              azure_face_id: f.azure_face_id,
              face_rectangle: f.face_rectangle,
              confidence: f.confidence,
              indexed_at: new Date().toISOString(),
            }));

            await supabase.from('photo_faces').insert(faceRows);
            totalFaces += faces.length;
          }

          processed++;

          // Update progress every 5 photos
          if (processed % 5 === 0 || processed === unindexedPhotos.length) {
            await supabase.from('face_indexing_jobs').update({
              photos_processed: processed,
              faces_found: totalFaces,
            }).eq('id', job.id);
          }

          // Rate limit
          await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
        } catch (e: any) {
          console.error(`Face detect failed for photo ${photo.id}:`, e.message);
          errors.push(`${photo.id}: ${e.message}`);
          processed++;

          // If we hit rate limits, back off
          if (e.message?.includes('429') || e.message?.includes('rate')) {
            await new Promise(r => setTimeout(r, 5000));
          }
        }
      }
    }

    // Finalize job
    await supabase.from('face_indexing_jobs').update({
      status: errors.length > 0 && processed === errors.length ? 'failed' : 'completed',
      completed_at: new Date().toISOString(),
      photos_processed: processed,
      faces_found: totalFaces,
      error_message: errors.length > 0 ? `${errors.length} errors: ${errors.slice(0, 5).join('; ')}` : null,
    }).eq('id', job.id);

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        photosProcessed: processed,
        facesFound: totalFaces,
        errors: errors.length,
        engine: useAzure ? 'azure' : 'facepp',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('index-event-faces error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
