-- ============================================================
--  woo-links · Supabase 스키마
--  Supabase 대시보드 → SQL Editor 에 통째로 붙여넣고 Run 하세요.
--  (여러 번 실행해도 안전합니다)
-- ============================================================

create extension if not exists "pgcrypto";

-- ── 폴더(= 공개 페이지 1개) ─────────────────────────────────
create table if not exists public.folders (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,          -- 공개 주소: /내슬러그
  name          text not null,                 -- 폴더명
  description   text not null default '',      -- 한 줄 설명
  intro         text not null default '',      -- 소개글(여러 줄)
  thumbnail_url text,                          -- 썸네일 이미지
  links         jsonb not null default '[]'::jsonb, -- [{label,url}]
  published     boolean not null default true, -- 비공개면 목록/페이지에서 숨김
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── 글(폴더 안에 쌓이는 항목) ───────────────────────────────
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  folder_id   uuid not null references public.folders(id) on delete cascade,
  title       text not null,                        -- 제목
  links       jsonb not null default '[]'::jsonb,   -- [{label,url}]
  images      jsonb not null default '[]'::jsonb,   -- ["https://...", ...]
  body        text not null default '',             -- 소개
  published   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists posts_folder_id_idx on public.posts (folder_id);
create index if not exists folders_sort_idx    on public.folders (sort_order, created_at desc);
create index if not exists posts_sort_idx      on public.posts (folder_id, sort_order, created_at desc);

-- ── updated_at 자동 갱신 ────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists folders_touch on public.folders;
create trigger folders_touch before update on public.folders
  for each row execute function public.touch_updated_at();

drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

-- ── RLS: 방문자(anon)는 "공개된 것만 읽기" 만 가능 ──────────
--   쓰기/수정/삭제는 service_role 키(서버 전용)만 가능하며,
--   service_role 은 RLS 를 우회하므로 별도 정책이 필요 없습니다.
alter table public.folders enable row level security;
alter table public.posts   enable row level security;

drop policy if exists "public read published folders" on public.folders;
create policy "public read published folders"
  on public.folders for select
  to anon, authenticated
  using (published = true);

drop policy if exists "public read published posts" on public.posts;
create policy "public read published posts"
  on public.posts for select
  to anon, authenticated
  using (
    published = true
    and exists (select 1 from public.folders f where f.id = folder_id and f.published = true)
  );

-- ── 이미지 저장용 퍼블릭 버킷 ───────────────────────────────
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;
