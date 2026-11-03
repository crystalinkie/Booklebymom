// 책 검색 — GET /api/book-search?q=gruffalo  또는  ?isbn=9780399226908
// 알라딘(외국도서)에서 먼저 찾고, 결과가 적으면 카카오 책 검색으로 보충해요.
// 응답: { items: [{ title, author, publisher, isbn, cover, description, source }] }

const ALADIN_SEARCH = 'https://www.aladin.co.kr/ttb/api/ItemSearch.aspx';
const ALADIN_LOOKUP = 'https://www.aladin.co.kr/ttb/api/ItemLookUp.aspx';
const KAKAO_URL = 'https://dapi.kakao.com/v3/search/book';
let aladinNote = '';

const cleanAuthor = (a) => String(a || '').replace(/\s*\((지은이|그림|옮긴이|글|엮은이)\)/g, '').trim();
const fromAladin = (it) => ({
  title: it.title,
  author: cleanAuthor(it.author),
  publisher: it.publisher || '',
  isbn: it.isbn13 || it.isbn || '',
  cover: String(it.cover || '').replace(/^http:/, 'https:'),
  description: it.description || '',
  source: 'aladin',
});

function parseAladin(text) {
  let data;
  try { data = JSON.parse(String(text).trim().replace(/;\s*$/, '')); }
  catch { aladinNote = '응답 해석 실패: ' + String(text).slice(0, 120); return []; }
  if (data.errorCode) { aladinNote = `알라딘 오류 ${data.errorCode}: ${data.errorMessage || ''}`; return []; }
  if (!(data.item || []).length) aladinNote = '알라딘 결과 0건';
  return (data.item || []).map(fromAladin);
}

async function aladinSearch(q) {
  const key = process.env.ALADIN_TTB_KEY;
  if (!key) { aladinNote = 'ALADIN_TTB_KEY 없음'; return []; }
  const params = new URLSearchParams({
    ttbkey: key, Query: q, QueryType: 'Keyword', SearchTarget: 'Foreign',
    MaxResults: '10', start: '1', Cover: 'Big', output: 'js', Version: '20131101',
  });
  const res = await fetch(`${ALADIN_SEARCH}?${params}`);
  if (!res.ok) { aladinNote = `HTTP ${res.status}`; return []; }
  return parseAladin(await res.text());
}

async function aladinIsbn(isbn) {
  const key = process.env.ALADIN_TTB_KEY;
  if (!key) { aladinNote = 'ALADIN_TTB_KEY 없음'; return []; }
  const params = new URLSearchParams({
    ttbkey: key, itemIdType: isbn.length === 13 ? 'ISBN13' : 'ISBN', ItemId: isbn,
    output: 'js', Version: '20131101', Cover: 'Big',
  });
  const res = await fetch(`${ALADIN_LOOKUP}?${params}`);
  if (!res.ok) { aladinNote = `HTTP ${res.status}`; return []; }
  return parseAladin(await res.text());
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
  aladinNote = '';
  const q = String(req.query.q || '').trim();
  const isbn = String(req.query.isbn || '').replace(/[^0-9Xx]/g, '');
  if (!q && !isbn) return res.status(400).json({ items: [], error: '검색어를 입력해주세요.' });

  try {
    let items = await (isbn ? aladinIsbn(isbn) : aladinSearch(q)).catch((e) => { aladinNote = '알라딘 연결 실패: ' + (e && e.message); return []; });
    if (items.length < 5) {
      const seen = new Set(items.map((i) => i.isbn).filter(Boolean));
      const more = (await kakao(isbn || q, isbn ? 'isbn' : '')).filter((i) => !i.isbn || !seen.has(i.isbn));
      items = items.concat(more);
    }
    // 우선순위: ① 영어 제목(원서) ② 표지 있음. 한글 제목(번역판)은 뒤로 보내요
    const hangul = (t) => /[\u3131-\uD79D]/.test(String(t || ''));
    const qEn = !hangul(q);
    items.sort((a, b) => ((qEn ? (hangul(a.title) ? 1 : 0) - (hangul(b.title) ? 1 : 0) : 0)) || ((b.cover ? 1 : 0) - (a.cover ? 1 : 0)));
    const aladinCount = items.filter((i) => i.source === 'aladin').length;
    if (!aladinCount) res.setHeader('Cache-Control', 'no-store');   // 알라딘이 안 될 때는 캐시하지 않아요
    else res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({ items: items.slice(0, 12), ...(aladinCount ? {} : { aladin: aladinNote || '알 수 없음' }) });
  } catch (e) {
    return res.status(502).json({ items: [], error: '책 검색 서버에 연결하지 못했어요.' });
  }
}
