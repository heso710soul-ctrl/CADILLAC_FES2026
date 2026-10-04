// 掲示板：Cloudflare（Functions + D1）で公開したときだけ表示する。
// GitHub Pages など、サーバー機能がない場所では掲示板の欄ごと隠れる。

const $ = (sel, el = document) => el.querySelector(sel);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function formatDate(sqlUtc) {
  const d = new Date(sqlUtc.replace(' ', 'T') + 'Z');
  return d.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

async function fetchComments() {
  const res = await fetch('api/comments', { headers: { accept: 'application/json' } });
  if (!res.ok || !(res.headers.get('content-type') || '').includes('application/json')) {
    throw new Error('unavailable');
  }
  return (await res.json()).comments;
}

function renderComments(comments) {
  const list = $('#comment-list');
  list.replaceChildren();
  if (!comments.length) {
    list.append(el('li', 'muted', 'まだ書き込みはありません。最初のひとことをどうぞ。'));
    return;
  }
  for (const c of comments) {
    const li = el('li', 'comment');
    const head = el('div', 'comment-head');
    head.append(el('strong', null, c.name), el('time', null, formatDate(c.created_at)));
    li.append(head, el('p', null, c.message));
    list.append(li);
  }
}

async function initBoard() {
  const board = $('#board');
  if (!board) return;
  let comments;
  try {
    comments = await fetchComments();
  } catch {
    return; // サーバー機能なし → 掲示板は出さない
  }
  board.hidden = false;
  document.querySelectorAll('[data-board-link]').forEach((a) => (a.hidden = false));
  renderComments(comments);

  $('#comment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const msg = $('#comment-msg');
    const btn = $('button', form);
    const data = Object.fromEntries(new FormData(form));

    if (!data.message.trim()) {
      msg.className = 'form-msg err';
      msg.textContent = 'メッセージを入力してください。';
      return;
    }
    btn.disabled = true;
    msg.className = 'form-msg';
    msg.textContent = '送信中…';
    try {
      const res = await fetch('api/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || '送信できませんでした。時間をおいてお試しください。');
      msg.className = 'form-msg ok';
      msg.textContent = '書き込みました。ありがとうございます！';
      form.message.value = '';
      renderComments(await fetchComments());
    } catch (err) {
      msg.className = 'form-msg err';
      msg.textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });
}

// 掲示板が出るまでナビのリンクも隠しておく
document.querySelectorAll('[data-board-link]').forEach((a) => (a.hidden = true));
initBoard();
