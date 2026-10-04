import { json, readJson, sha256 } from '../../lib/http.js';
import { CANDIDATES, isCandidate, isVoteOpen } from '../../lib/candidates.js';

const COOKIE = 'cadillac_voter';
const ONE_YEAR = 60 * 60 * 24 * 365;

function getVoterId(request) {
  const cookie = request.headers.get('cookie') || '';
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([A-Za-z0-9-]{20,64})`));
  return m ? m[1] : null;
}

function withCookie(response, voterId) {
  response.headers.append(
    'set-cookie',
    `${COOKIE}=${voterId}; Path=/; Max-Age=${ONE_YEAR}; HttpOnly; Secure; SameSite=Lax`
  );
  return response;
}

// GET /api/vote — 受付状況・候補者・自分の投票先
export async function onRequestGet({ request, env }) {
  let voterId = getVoterId(request);
  const isNew = !voterId;
  if (isNew) voterId = crypto.randomUUID();

  const open = await isVoteOpen(env.DB);
  const mine = isNew
    ? null
    : await env.DB.prepare(`SELECT candidate_id FROM votes WHERE voter_id = ?1`).bind(voterId).first();

  const res = json({ open, candidates: CANDIDATES, myVote: mine?.candidate_id ?? null });
  return isNew ? withCookie(res, voterId) : res;
}

// POST /api/vote — 投票（締め切りまでは選び直し可）
export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const candidateId = Number(body?.candidate_id);
  if (!isCandidate(candidateId)) return json({ error: '投票する人を選んでください。' }, 400);
  if (!(await isVoteOpen(env.DB))) return json({ error: '現在、投票は受け付けていません。' }, 403);

  let voterId = getVoterId(request);
  const isNew = !voterId;
  if (isNew) voterId = crypto.randomUUID();

  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const ipHash = await sha256(`${ip}:${env.ADMIN_TOKEN || 'salt'}`);

  await env.DB.prepare(
    `INSERT INTO votes (voter_id, candidate_id, ip_hash) VALUES (?1, ?2, ?3)
     ON CONFLICT(voter_id) DO UPDATE SET candidate_id = excluded.candidate_id,
       ip_hash = excluded.ip_hash, updated_at = datetime('now')`
  )
    .bind(voterId, candidateId, ipHash)
    .run();

  const res = json({ ok: true, myVote: candidateId });
  return isNew ? withCookie(res, voterId) : res;
}
