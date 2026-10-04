import { json } from '../../../lib/http.js';

// /api/admin/* は合言葉（ADMIN_TOKEN）がないと使えない
export async function onRequest({ request, env, next }) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
    return json({ error: '合言葉が違います。' }, 401);
  }
  return next();
}
