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
    const { event_id } = await req.json();
    if (!event_id) {
      return new Response(JSON.stringify({ error: 'event_id is required' }), {
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get event info
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name, slug, face_recognition_enabled')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!event.face_recognition_enabled) {
      return new Response(JSON.stringify({ message: 'Face recognition not enabled, skipping' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all pending guest registrations for this event
    const { data: guests, error: guestsError } = await supabase
      .from('guest_registrations')
      .select('*')
      .eq('event_id', event_id)
      .eq('status', 'pending');

    if (guestsError || !guests || guests.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending guests to process' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all photos for the event
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('id, url')
      .eq('event_id', event_id);

    if (photosError || !photos || photos.length === 0) {
      return new Response(JSON.stringify({ message: 'No photos to match against' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const CONFIDENCE_THRESHOLD = 80;
    const BATCH_SIZE = 5;
    const results: { guest_id: string; guest_name: string; email: string; matched: string[] }[] = [];

    for (const guest of guests) {
      const matchedPhotoIds: string[] = [];

      // Compare guest face_token against each photo
      for (let i = 0; i < photos.length; i += BATCH_SIZE) {
        const batch = photos.slice(i, i + BATCH_SIZE);

        const batchResults = await Promise.allSettled(
          batch.map(async (photo) => {
            const body = new FormData();
            body.append('api_key', FACEPP_API_KEY);
            body.append('api_secret', FACEPP_API_SECRET);
            body.append('face_token1', guest.face_token);
            body.append('image_url2', photo.url);

            const res = await fetch('https://api-us.faceplusplus.com/facepp/v3/compare', {
              method: 'POST',
              body,
            });

            if (!res.ok) return null;
            const json = await res.json();
            return { photoId: photo.id, confidence: json.confidence ?? 0 };
          })
        );

        for (const r of batchResults) {
          if (r.status === 'fulfilled' && r.value && r.value.confidence >= CONFIDENCE_THRESHOLD) {
            matchedPhotoIds.push(r.value.photoId);
          }
        }
      }

      if (matchedPhotoIds.length > 0) {
        // Update guest registration with matched photos
        await supabase
          .from('guest_registrations')
          .update({
            matched_photo_ids: matchedPhotoIds,
            status: 'notified',
          })
          .eq('id', guest.id);

        results.push({
          guest_id: guest.id,
          guest_name: guest.guest_name,
          email: guest.email,
          matched: matchedPhotoIds,
        });

        // Send email notification via Supabase Auth admin
        // We use the Supabase project's configured SMTP to send a magic link style email
        // Since we can't directly send custom SMTP from edge functions without a library,
        // we'll use a simple fetch to a mail API or construct the email content
        
        const siteUrl = Deno.env.get('SITE_URL') || 'https://moment-reflections-suite.lovable.app';
        const galleryLink = `${siteUrl}/event/${event.slug}/gallery?guest=${guest.id}`;

        // Send email using Supabase's built-in email via admin API
        // We invoke the auth.admin.generateLink then send via SMTP
        // Alternative: use the project's SMTP directly
        
        try {
          // Use fetch to send via Supabase's internal mail endpoint
          const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background-color:#1a1612;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#c9a96e;font-size:28px;font-weight:300;letter-spacing:2px;margin:0;">MirrorAI</h1>
    </div>
    <div style="background-color:#231f1b;border:1px solid #352f28;border-radius:8px;padding:32px 24px;">
      <h2 style="color:#f5f0e8;font-size:20px;font-weight:400;margin:0 0 16px;">Your photos are ready! 📸</h2>
      <p style="color:#a89a85;font-size:14px;line-height:1.6;margin:0 0 8px;">
        Hi ${guest.guest_name},
      </p>
      <p style="color:#a89a85;font-size:14px;line-height:1.6;margin:0 0 24px;">
        We found <strong style="color:#c9a96e;">${matchedPhotoIds.length} photo${matchedPhotoIds.length > 1 ? 's' : ''}</strong> of you at <strong style="color:#f5f0e8;">${event.name}</strong>! Click the button below to view and download them.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${galleryLink}" style="display:inline-block;background-color:#c9a96e;color:#1a1612;text-decoration:none;padding:12px 32px;font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;border-radius:4px;">
          View My Photos
        </a>
      </div>
      <p style="color:#6b5e50;font-size:11px;line-height:1.5;margin:24px 0 0;text-align:center;">
        This link is unique to you. Your photos were matched using AI face recognition.
      </p>
    </div>
    <div style="text-align:center;margin-top:24px;">
      <p style="color:#4a4038;font-size:10px;letter-spacing:1px;text-transform:uppercase;">
        Powered by MirrorAI · Your privacy matters
      </p>
    </div>
  </div>
</body>
</html>`;

          // Use Supabase's internal SMTP by calling the auth admin API to send a custom email
          // Since Supabase doesn't expose a direct "send email" endpoint,
          // we use the SMTP credentials directly with Deno's smtp module
          const SMTP_HOST = Deno.env.get('SMTP_HOST');
          const SMTP_PORT = Deno.env.get('SMTP_PORT') || '587';
          const SMTP_USER = Deno.env.get('SMTP_USER');
          const SMTP_PASS = Deno.env.get('SMTP_PASS');
          const SMTP_FROM = Deno.env.get('SMTP_FROM') || 'noreply@mirrorai.app';

          if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
            // Connect to SMTP and send email
            const conn = await Deno.connect({
              hostname: SMTP_HOST,
              port: parseInt(SMTP_PORT),
            });

            const encoder = new TextEncoder();
            const decoder = new TextDecoder();

            async function readResponse(): Promise<string> {
              const buf = new Uint8Array(1024);
              const n = await conn.read(buf);
              return decoder.decode(buf.subarray(0, n || 0));
            }

            async function sendCommand(cmd: string): Promise<string> {
              await conn.write(encoder.encode(cmd + '\r\n'));
              return await readResponse();
            }

            // SMTP conversation
            await readResponse(); // greeting
            await sendCommand(`EHLO localhost`);
            
            // STARTTLS if port 587
            if (SMTP_PORT === '587') {
              await sendCommand('STARTTLS');
              // Upgrade to TLS
              const tlsConn = await Deno.startTls(conn, { hostname: SMTP_HOST });
              
              const tlsEncoder = new TextEncoder();
              const tlsDecoder = new TextDecoder();
              
              async function tlsRead(): Promise<string> {
                const buf = new Uint8Array(4096);
                const n = await tlsConn.read(buf);
                return tlsDecoder.decode(buf.subarray(0, n || 0));
              }
              
              async function tlsSend(cmd: string): Promise<string> {
                await tlsConn.write(tlsEncoder.encode(cmd + '\r\n'));
                return await tlsRead();
              }
              
              await tlsSend('EHLO localhost');
              // AUTH LOGIN
              await tlsSend('AUTH LOGIN');
              await tlsSend(btoa(SMTP_USER));
              await tlsSend(btoa(SMTP_PASS));
              // MAIL FROM
              await tlsSend(`MAIL FROM:<${SMTP_FROM}>`);
              await tlsSend(`RCPT TO:<${guest.email}>`);
              await tlsSend('DATA');
              
              const emailMessage = [
                `From: MirrorAI <${SMTP_FROM}>`,
                `To: ${guest.email}`,
                `Subject: Your photos from ${event.name} are ready! 📸`,
                `MIME-Version: 1.0`,
                `Content-Type: text/html; charset=utf-8`,
                ``,
                emailHtml,
                `.`,
              ].join('\r\n');
              
              await tlsSend(emailMessage);
              await tlsSend('QUIT');
              tlsConn.close();
            } else {
              // Plain SMTP (port 25 or 465)
              await sendCommand('AUTH LOGIN');
              await sendCommand(btoa(SMTP_USER));
              await sendCommand(btoa(SMTP_PASS));
              await sendCommand(`MAIL FROM:<${SMTP_FROM}>`);
              await sendCommand(`RCPT TO:<${guest.email}>`);
              await sendCommand('DATA');
              
              const emailMessage = [
                `From: MirrorAI <${SMTP_FROM}>`,
                `To: ${guest.email}`,
                `Subject: Your photos from ${event.name} are ready! 📸`,
                `MIME-Version: 1.0`,
                `Content-Type: text/html; charset=utf-8`,
                ``,
                emailHtml,
                `.`,
              ].join('\r\n');
              
              await sendCommand(emailMessage);
              await sendCommand('QUIT');
              conn.close();
            }

            console.log(`Email sent to ${guest.email}`);
          } else {
            console.warn('SMTP not configured, skipping email send for', guest.email);
          }
        } catch (emailErr) {
          console.error(`Failed to send email to ${guest.email}:`, emailErr);
        }
      }
    }

    return new Response(JSON.stringify({ 
      message: `Processed ${guests.length} guests, notified ${results.length}`,
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('notify-guests error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
