import { json } from '../../../../lib/http.js';

// DELETE /api/admin/comments/:id — 掲示板の書き込みを削除
export async function onRequestDelete({ env, params }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) return json({ error: 'IDが正しくありません。' }, 400);
  const result = await env.DB.prepare(`DELETE FROM comments WHERE id = ?1`).bind(id).run();
  if (!result.meta.changes) return json({ error: '見つかりませんでした。' }, 404);
  return json({ ok: true });
}
