-- Bookle 데이터베이스 (Supabase → SQL Editor 에서 한 번에 실행)
-- 둘러보기는 누구나, 쓰기(등록·좋아요·댓글·프로필)는 로그인한 본인만.

-- ---------- 프로필 ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 20),
  bio text default '' check (char_length(bio) <= 150),
  child_age text check (child_age in ('0-2','3-4','5-6','7+')),
  child_birth text check (child_birth ~ '^\d{4}-\d{2}$'),   -- 'YYYY-MM' (영어 가이드 단계 계산)
  photo_url text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select using (true);
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);

-- ---------- 책 (추천 한 건 = 한 줄. 같은 ISBN은 화면에서 카드 하나로 묶어요) ----------
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  isbn text,
  title text not null,
  author text,
  publisher text,
  cover text,
  age text not null check (age in ('0-2','3-4','5-6','7+')),
  rating int check (rating between 1 and 5),
  summary text not null,
  how_to text,
  tags text[] default '{}',
  hue int,
  source text,
  curated boolean default false,     -- 구글 시트로 올린 운영자 추천
  published boolean default true,    -- 시트에서 공개=N 이면 숨김
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists books_isbn_idx on public.books (isbn);
create index if not exists books_user_idx on public.books (user_id);
-- 한 사람이 같은 책을 두 번 추천하지 않게 + 구글 시트 동기화(같은 ISBN 덮어쓰기)의 기준
create unique index if not exists books_user_isbn_uniq on public.books (user_id, isbn);

alter table public.books enable row level security;
drop policy if exists "books readable" on public.books;
create policy "books readable" on public.books for select using (published or auth.uid() = user_id);
drop policy if exists "books insert own" on public.books;
create policy "books insert own" on public.books for insert with check (auth.uid() = user_id and curated = false);
drop policy if exists "books update own" on public.books;
create policy "books update own" on public.books for update using (auth.uid() = user_id and curated = false);
drop policy if exists "books delete own" on public.books;
create policy "books delete own" on public.books for delete using (auth.uid() = user_id and curated = false);

-- ---------- 좋아요 ----------
create table if not exists public.likes (
  book_id uuid references public.books on delete cascade,
  user_id uuid references auth.users on delete cascade,
  created_at timestamptz default now(),
  primary key (book_id, user_id)
);
alter table public.likes enable row level security;
drop policy if exists "likes readable" on public.likes;
create policy "likes readable" on public.likes for select using (true);
drop policy if exists "likes insert own" on public.likes;
create policy "likes insert own" on public.likes for insert with check (auth.uid() = user_id);
drop policy if exists "likes delete own" on public.likes;
create policy "likes delete own" on public.likes for delete using (auth.uid() = user_id);

-- ---------- 댓글 ----------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  text text not null check (char_length(text) between 1 and 300),
  created_at timestamptz default now()
);
create index if not exists comments_book_idx on public.comments (book_id);
alter table public.comments enable row level security;
drop policy if exists "comments readable" on public.comments;
create policy "comments readable" on public.comments for select using (true);
drop policy if exists "comments insert own" on public.comments;
create policy "comments insert own" on public.comments for insert with check (auth.uid() = user_id);
drop policy if exists "comments delete own" on public.comments;
create policy "comments delete own" on public.comments for delete using (auth.uid() = user_id);

-- ---------- 영어 가이드 체크리스트 (본인만) ----------
create table if not exists public.guide_progress (
  user_id uuid primary key references auth.users on delete cascade,
  checks jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table public.guide_progress enable row level security;
drop policy if exists "guide own" on public.guide_progress;
create policy "guide own" on public.guide_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- 프로필 사진 저장소 ----------
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;
drop policy if exists "avatars upload own" on storage.objects;
create policy "avatars upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "avatars update own" on storage.objects;
create policy "avatars update own" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ---------- 실시간 (다른 사람의 등록·좋아요·댓글이 바로 보이게) ----------
do $$
begin
  begin alter publication supabase_realtime add table public.books; exception when others then null; end;
  begin alter publication supabase_realtime add table public.likes; exception when others then null; end;
  begin alter publication supabase_realtime add table public.comments; exception when others then null; end;
  begin alter publication supabase_realtime add table public.profiles; exception when others then null; end;
end $$;
