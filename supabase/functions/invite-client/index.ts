import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify caller is authenticated photographer
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { name, email, phone, photographer_id, event_id, password } = await req.json();

    if (!name || !email || !photographer_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify caller is the photographer
    if (caller.id !== photographer_id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u: any) => u.email === email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      // Check if already a client
      const { data: existingClient } = await supabaseAdmin.from('clients').select('id').eq('user_id', userId).single();
      if (existingClient) {
        // Just assign event if provided
        if (event_id) {
          await supabaseAdmin.from('client_events').upsert({ client_id: existingClient.id, event_id }, { onConflict: 'client_id,event_id' });
        }
        return new Response(JSON.stringify({ success: true, client_id: existingClient.id, existing: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name },
      });
      if (createError) throw createError;
      userId = newUser.user.id;
    }

    // Assign client role
    await supabaseAdmin.from('user_roles').upsert({ user_id: userId, role: 'client' }, { onConflict: 'user_id,role' });

    // Create client record
    const { data: client, error: clientError } = await supabaseAdmin.from('clients').insert({
      user_id: userId,
      photographer_id,
      event_id: event_id || null,
      name,
      email,
      phone: phone || null,
    }).select('id').single();

    if (clientError) throw clientError;

    // Assign event access
    if (event_id && client) {
      await supabaseAdmin.from('client_events').insert({ client_id: client.id, event_id });
    }

    // Notify photographer
    await supabaseAdmin.from('notifications').insert({
      user_id: photographer_id,
      type: 'client_invited',
      title: 'Client invited',
      message: `${name} has been invited to the client portal.`,
    });

    return new Response(JSON.stringify({ success: true, client_id: client.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
