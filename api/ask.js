export const config = { runtime: 'edge' };

// Server side of yiwen.bio/ask — a chat over the Obsidian vault.
//
// The vault itself never leaves the Mac Mini. That box runs
// ~/kb-retrieval/server.py on 127.0.0.1:8787, published through a Tailscale
// Funnel, and only returns the handful of excerpts that match a query. This
// function is the only thing that knows the Mini's secret and the OpenAI key;
// the browser sees neither.
//
// Provenance is the whole point of the page: the owner wants to know whether an
// answer came from their own notes or from the model's general knowledge. That
// separation is enforced structurally rather than by asking the model nicely --
// 'ask' is grounded in retrieved excerpts, 'outside' is a SEPARATE request that
// is never given those excerpts, so it cannot quietly launder vault content into
// what is labelled as outside knowledge.
//
// IMPORTANT: this file and ask.html must stay in the git repo. They previously
// existed only inside a Vercel deployment, so the next git-triggered deploy
// shipped a tree without them and took /ask down with a 404.

const DEFAULT_ENDPOINT = 'https://mac-mini.taile4a609.ts.net';
const DEFAULT_MODEL = 'gpt-5.1';
const COOKIE_NAME = 'kb_session';
const SESSION_DAYS = 90;
const MAX_ANSWER_TOKENS = 1500;
const MAX_QUESTION = 2000;

const json = (body, init = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function hmacHex(key, msg) {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey(
    'raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(msg));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// The session token is signed with the password itself, so changing
// KB_PASSWORD silently invalidates every device that was still logged in.
async function mintToken(password) {
  const exp = Date.now() + SESSION_DAYS * 864e5;
  return exp + '.' + (await hmacHex(password, 'kb-session|' + exp));
}

async function tokenValid(token, password) {
  if (!token || !password) return false;
  const dot = token.indexOf('.');
  if (dot < 1) return false;
  const exp = Number(token.slice(0, dot));
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const want = await hmacHex(password, 'kb-session|' + exp);
  return safeEqual(token.slice(dot + 1), want);
}

function readCookie(request, name) {
  const raw = request.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return '';
}

function sessionCookie(token) {
  return `${COOKIE_NAME}=${token}; Path=/; Max-Age=${SESSION_DAYS * 86400}` +
    '; HttpOnly; Secure; SameSite=Lax';
}

// The original /ask used KB_ASK_PASSWORD / KB_RETRIEVE_SECRET / KB_RETRIEVE_URL
// and those values are still set on the project. Read them first so nothing has
// to be re-entered, and accept the shorter names as aliases.
function env() {
  const e = {
    password: process.env.KB_ASK_PASSWORD || process.env.KB_PASSWORD || '',
    secret: process.env.KB_RETRIEVE_SECRET || process.env.KB_SECRET || '',
    openai: process.env.OPENAI_API_KEY || '',
    endpoint: (process.env.KB_RETRIEVE_URL || process.env.KB_ENDPOINT ||
      DEFAULT_ENDPOINT).replace(/\/+$/, ''),
    model: process.env.KB_MODEL || DEFAULT_MODEL,
  };
  const missing = [];
  if (!e.password) missing.push('KB_ASK_PASSWORD');
  if (!e.secret) missing.push('KB_RETRIEVE_SECRET');
  if (!e.openai) missing.push('OPENAI_API_KEY');
  e.missing = missing;
  return e;
}

async function openaiChat(cfg, system, user) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + cfg.openai,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_completion_tokens: MAX_ANSWER_TOKENS,
    }),
  });
  if (!r.ok) {
    const detail = (await r.text()).slice(0, 300);
    throw new Error(`model ${r.status}: ${detail}`);
  }
  const data = await r.json();
  return data?.choices?.[0]?.message?.content?.trim() || '';
}

const VAULT_SYSTEM =
  "You answer questions about Yiwen (Aya) Wei's personal Obsidian vault, using " +
  'ONLY the excerpts supplied below.\n' +
  'Ground every statement in those excerpts. If they do not cover the question, ' +
  'say so plainly in one line -- do not guess, and do not fall back on general ' +
  'knowledge, because a separate part of this page handles that and the reader ' +
  'must be able to tell the two apart.\n' +
  'Cite the notes you used inline, like [Courses/Learning.md]. Be concrete: ' +
  'names, dates, numbers and links when the notes contain them.';

const OUTSIDE_SYSTEM =
  'You are answering from general knowledge only. You have NOT been given, and ' +
  "must not pretend to have, any access to the reader's personal notes.\n" +
  'The reader keeps their own knowledge base separately and needs to know which ' +
  'claims come from outside it, so never imply that anything here is from their ' +
  'notes. Be accurate and concise; say when something is genuinely uncertain or ' +
  'contested.';

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const cfg = env();
  if (cfg.missing.length) {
    return json({
      ok: false,
      code: 'config',
      error: 'Not configured. Set on Vercel (project: portfolio) → Settings → ' +
        'Environment Variables, then redeploy: ' + cfg.missing.join(', '),
    }, { status: 500 });
  }

  let body = {};
  try { body = await request.json(); } catch (e) {}
  const action = String(body.action || 'ask');

  // --- login: validate immediately -----------------------------------------
  // The previous gate stored whatever was typed and closed without checking, so
  // a wrong password only surfaced as a 401 on the first question. Verify here
  // and tell the reader straight away.
  if (action === 'login') {
    if (!safeEqual(String(body.password || ''), cfg.password)) {
      await new Promise((r) => setTimeout(r, 400)); // slow down guessing
      return json({ ok: false, code: 'bad_password', error: 'Wrong passphrase.' },
        { status: 401 });
    }
    const token = await mintToken(cfg.password);
    return json({ ok: true }, { headers: { 'Set-Cookie': sessionCookie(token) } });
  }

  const authed = await tokenValid(readCookie(request, COOKIE_NAME), cfg.password);

  if (action === 'session') return json({ ok: true, authed });

  if (action === 'logout') {
    return json({ ok: true }, {
      headers: { 'Set-Cookie': `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` },
    });
  }

  if (!authed) {
    return json({ ok: false, code: 'unauthorized', error: 'Session expired. Enter the passphrase again.' },
      { status: 401 });
  }

  const question = String(body.q || '').slice(0, MAX_QUESTION).trim();
  if (!question) return json({ ok: false, error: 'Empty question.' }, { status: 400 });

  // --- outside: general knowledge, deliberately given NO vault context ------
  if (action === 'outside') {
    try {
      const answer = await openaiChat(cfg, OUTSIDE_SYSTEM, question);
      return json({ ok: true, answer });
    } catch (err) {
      return json({ ok: false, error: String(err.message || err).slice(0, 300) },
        { status: 502 });
    }
  }

  // --- ask: retrieve from the vault, then answer grounded in what came back --
  let retrieved;
  try {
    const r = await fetch(cfg.endpoint + '/retrieve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: cfg.secret, q: question }),
    });
    if (r.status === 401) {
      return json({ ok: false, code: 'kb_auth',
        error: 'The retrieval service rejected KB_SECRET. Check it matches ~/kb-retrieval/.secret on the Mac Mini.' },
        { status: 502 });
    }
    if (!r.ok) {
      return json({ ok: false, code: 'kb_error',
        error: `Retrieval service returned ${r.status}.` }, { status: 502 });
    }
    retrieved = await r.json();
  } catch (err) {
    // Almost always the Mini being asleep or the Funnel being down.
    return json({ ok: false, code: 'kb_unreachable',
      error: 'Cannot reach the vault service on the Mac Mini. Is it awake and is ' +
        'the Tailscale Funnel up?' }, { status: 502 });
  }

  const chunks = Array.isArray(retrieved.chunks) ? retrieved.chunks : [];
  const sources = [];
  const seen = new Set();
  for (const c of chunks) {
    if (c && c.p && !seen.has(c.p)) { seen.add(c.p); sources.push(c.p); }
  }

  if (!chunks.length) {
    return json({
      ok: true, found: false, answer: '', sources: [],
      stats: { files: retrieved.files, builtAt: retrieved.builtAt, ms: retrieved.ms },
    });
  }

  const context = chunks
    .map((c) => `### ${c.p}${c.h ? ' — ' + c.h : ''}\n${c.t}`)
    .join('\n\n');

  try {
    const answer = await openaiChat(
      cfg, VAULT_SYSTEM,
      `Excerpts from the vault:\n\n${context}\n\nQuestion: ${question}`
    );
    return json({
      ok: true, found: true, answer, sources,
      stats: { files: retrieved.files, builtAt: retrieved.builtAt, ms: retrieved.ms },
    });
  } catch (err) {
    return json({ ok: false, error: String(err.message || err).slice(0, 300) },
      { status: 502 });
  }
}
