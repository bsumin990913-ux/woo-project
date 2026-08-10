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
  theme_color   text not null default '#3182f6', -- 폴더별 핵심 컬러 (#rrggbb)
  published     boolean not null default true, -- 비공개면 목록/페이지에서 숨김
  views         bigint not null default 0,     -- 이 폴더 페이지 조회수
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
  views       bigint not null default 0,            -- 이 글 조회수
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── 사이트 전역 설정(항상 한 줄만 존재) ─────────────────────
create table if not exists public.settings (
  id              smallint primary key default 1,
  index_published boolean not null default true, -- 첫 화면(/)의 전체 목록 공개 여부
  updated_at      timestamptz not null default now(),
  constraint settings_single_row check (id = 1)
);

insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ── 기존에 만들어 둔 테이블을 위한 추가 컬럼 ────────────────
--   (이미 테이블을 만든 뒤라면 이 줄들이 새 컬럼을 붙여 줍니다)
alter table public.folders
  add column if not exists theme_color text not null default '#3182f6';
alter table public.folders
  add column if not exists views bigint not null default 0;
alter table public.posts
  add column if not exists views bigint not null default 0;

-- ── 조회수 +1 (동시에 여러 명이 봐도 안전하게) ──────────────
create or replace function public.increment_view(p_kind text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_kind = 'folder' then
    update public.folders set views = views + 1 where id = p_id and published = true;
  elsif p_kind = 'post' then
    update public.posts set views = views + 1 where id = p_id and published = true;
  end if;
end $$;

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
alter table public.folders  enable row level security;
alter table public.posts    enable row level security;
alter table public.settings enable row level security;

drop policy if exists "public read settings" on public.settings;
create policy "public read settings"
  on public.settings for select
  to anon, authenticated
  using (true);

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
