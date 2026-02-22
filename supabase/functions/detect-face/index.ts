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

    if (!selfieFile) {
      return new Response(JSON.stringify({ error: 'selfie is required' }), {
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

    // Convert selfie to base64
    const selfieBytes = new Uint8Array(await selfieFile.arrayBuffer());
    const selfieBase64 = btoa(String.fromCharCode(...selfieBytes));

    // Call Face++ detect to get face_token
    const body = new FormData();
    body.append('api_key', FACEPP_API_KEY);
    body.append('api_secret', FACEPP_API_SECRET);
    body.append('image_base64', selfieBase64);

    const res = await fetch('https://api-us.faceplusplus.com/facepp/v3/detect', {
      method: 'POST',
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Face++ detect error:', text);
      return new Response(JSON.stringify({ error: 'Face detection failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const json = await res.json();
    const faces = json.faces || [];

    if (faces.length === 0) {
      return new Response(JSON.stringify({ error: 'No face detected. Please try again with a clearer photo.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const faceToken = faces[0].face_token;

    return new Response(JSON.stringify({ face_token: faceToken }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('detect-face error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
