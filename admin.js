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

async function checkToken() {
  // 存在しないIDを消そうとして、合言葉が正しいか（404）違うか（401）を確かめる
  const res = await fetch('api/admin/comments/0', { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
  if (res.status === 401) throw Object.assign(new Error('合言葉が違います。'), { status: 401 });
  if (!(res.headers.get('content-type') || '').includes('application/json')) {
    throw new Error('掲示板のサーバー機能が見つかりません（Cloudflareで公開したときに使えます）。');
  }
}

async function load() {
  $('#admin-msg').textContent = '';
  try {
    await checkToken();
    const res = await fetch('api/comments');
    const { comments } = await res.json();
    try { sessionStorage.setItem(KEY, token); } catch {}
    $('#login').hidden = true;
    $('#panel').hidden = false;
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

if (token) load();
