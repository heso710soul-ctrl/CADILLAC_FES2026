import { json, readJson } from '../../../lib/http.js';
import { CANDIDATES, isVoteOpen } from '../../../lib/candidates.js';

// GET /api/admin/vote — 受付状況と集計結果
export async function onRequestGet({ env }) {
  const open = await isVoteOpen(env.DB);
  const { results } = await env.DB.prepare(
    `SELECT candidate_id, COUNT(*) AS votes FROM votes GROUP BY candidate_id`
  ).all();
  const stats = await env.DB.prepare(
    `SELECT COUNT(*) AS total, COUNT(DISTINCT ip_hash) AS networks, MAX(updated_at) AS last FROM votes`
  ).first();

  const counts = new Map(results.map((r) => [r.candidate_id, r.votes]));
  const ranking = CANDIDATES.map((c) => ({ ...c, votes: counts.get(c.id) || 0 })).sort(
    (a, b) => b.votes - a.votes || a.id - b.id
  );
  return json({ open, ranking, total: stats.total, networks: stats.networks, last: stats.last });
}

// POST /api/admin/vote — { action: "open" | "close" | "reset" }
export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const action = body?.action;
  if (action === 'open' || action === 'close') {
    await env.DB.prepare(
      `INSERT INTO settings (key, value) VALUES ('vote_open', ?1)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
      .bind(action === 'open' ? '1' : '0')
      .run();
    return json({ ok: true });
  }
  if (action === 'reset') {
    await env.DB.prepare(`DELETE FROM votes`).run();
    return json({ ok: true });
  }
  return json({ error: '操作が正しくありません。' }, 400);
}
