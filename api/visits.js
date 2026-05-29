export const config = { runtime: 'edge' };

// Constant-time string comparison to mitigate timing attacks.
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let body = {};
  try { body = await request.json(); } catch (e) {}
  const password = body.password || '';
  const expected = process.env.ADMIN_PASSWORD || '';

  if (!expected || !safeEqual(password, expected)) {
    // Small delay to discourage brute force from the function side.
    await new Promise((r) => setTimeout(r, 400));
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Supabase env vars not set' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const limit = Math.min(parseInt(body.limit || '500', 10) || 500, 2000);

  const resp = await fetch(
    `${supabaseUrl}/rest/v1/visits?select=id,created_at,page,ip_hash,country,region,city,user_agent,referrer&order=created_at.desc&limit=${limit}`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: 'Bearer ' + supabaseKey,
      },
    }
  );

  if (!resp.ok) {
    const txt = await resp.text();
    return new Response(
      JSON.stringify({ ok: false, status: resp.status, error: txt.slice(0, 300) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const visits = await resp.json();
  return new Response(JSON.stringify({ ok: true, visits }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
