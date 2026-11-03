// 구글 시트 → 북클 앱 반영
// 시트를 [파일 → 공유 → 웹에 게시 → CSV]로 게시한 주소를 읽어서,
// 제목(또는 ISBN)으로 알라딘 → 카카오에서 표지·ISBN·작가·출판사를 찾아 Supabase books 에 저장해요.
// 시트에서 지운 줄은 앱에서 숨겨요. 시트는 건드리지 않아요.
//
// 실행: https://bookle.my/api/sync-sheet?key=<CRON_SECRET>  (북마크해두고 시트 고친 뒤 열기)
//       + 매일 새벽 자동 (vercel.json crons)
// 환경 변수: SHEET_CSV_URL, CURATOR_USER_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET

export const config = { maxDuration: 60 };

/* ---------- CSV (셀 안 줄바꿈·따옴표 지원) ---------- */
function parseCSV(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

/* ---------- 시트 칸 이름 (대충 써도 알아듣게) ---------- */
const FIELDS = {
  isbn: ['isbn'],
  age: ['나이대', '나이', '연령', 'age'],
  rating: ['별점', '평점', 'rating'],
  summary: ['소개', '내용', '책소개', 'summary'],
  howTo: ['이렇게읽어주세요', '읽어주는법', '읽는법', '팁', 'howto'],
  published: ['공개', 'published'],
  title: ['제목', '책제목', 'title'],
  author: ['작가', '저자', 'author'],
  tags: ['테마', '태그', 'tags', 'theme'],
  awards: ['수상', '수상작', '수상내역', 'award', 'awards'],
};
const norm = (s) => String(s || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[\s_·\-]/g, '');
function mapHeader(header) {
  const idx = {};
  header.forEach((h, i) => {
    const n = norm(h);
    for (const [k, names] of Object.entries(FIELDS)) if (idx[k] === undefined && names.includes(n)) idx[k] = i;
  });
  return idx;
}
function toAge(v) {
  const s = String(v || '').replace(/\s/g, '');
  const n = parseInt(s.match(/\d+/)?.[0] ?? '', 10);
  if (Number.isNaN(n)) return null;
  if (n <= 2) return '0-2';
  if (n <= 4) return '3-4';
  if (n <= 6) return '5-6';
  return '7+';
}
const TAGS = { 크리스마스: 'christmas', 겨울: 'christmas', christmas: 'christmas', 동물: 'animals', 동물친구: 'animals', animals: 'animals' };
const toTags = (v) => [...new Set(String(v || '').split(/[,·/]/).map((t) => TAGS[norm(t)]).filter(Boolean))];
// 수상 칸: "칼데콧 메달", "칼데콧 아너", "가이젤 아너", "그린어웨이", "스마티즈", "클라우스 플뤼게" 등 (쉼표로 여러 개)
function toAwards(v) {
  return [...new Set(String(v || '').split(/[,/]/).map((t) => {
    const n = norm(t); if (!n) return null;
    const honor = /아너|honor|우수|후보/.test(n);
    if (/칼데콧|caldecott/.test(n)) return 'award:caldecott-' + (honor ? 'honor' : 'medal');
    if (/가이젤|geisel/.test(n)) return 'award:geisel-' + (honor ? 'honor' : 'medal');
    if (/그린어웨이|greenaway|카네기|carnegie/.test(n)) return 'award:greenaway-' + (honor ? 'honor' : 'medal');
    if (/스마티즈|smarties/.test(n)) return 'award:smarties';
    if (/플뤼게|플루게|flugge/.test(n)) return 'award:flugge';
    return 'award:other:' + String(t).trim().slice(0, 20);
  }).filter(Boolean))];
}
const titleKey = (t) => String(t || '').toLowerCase().replace(/^(the|a|an)\s+/, '').replace(/[^a-z0-9가-힣]/g, '');

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  const given = String(req.query.key || '') || String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const page = (title, body) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<body style="font-family:-apple-system,sans-serif;max-width:560px;margin:24px auto;padding:0 16px;line-height:1.6;color:#3B2A1E;background:#F7F0E3">
<h2>${title}</h2>${body}</body>`;
  };
  if (!secret || given !== secret) return res.status(401).send(page('열쇠가 맞지 않아요', '<p>주소 끝의 key= 값이 Vercel의 CRON_SECRET 과 같은지 확인해주세요.</p>'));

  const need = ['SHEET_CSV_URL', 'CURATOR_USER_ID', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].filter((k) => !process.env[k]);
  if (need.length) return res.status(500).send(page('설정이 비어 있어요', `<p>Vercel 환경 변수에 <b>${need.join(', ')}</b> 를 넣고 Redeploy 해주세요.</p>`));

  const base = new URL(process.env.SUPABASE_URL.trim()).origin;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY.trim();
  const curator = process.env.CURATOR_USER_ID.trim();
  const H = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  const origin = `https://${req.headers.host}`;

  try {
    // 1) 시트 읽기
    const csvRes = await fetch(process.env.SHEET_CSV_URL.trim(), { redirect: 'follow' });
    const text = await csvRes.text();
    if (!csvRes.ok || /^\s*</.test(text)) throw new Error('시트를 읽지 못했어요. [웹에 게시]가 CSV로 되어 있는지 확인해주세요.');
    const [header, ...lines] = parseCSV(text);
    const ix = mapHeader(header || []);
    if (ix.title === undefined && ix.isbn === undefined) throw new Error('시트 첫 줄에 "제목" 또는 "ISBN" 칸이 필요해요.');
    const get = (r, k) => (ix[k] === undefined ? '' : String(r[ix[k]] ?? '').trim());

    // 2) 이미 앱에 있는 내 책 (다시 검색하지 않으려고)
    const ex = await fetch(`${base}/rest/v1/books?user_id=eq.${curator}&select=isbn,title,author,publisher,cover`, { headers: H }).then((r) => r.json());
    const byIsbn = new Map(), byTitle = new Map();
    (Array.isArray(ex) ? ex : []).forEach((b) => { if (b.isbn) byIsbn.set(b.isbn, b); if (b.title) byTitle.set(titleKey(b.title), b); });

    const rows = lines.map((r, n) => ({
      line: n + 2, isbn: get(r, 'isbn').replace(/[^0-9Xx]/g, ''), title: get(r, 'title'), author: get(r, 'author'),
      age: toAge(get(r, 'age')), rating: parseInt(get(r, 'rating'), 10) || null, summary: get(r, 'summary'),
      howTo: get(r, 'howTo'), published: !/^n/i.test(get(r, 'published')), tags: [...toTags(get(r, 'tags')), ...toAwards(get(r, 'awards'))],
    })).filter((r) => r.isbn || r.title);

    // 3) 표지·ISBN 찾기 (5권씩 동시에)
    const skipped = [];
    const find = async (r) => {
      if (!r.age) { skipped.push(`${r.line}번째 줄 "${r.title || r.isbn}": 나이대가 없어요`); return null; }
      let info = (r.isbn && byIsbn.get(r.isbn)) || (!r.isbn && r.title && byTitle.get(titleKey(r.title))) || null;
      if (!info || !info.cover) {
        const q = r.isbn ? `isbn=${r.isbn}` : `q=${encodeURIComponent((r.title + ' ' + (r.author.split(/[·,]/)[0] || '')).trim())}`;
        const s = await fetch(`${origin}/api/book-search?${q}`).then((x) => x.json()).catch(() => ({}));
        const it = (s.items || []).find((x) => x.cover && x.isbn) || (s.items || []).find((x) => x.isbn);
        if (it) info = { ...it, isbn: r.isbn || it.isbn };
      }
      const isbn = r.isbn || (info && info.isbn);
      if (!isbn) { skipped.push(`${r.line}번째 줄 "${r.title}": 책을 찾지 못했어요 (ISBN을 적어주세요)`); return null; }
      return {
        user_id: curator, curated: true, isbn,
        title: r.title || info?.title || null,
        author: r.author || info?.author || null,
        publisher: info?.publisher || null,
        cover: info?.cover || null,
        age: r.age, rating: r.rating && r.rating >= 1 && r.rating <= 5 ? r.rating : null,
        summary: r.summary || '', how_to: r.howTo || null, tags: r.tags, published: r.published,
        updated_at: new Date().toISOString(),
      };
    };
    const out = [];
    for (let i = 0; i < rows.length; i += 5) out.push(...(await Promise.all(rows.slice(i, i + 5).map(find))));
    const payload = [...new Map(out.filter(Boolean).map((b) => [b.isbn, b])).values()];

    // 4) 저장 (같은 ISBN은 덮어쓰기)
    if (payload.length) {
      const up = await fetch(`${base}/rest/v1/books?on_conflict=user_id,isbn`, {
        method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(payload),
      });
      if (!up.ok) throw new Error('저장 실패: ' + (await up.text()).slice(0, 200));
    }
    // 5) 시트에서 지운 책은 앱에서 숨기기
    let hidden = 0;
    if (payload.length) {
    const keep = payload.map((b) => `"${b.isbn}"`).join(',');
    const hid = await fetch(`${base}/rest/v1/books?user_id=eq.${curator}&curated=eq.true&published=eq.true${keep ? `&isbn=not.in.(${keep})` : ''}`, {
      method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify({ published: false }),
    });
    if (hid.ok) hidden = (await hid.json()).length;
    }

    const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    return res.status(200).send(page(`✓ ${payload.length}권을 앱에 반영했어요`,
      `<ul>${payload.map((b) => `<li>${esc(b.title || b.isbn)} ${b.cover ? '🖼' : '(표지 없음)'} ${b.published ? '' : '— 숨김'}</li>`).join('')}</ul>
      ${skipped.length ? `<h3>⚠ 반영 못 한 줄</h3><ul>${skipped.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
      ${hidden ? `<p>시트에서 지운 책 ${hidden}권은 앱에서 숨겼어요.</p>` : ''}
      <p><a href="/">bookle.my 열기 →</a></p>`));
  } catch (e) {
    return res.status(500).send(page('반영하지 못했어요', `<p>${String(e.message || e)}</p>`));
  }
}
