// 표지 자동 채우기 — Supabase books 중 ISBN은 있는데 표지·제목이 비어 있는 줄을 알라딘 → 카카오로 찾아 저장해요.
// 실행: 매일 자동(vercel.json crons) 또는 브라우저에서 https://bookle.my/api/fill-covers?key=<CRON_SECRET>
// 환경 변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY(서버 전용, 절대 VITE_ 붙이지 않기), CRON_SECRET
export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  const given = String(req.query.key || '') || String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!secret || given !== secret) return res.status(401).json({ error: 'unauthorized' });

  const base = new URL(String(process.env.SUPABASE_URL || '').trim()).origin;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY 가 없어요' });
  const h = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

  const q = `${base}/rest/v1/books?select=id,isbn,title,author,publisher,cover&isbn=not.is.null&or=(cover.is.null,cover.eq.,title.is.null,title.eq.)&limit=40`;
  const r = await fetch(q, { headers: h });
  if (!r.ok) return res.status(502).json({ error: await r.text() });
  const rows = await r.json();

  const origin = `https://${req.headers.host}`;
  const done = [], miss = [];
  for (const b of rows) {
    const isbn = String(b.isbn).replace(/[^0-9Xx]/g, '');
    try {
      const s = await fetch(`${origin}/api/book-search?isbn=${isbn}`).then((x) => x.json());
      const it = (s.items || []).find((x) => x.cover) || (s.items || [])[0];
      if (!it) { miss.push(isbn); continue; }
      const patch = {};
      if (!b.cover && it.cover) patch.cover = it.cover;
      if (!b.title && it.title) patch.title = it.title;
      if (!b.author && it.author) patch.author = it.author;
      if (!b.publisher && it.publisher) patch.publisher = it.publisher;
      if (!Object.keys(patch).length) { miss.push(isbn); continue; }
      const u = await fetch(`${base}/rest/v1/books?id=eq.${b.id}`, { method: 'PATCH', headers: h, body: JSON.stringify(patch) });
      (u.ok ? done : miss).push(isbn);
    } catch { miss.push(isbn); }
  }
  return res.status(200).json({ checked: rows.length, filled: done.length, notFound: miss });
}
