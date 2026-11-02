// Bookle 데이터 계층 — Supabase
// 화면 코드(main.js)는 이 파일의 함수만 불러요. Supabase 설정이 없으면 enabled=false 로
// 화면만 둘러볼 수 있는 미리보기 모드로 동작해요.
import { createClient } from '@supabase/supabase-js';

// 주소 뒤에 /rest/v1 같은 경로나 공백이 붙어 있어도 https://xxxx.supabase.co 만 쓰도록 정리해요
const URL_ = (() => { const v = String(import.meta.env.VITE_SUPABASE_URL || '').trim(); try { return v ? new URL(v).origin : ''; } catch { return ''; } })();
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const sb = URL_ && KEY ? createClient(URL_, KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;
export const enabled = !!sb;

let user = null;

/* ---------- 로그인 ---------- */
export async function init() {
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  user = data.session?.user || null;
  return user;
}
export const userId = () => user?.id || null;
export const userName = () => {
  const m = user?.user_metadata || {};
  return m.nickname || m.name || m.full_name || m.preferred_username || '';
};
export const userEmail = () => user?.email || '';

export async function signInOAuth(provider) {
  const { error } = await sb.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin + window.location.pathname },
  });
  if (error) throw error;
}
/* 이메일 없이 바로 시작 (Supabase 익명 로그인). 세션은 이 기기·브라우저에 저장돼서 다음 방문 때도 그대로예요. */
export async function signInAnon() {
  const { data: cur } = await sb.auth.getSession();
  if (cur.session?.user) { user = cur.session.user; return user; }
  const { data, error } = await sb.auth.signInAnonymously();
  if (error) throw error;
  user = data.user || data.session?.user || null;
  return user;
}
export async function sendOtp(email) {
  const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) throw error;
}
export async function verifyOtp(email, token) {
  const { data, error } = await sb.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
  user = data.user || data.session?.user || null;
  return user;
}
export async function signOut() {
  await sb.auth.signOut();
  user = null;
}

/* ---------- 읽기 ---------- */
const hueOf = (s) => {
  const H = [32, 14, 44, 78, 352, 120];
  let h = 0;
  for (const c of String(s || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return H[h % H.length];
};
const mapBook = (r) => ({
  id: r.id,
  uid: r.user_id,
  isbn: r.isbn || '',
  title: r.title || '',
  author: r.author || '',
  publisher: r.publisher || '',
  cover: r.cover || '',
  age: r.age,
  rating: r.rating || 0,
  summary: r.summary || '',
  howTo: r.how_to || '',
  tags: r.tags || [],
  hue: r.hue ?? hueOf(r.title),
  curated: !!r.curated,
  source: r.source || '',
  at: Date.parse(r.created_at) || 0,
  likes: {},
});
const mapProfile = (r) => ({
  nickname: r.nickname,
  bio: r.bio || '',
  childAge: r.child_age || '',
  childBirth: r.child_birth || '',
  photoUrl: r.photo_url || '',
});

export async function loadAll() {
  const [b, l, c, p] = await Promise.all([
    sb.from('books').select('*').order('created_at', { ascending: false }).limit(2000),
    sb.from('likes').select('book_id,user_id').limit(20000),
    sb.from('comments').select('*').order('created_at', { ascending: true }).limit(5000),
    sb.from('profiles').select('*').limit(5000),
  ]);
  for (const r of [b, l, c, p]) if (r.error) throw r.error;
  const books = b.data.map(mapBook);
  const byId = new Map(books.map((x) => [x.id, x]));
  for (const lk of l.data) {
    const bk = byId.get(lk.book_id);
    if (bk) bk.likes[lk.user_id] = true;
  }
  const comments = {};
  for (const r of c.data) {
    (comments[r.book_id] = comments[r.book_id] || []).push({
      id: r.id, bookId: r.book_id, uid: r.user_id, text: r.text, at: Date.parse(r.created_at) || 0,
    });
  }
  const profiles = {};
  for (const r of p.data) profiles[r.id] = mapProfile(r);
  return { books, comments, profiles };
}

/* ---------- 쓰기 ---------- */
export async function addBook(d) {
  const { error } = await sb.from('books').insert({
    user_id: user.id,
    isbn: d.isbn || null,
    title: d.title,
    author: d.author || null,
    publisher: d.publisher || null,
    cover: d.cover || null,
    age: d.age,
    rating: d.rating || null,
    summary: d.summary,
    how_to: d.howTo || null,
    tags: d.tags || [],
    hue: d.hue ?? null,
    source: d.source || null,
  });
  if (error) throw error;
}
export async function setLike(bookId, on) {
  if (on) {
    const { error } = await sb.from('likes').upsert({ book_id: bookId, user_id: user.id }, { onConflict: 'book_id,user_id', ignoreDuplicates: true });
    if (error) throw error;
  } else {
    const { error } = await sb.from('likes').delete().match({ book_id: bookId, user_id: user.id });
    if (error) throw error;
  }
}
export async function addComment(bookId, text) {
  const { error } = await sb.from('comments').insert({ book_id: bookId, user_id: user.id, text });
  if (error) throw error;
}
// 세션이 늦게 잡히는 경우를 대비해 저장 직전에 한 번 더 확인해요
async function me() {
  if (!user) { const { data } = await sb.auth.getSession(); user = data.session?.user || null; }
  if (!user) throw new Error('로그인 세션이 없어요. [시작하기]를 다시 눌러주세요.');
  return user;
}
export async function saveProfile(p) {
  await me();
  const { error } = await sb.from('profiles').upsert({
    id: user.id,
    nickname: p.nickname,
    bio: p.bio || '',
    child_age: p.childAge || null,
    child_birth: p.childBirth || null,
    photo_url: p.photoUrl || null,
  });
  if (error) throw error;
}
export async function uploadAvatar(blob) {
  await me();
  const path = `${user.id}/avatar-${Date.now()}.jpg`;
  const { error } = await sb.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  return sb.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}
export async function loadGuide() {
  const { data } = await sb.from('guide_progress').select('checks').eq('user_id', user.id).maybeSingle();
  return data?.checks || null;
}
export async function saveGuide(checks) {
  await sb.from('guide_progress').upsert({ user_id: user.id, checks, updated_at: new Date().toISOString() });
}

/* ---------- 실시간: 다른 사람이 등록·좋아요·댓글하면 다시 불러와요 ---------- */
export function subscribe(onChange) {
  let t = null;
  const kick = () => { clearTimeout(t); t = setTimeout(onChange, 400); };
  const ch = sb.channel('bookle-live');
  for (const table of ['books', 'likes', 'comments', 'profiles']) {
    ch.on('postgres_changes', { event: '*', schema: 'public', table }, kick);
  }
  ch.subscribe();
  return () => sb.removeChannel(ch);
}

/* ---------- 서버 함수 ---------- */
export async function searchBooks(q) {
  const isbn = String(q).replace(/[^0-9Xx]/g, '');
  const qs = /^\d{10}(\d{3})?$/.test(isbn) ? 'isbn=' + isbn : 'q=' + encodeURIComponent(q);
  const r = await fetch('/api/book-search?' + qs);
  if (!r.ok) throw new Error('search ' + r.status);
  return (await r.json()).items || [];
}
export async function readCover(blob) {
  const b64 = await new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result).split(',')[1]);
    fr.onerror = rej;
    fr.readAsDataURL(blob);
  });
  const r = await fetch('/api/read-cover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: b64, mediaType: blob.type || 'image/jpeg' }),
  });
  if (!r.ok) return null;
  return r.json();
}
