export const config = { runtime: 'edge' };

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function safe(s, n = 500) {
  if (!s) return null;
  return String(s).slice(0, n);
}

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const fwd = request.headers.get('x-forwarded-for') || '';
  const ip = fwd.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';

  const country = request.headers.get('x-vercel-ip-country') || null;
  const region = request.headers.get('x-vercel-ip-country-region') || null;
  let city = request.headers.get('x-vercel-ip-city') || null;
  if (city) {
    try { city = decodeURIComponent(city); } catch (e) {}
  }

  let body = {};
  try { body = await request.json(); } catch (e) {}

  const page = safe(body.page) || safe(request.headers.get('referer')) || '/';
  const referrer = safe(body.referrer);
  const ua = safe(request.headers.get('user-agent'));

  const secret = process.env.IP_HASH_SECRET || '';
  const ipHash = await sha256Hex(secret + '|' + ip);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Supabase env vars not set' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const insert = await fetch(supabaseUrl + '/rest/v1/visits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: 'Bearer ' + supabaseKey,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      page,
      ip_hash: ipHash,
      country,
      region,
      city,
      user_agent: ua,
      referrer,
    }),
  });

  if (!insert.ok) {
    const txt = await insert.text();
    return new Response(
      JSON.stringify({ ok: false, status: insert.status, error: txt.slice(0, 300) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
