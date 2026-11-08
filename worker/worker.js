// お絵描きバトル: Gemini 中継 (Cloudflare Worker)
// APIキーはここ(環境変数 GEMINI_API_KEY)にだけ置く。ブラウザには渡さない。
const MAX_IMAGES = 4;
const MAX_BODY = 2_500_000; // bytes

function cors(env, req) {
  const allow = (env.ALLOWED_ORIGIN || '*').split(',').map(s => s.trim());
  const o = req.headers.get('Origin') || '';
  const ok = allow.includes('*') || allow.includes(o);
  return {
    'Access-Control-Allow-Origin': ok ? (allow.includes('*') ? '*' : o) : allow[0],
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}
const json = (obj, status, hdr) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...hdr } });

// 1つのWorkerインスタンス内の簡易レート制限(IPごと 1分10回)
const hits = new Map();
function limited(ip) {
  const now = Date.now(), arr = (hits.get(ip) || []).filter(t => now - t < 60000);
  arr.push(now); hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > 10;
}

export default {
  async fetch(req, env) {
    const hdr = cors(env, req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: hdr });
    const url = new URL(req.url);
    if (req.method === 'GET') return json({ ok: true, model: env.GEMINI_MODEL || 'gemini-3.5-flash-lite' }, 200, hdr);
    if (req.method !== 'POST' || url.pathname !== '/score') return json({ error: 'not_found' }, 404, hdr);

    const origin = req.headers.get('Origin') || '';
    const allow = (env.ALLOWED_ORIGIN || '*').split(',').map(s => s.trim());
    if (!allow.includes('*') && !allow.includes(origin)) return json({ error: 'forbidden' }, 403, hdr);
    if (limited(req.headers.get('CF-Connecting-IP') || 'x')) return json({ error: 'rate_limited' }, 429, hdr);
    if (!env.GEMINI_API_KEY) return json({ error: 'server_config' }, 500, hdr);

    const raw = await req.text();
    if (raw.length > MAX_BODY) return json({ error: 'too_large' }, 413, hdr);
    let body; try { body = JSON.parse(raw); } catch (e) { return json({ error: 'bad_request' }, 400, hdr); }
    const prompt = String(body.prompt || '').slice(0, 8000);
    const images = Array.isArray(body.images) ? body.images.slice(0, MAX_IMAGES) : [];
    if (!prompt) return json({ error: 'bad_request' }, 400, hdr);

    const parts = [{ text: prompt }];
    for (const d of images) {
      const m = /^data:(image\/jpeg|image\/png);base64,([A-Za-z0-9+/=]+)$/.exec(String(d));
      if (!m) return json({ error: 'bad_request' }, 400, hdr);
      parts.push({ inline_data: { mime_type: m[1], data: m[2] } });
    }
    const model = env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 4096, responseMimeType: 'application/json' }
      })
    });
    // 無料枠切れ・上限は 429 (RESOURCE_EXHAUSTED) で返る
    if (r.status === 429) {
      // 1日の上限(無料枠切れ)と、1分あたりの混雑を区別する
      let t = ''; try { t = JSON.stringify(await r.json()); } catch (e) {}
      const daily = /PerDay|per day|daily/i.test(t);
      return json({ error: daily ? 'quota' : 'rate_limited', message: t.slice(0, 160) }, 429, hdr);
    }
    if (!r.ok) {
      let msg = ''; try { msg = String((await r.json()).error.message || '').slice(0, 160); } catch (e) {}
      return json({ error: 'upstream', status: r.status, message: msg }, 502, hdr);
    }
    const data = await r.json();
    const cand = data.candidates && data.candidates[0];
    const text = cand && cand.content && cand.content.parts ? cand.content.parts.map(p => p.text || '').join('') : '';
    if (!text) return json({ error: 'empty' }, 502, hdr);
    return json({ text, truncated: cand.finishReason === 'MAX_TOKENS' }, 200, hdr);
  }
};
