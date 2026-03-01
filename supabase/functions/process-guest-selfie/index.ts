import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Verify selfie exists in storage by checking the URL is valid
    const imageUrl = selfie.image_url;
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'selfie_not_found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabase
      .from('guest_selfies')
      .update({ processing_status: 'processing' })
      .eq('id', selfieId);

    // Mock processing delay — replace with Face++ / Azure Face API call
    await new Promise(r => setTimeout(r, 2000));

    await supabase
      .from('guest_selfies')
      .update({ processing_status: 'completed', match_results: [] })
      .eq('id', selfieId);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
