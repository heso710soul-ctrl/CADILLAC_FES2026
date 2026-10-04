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

/* ===== MVP投票 ===== */
async function fetchVote() {
  const res = await fetch('api/vote', { headers: { accept: 'application/json' }, credentials: 'same-origin' });
  if (!res.ok || !(res.headers.get('content-type') || '').includes('application/json')) {
    throw new Error('unavailable');
  }
  return res.json();
}

function renderVote(state) {
  const status = $('#vote-status');
  const form = $('#vote-form');
  const list = $('#vote-list');
  const mine = state.candidates.find((c) => c.id === state.myVote);

  if (!state.open) {
    form.hidden = true;
    status.className = 'vote-status';
    status.textContent = mine
      ? `投票は締め切りました。あなたの投票：${mine.name}さん。結果発表をお楽しみに！`
      : '投票はまだ受け付けていません。当日、会場で受付開始のアナウンスがあります。';
    return;
  }

  form.hidden = false;
  status.className = mine ? 'vote-status is-voted' : 'vote-status is-open';
  status.textContent = mine
    ? `${mine.name}さんに投票済みです。締め切りまでは選び直せます。`
    : '投票受付中！ 面白かった人を1人えらんでください。';

  const checked = $('input[name="candidate_id"]:checked', list)?.value;
  list.replaceChildren();
  for (const c of state.candidates) {
    const label = el('label', 'vote-option' + (c.id === state.myVote ? ' is-mine' : ''));
    const input = el('input');
    Object.assign(input, { type: 'radio', name: 'candidate_id', value: c.id });
    if (String(c.id) === (checked ?? String(state.myVote))) input.checked = true;
    label.append(input, el('strong', null, c.name), el('small', null, c.bands.join('・') + 'バンド'));
    list.append(label);
  }
}

async function initVote() {
  const section = $('#vote');
  if (!section) return;
  let state;
  try {
    state = await fetchVote();
  } catch {
    return; // サーバー機能なし → 投票欄は出さない
  }
  section.hidden = false;
  document.querySelectorAll('[data-vote-link]').forEach((a) => (a.hidden = false));
  renderVote(state);

  // 受付開始・締め切りを反映するため、ページを開いている間は30秒ごとに確認
  setInterval(async () => {
    if (document.hidden) return;
    try { state = await fetchVote(); renderVote(state); } catch {}
  }, 30000);

  $('#vote-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('#vote-msg');
    const btn = $('button', e.currentTarget);
    const picked = $('input[name="candidate_id"]:checked', e.currentTarget);
    if (!picked) {
      msg.className = 'form-msg err';
      msg.textContent = '投票する人をえらんでください。';
      return;
    }
    btn.disabled = true;
    msg.className = 'form-msg';
    msg.textContent = '送信中…';
    try {
      const res = await fetch('api/vote', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ candidate_id: Number(picked.value) }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || '送信できませんでした。時間をおいてお試しください。');
      state = await fetchVote();
      renderVote(state);
      const name = state.candidates.find((c) => c.id === out.myVote)?.name;
      msg.className = 'form-msg ok';
      msg.textContent = `${name}さんに投票しました！ありがとうございます。`;
    } catch (err) {
      msg.className = 'form-msg err';
      msg.textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });
}

// 掲示板・投票が出るまでナビのリンクも隠しておく
document.querySelectorAll('[data-board-link], [data-vote-link]').forEach((a) => (a.hidden = true));
initBoard();
initVote();
