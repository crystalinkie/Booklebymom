-- Supabase 표(Table Editor)나 CSV로 책을 올릴 때 ISBN·나이대만 넣어도 되게 해요.
-- 제목·작가·출판사·표지는 앱과 /api/fill-covers 가 ISBN으로 자동으로 채워요.
alter table public.books alter column title drop not null;
alter table public.books alter column summary set default '';
alter table public.books alter column summary drop not null;
