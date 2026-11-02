// 책 검색 — GET /api/book-search?q=gruffalo  또는  ?isbn=9780399226908
// 알라딘(외국도서)에서 먼저 찾고, 결과가 적으면 카카오 책 검색으로 보충해요.
// 응답: { items: [{ title, author, publisher, isbn, cover, description, source }] }

const ALADIN_SEARCH = 'https://www.aladin.co.kr/ttb/api/ItemSearch.aspx';
const ALADIN_LOOKUP = 'https://www.aladin.co.kr/ttb/api/ItemLookUp.aspx';
const KAKAO_URL = 'https://dapi.kakao.com/v3/search/book';

const cleanAuthor = (a) => String(a || '').replace(/\s*\((지은이|그림|옮긴이|글|엮은이)\)/g, '').trim();
const fromAladin = (it) => ({
  title: it.title,
  author: cleanAuthor(it.author),
  publisher: it.publisher || '',
  isbn: it.isbn13 || it.isbn || '',
  cover: it.cover || '',
  description: it.description || '',
  source: 'aladin',
});

async function aladinSearch(q) {
  const key = process.env.ALADIN_TTB_KEY;
  if (!key) return [];
  const params = new URLSearchParams({
    ttbkey: key, Query: q, QueryType: 'Keyword', SearchTarget: 'Foreign',
    MaxResults: '10', start: '1', Cover: 'Big', output: 'js', Version: '20131101',
  });
  const res = await fetch(`${ALADIN_SEARCH}?${params}`);
  if (!res.ok) return [];
  const data = JSON.parse((await res.text()).trim().replace(/;$/, ''));
  return (data.item || []).map(fromAladin);
}

async function aladinIsbn(isbn) {
  const key = process.env.ALADIN_TTB_KEY;
  if (!key) return [];
  const params = new URLSearchParams({
    ttbkey: key, itemIdType: isbn.length === 13 ? 'ISBN13' : 'ISBN', ItemId: isbn,
    output: 'js', Version: '20131101', Cover: 'Big',
  });
  const res = await fetch(`${ALADIN_LOOKUP}?${params}`);
  if (!res.ok) return [];
  const data = JSON.parse((await res.text()).trim().replace(/;$/, ''));
  return (data.item || []).map(fromAladin);
}

// 카카오 썸네일(120px)에 들어 있는 원본 이미지 주소(fname=)를 꺼내 더 큰 표지로 써요
const bigKakao = (t) => {
  try { const f = new URL(t).searchParams.get('fname'); return f ? f.replace(/^http:/, 'https:') : (t || ''); } catch { return t || ''; }
};
async function kakao(q, target) {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return [];
  const params = new URLSearchParams({ query: q, size: '10', ...(target ? { target } : {}) });
  const res = await fetch(`${KAKAO_URL}?${params}`, { headers: { Authorization: `KakaoAK ${key}` } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.documents || []).map((d) => ({
    title: d.title,
    author: (d.authors || []).join(' · '),
    publisher: d.publisher || '',
    isbn: String(d.isbn || '').split(' ').pop(),
    cover: bigKakao(d.thumbnail),
    description: d.contents || '',
    source: 'kakao',
  }));
}

export default async function handler(req, res) {
  const q = String(req.query.q || '').trim();
  const isbn = String(req.query.isbn || '').replace(/[^0-9Xx]/g, '');
  if (!q && !isbn) return res.status(400).json({ items: [], error: '검색어를 입력해주세요.' });

  try {
    let items = isbn ? await aladinIsbn(isbn) : await aladinSearch(q);
    if (items.length < 5) {
      const seen = new Set(items.map((i) => i.isbn).filter(Boolean));
      const more = (await kakao(isbn || q, isbn ? 'isbn' : '')).filter((i) => !i.isbn || !seen.has(i.isbn));
      items = items.concat(more);
    }
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({ items: items.slice(0, 12) });
  } catch (e) {
    return res.status(502).json({ items: [], error: '책 검색 서버에 연결하지 못했어요.' });
  }
}
