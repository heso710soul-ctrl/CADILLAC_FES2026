import { json, readJson, str, sha256 } from '../../lib/http.js';

const WAIT_SECONDS = 30; // 同じ人が続けて書き込めるまでの間隔

// GET /api/comments — 掲示板の書き込み（新しい順・最大100件）
export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT id, name, message, created_at FROM comments ORDER BY id DESC LIMIT 100`
  ).all();
  return json({ comments: results });
}

// POST /api/comments — 書き込む
export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  if (!body) return json({ error: '送信内容を読み取れませんでした。' }, 400);
  if (str(body.website)) return json({ ok: true }, 201);

  const name = str(body.name) || '名無しさん';
  const message = str(body.message);

  if (name.length > 30) return json({ error: 'お名前は30文字以内でお願いします。' }, 400);
  if (!message) return json({ error: 'メッセージを入力してください。' }, 400);
  if (message.length > 500) return json({ error: 'メッセージは500文字以内でお願いします。' }, 400);

  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const ipHash = await sha256(`${ip}:${env.ADMIN_TOKEN || 'salt'}`);

  const recent = await env.DB.prepare(
    `SELECT 1 FROM comments WHERE ip_hash = ?1 AND created_at > datetime('now', ?2) LIMIT 1`
  )
    .bind(ipHash, `-${WAIT_SECONDS} seconds`)
    .first();
  if (recent) return json({ error: `連続の書き込みは${WAIT_SECONDS}秒ほど空けてください。` }, 429);

  await env.DB.prepare(`INSERT INTO comments (name, message, ip_hash) VALUES (?1, ?2, ?3)`)
    .bind(name, message, ipHash)
    .run();
  return json({ ok: true }, 201);
}
