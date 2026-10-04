const $ = (sel) => document.querySelector(sel);
const KEY = 'admin-token';
let token = '';

try { token = sessionStorage.getItem(KEY) || ''; } catch {}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function formatDate(sqlUtc) {
  return new Date(sqlUtc.replace(' ', 'T') + 'Z').toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
}

async function deleteComment(id) {
  const res = await fetch(`api/admin/comments/${id}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${token}` },
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(out.error || 'エラーが発生しました。'), { status: res.status });
}

async function adminApi(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
  });
  if (!(res.headers.get('content-type') || '').includes('application/json')) {
    throw new Error('サーバー機能が見つかりません（Cloudflareで公開したときに使えます）。');
  }
  const out = await res.json();
  if (res.status === 401) throw Object.assign(new Error('合言葉が違います。'), { status: 401 });
  if (!res.ok) throw new Error(out.error || 'エラーが発生しました。');
  return out;
}

async function load() {
  $('#admin-msg').textContent = '';
  try {
    const vote = await adminApi('api/admin/vote');
    const { comments } = await (await fetch('api/comments')).json();
    try { sessionStorage.setItem(KEY, token); } catch {}
    $('#login').hidden = true;
    $('#panel').hidden = false;
    renderVote(vote);
    render(comments);
  } catch (err) {
    if (err.status === 401) {
      token = '';
      try { sessionStorage.removeItem(KEY); } catch {}
      $('#login').hidden = false;
      $('#panel').hidden = true;
    }
    $('#admin-msg').textContent = err.message;
  }
}

function renderVote(v) {
  const state = $('#vote-state');
  state.textContent = v.open ? '受付中' : '停止中';
  state.className = v.open ? 'on' : '';
  $('#vote-open').disabled = v.open;
  $('#vote-close').disabled = !v.open;
  $('#vote-meta').textContent = v.total
    ? `総投票数 ${v.total}票／最終投票 ${formatDate(v.last)}`
    : 'まだ投票はありません。';

  const max = Math.max(1, ...v.ranking.map((r) => r.votes));
  const list = $('#rank');
  list.replaceChildren();
  let pos = 0, prev = null;
  v.ranking.forEach((r, i) => {
    if (r.votes !== prev) { pos = i + 1; prev = r.votes; }
    const li = el('li', r.votes && pos <= 3 ? 'top' : '');
    const bar = el('span', 'bar');
    const fill = el('i');
    fill.style.width = `${(r.votes / max) * 100}%`;
    bar.append(fill);
    li.title = r.bands.join('・') + 'バンド';
    li.append(el('span', 'pos', r.votes ? String(pos) : '–'), el('span', null, r.name), bar, el('span', 'num', String(r.votes)));
    list.append(li);
  });
}

async function voteAction(action, confirmText) {
  if (confirmText && !confirm(confirmText)) return;
  try {
    await adminApi('api/admin/vote', { method: 'POST', body: JSON.stringify({ action }) });
    load();
  } catch (err) {
    $('#admin-msg').textContent = err.message;
  }
}

function render(comments) {
  const list = $('#comments');
  list.replaceChildren();
  if (!comments.length) return list.append(el('li', 'muted', '書き込みはありません。'));
  for (const c of comments) {
    const li = el('li', 'comment');
    const body = el('div');
    const head = el('div', 'comment-head');
    head.append(el('strong', null, c.name), el('time', null, formatDate(c.created_at)));
    body.append(head, el('p', null, c.message));
    const del = el('button', 'del', '削除');
    del.type = 'button';
    del.addEventListener('click', async () => {
      if (!confirm('この書き込みを削除しますか？')) return;
      try { await deleteComment(c.id); load(); }
      catch (err) { $('#admin-msg').textContent = err.message; }
    });
    li.append(body, del);
    list.append(li);
  }
}

$('#login').addEventListener('submit', (e) => {
  e.preventDefault();
  token = $('#token').value.trim();
  load();
});
$('#reload').addEventListener('click', load);
$('#vote-open').addEventListener('click', () => voteAction('open', '投票の受付を開始しますか？'));
$('#vote-close').addEventListener('click', () => voteAction('close', '投票を締め切りますか？'));
$('#vote-reset').addEventListener('click', () => voteAction('reset', 'これまでの票をすべて消します。元に戻せません。よろしいですか？'));
// 開いている間は20秒ごとに結果を更新
setInterval(() => { if (token && !$('#panel').hidden && !document.hidden) load(); }, 20000);

if (token) load();
