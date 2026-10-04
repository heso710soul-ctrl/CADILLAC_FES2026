// やぶ信賞MVP 投票の候補者（タイムテーブルの出演者21名）
// id は投票データと結びつくので、一度投票が始まったら変えないでください。
export const CANDIDATES = [
  { id: 1, name: '小林', bands: ['小林'] },
  { id: 2, name: '村上', bands: ['小林', '真由美'] },
  { id: 3, name: '友美', bands: ['小林'] },
  { id: 4, name: '貴史', bands: ['小林', '真由美'] },
  { id: 5, name: '創', bands: ['小林', '倉', 'なな', 'めぐ', '佐山', '虎彦'] },
  { id: 6, name: '真由美', bands: ['真由美'] },
  { id: 7, name: '高広', bands: ['真由美', '虎彦'] },
  { id: 8, name: '直子', bands: ['真由美', 'めぐ'] },
  { id: 9, name: 'アタル', bands: ['アタル', '虎彦'] },
  { id: 10, name: 'タッチー', bands: ['アタル', '倉', 'なな', '佐山'] },
  { id: 11, name: '倉ちゃん', bands: ['アタル', '倉'] },
  { id: 12, name: '親方', bands: ['アタル', '虎彦'] },
  { id: 13, name: '足利', bands: ['倉'] },
  { id: 14, name: 'なな', bands: ['なな'] },
  { id: 15, name: '板垣', bands: ['なな'] },
  { id: 16, name: 'ユキエ', bands: ['なな'] },
  { id: 17, name: 'めぐ', bands: ['めぐ'] },
  { id: 18, name: 'トラ', bands: ['めぐ', '虎彦'] },
  { id: 19, name: '井上', bands: ['めぐ', '佐山'] },
  { id: 20, name: '千葉', bands: ['めぐ', '佐山'] },
  { id: 21, name: '佐山', bands: ['佐山'] },
];

export const isCandidate = (id) => CANDIDATES.some((c) => c.id === id);

export async function isVoteOpen(db) {
  const row = await db.prepare(`SELECT value FROM settings WHERE key = 'vote_open'`).first();
  return row?.value === '1';
}
