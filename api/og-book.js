// 공유 링크 미리보기 — /book/:id  →  index.html 에 책 제목·표지 메타 태그를 넣어 돌려줘요.
// 카카오톡·문자에 링크만 붙여넣어도 표지와 제목이 보이게 해요. 앱은 그대로 실행돼요.
// 환경 변수: SUPABASE_URL, SUPABASE_ANON_KEY

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SAMPLE_TITLES = {
  s1: 'Brown Bear, Brown Bear, What Do You See?', s2: 'Dear Zoo', s3: "We're Going on a Bear Hunt",
  s4: 'Pete the Cat: I Love My White Shoes', s5: 'The Gruffalo', s6: 'We Are in a Book!',
  s7: 'Frog and Toad Are Friends', s8: 'Mercy Watson to the Rescue', s9: 'Dear Santa',
  s10: 'Bear Stays Up for Christmas', s11: 'The Night Before Christmas', s12: 'How the Grinch Stole Christmas!',
};

export default async function handler(req, res) {
  const id = String(req.query.id || '');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const origin = `${proto}://${host}`;

  let html;
  try {
    html = await (await fetch(`${origin}/index.html`)).text();
  } catch {
    res.statusCode = 302;
    res.setHeader('Location', '/');
    return res.end();
  }

  let book = null;
  if (/^[0-9a-f-]{36}$/i.test(id) && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      const r = await fetch(`${new URL(process.env.SUPABASE_URL.trim()).origin}/rest/v1/books?id=eq.${id}&select=title,cover,summary&limit=1`, {
        headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}` },
      });
      book = (await r.json())[0] || null;
    } catch { /* 메타 없이 앱만 열어요 */ }
  } else if (SAMPLE_TITLES[id]) {
    book = { title: SAMPLE_TITLES[id], summary: '엄마 아빠가 직접 고른 영어 그림책', cover: '' };
  }

  if (book) {
    const meta = `
    <meta property="og:type" content="article">
    <meta property="og:title" content="${esc(book.title)} | Bookle">
    <meta property="og:description" content="${esc(String(book.summary || '').slice(0, 90))}">
    ${book.cover ? `<meta property="og:image" content="${esc(book.cover)}">` : ''}
    <meta property="og:url" content="${esc(origin + '/book/' + id)}">`;
    html = html.replace(/\s*<meta property="og:[^"]+"[^>]*>/g, '').replace('</head>', meta + '\n</head>');
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
  return res.status(200).send(html);
}
