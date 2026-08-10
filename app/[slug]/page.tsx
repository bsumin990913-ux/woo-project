import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import LinkButtons from "@/components/LinkButtons";
import ThemeToggle from "@/components/ThemeToggle";
import { getPublicFolderBySlug, listPublicPosts } from "@/lib/queries";
import { brandStyle } from "@/lib/theme";

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

async function loadFolder(rawSlug: string) {
  const slug = decodeURIComponent(rawSlug);
  try {
    return await getPublicFolderBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const folder = await loadFolder(slug);
  if (!folder) return { title: "찾을 수 없는 페이지" };

  return {
    title: folder.name,
    description: folder.description || folder.intro.slice(0, 120) || undefined,
    openGraph: {
      title: folder.name,
      description: folder.description || undefined,
      images: folder.thumbnail_url ? [folder.thumbnail_url] : undefined,
    },
  };
}

/** 모바일 브라우저 상단바까지 폴더 색으로 맞춘다 */
export async function generateViewport({ params }: Params): Promise<Viewport> {
  const { slug } = await params;
  const folder = await loadFolder(slug);
  return { themeColor: folder?.theme_color ?? "#3182f6" };
}

export default async function FolderPage({ params }: Params) {
  const { slug } = await params;
  const folder = await loadFolder(slug);
  if (!folder) notFound();

  const posts = await listPublicPosts(folder.id);

  return (
    <main className="theme bg-canvas min-h-screen" style={brandStyle(folder.theme_color)}>
      {/* ── 브랜드 히어로 ─────────────────────────────────── */}
      <header className="brand-hero relative overflow-hidden">
        <div className="mx-auto max-w-2xl px-5 pt-5 pb-16">
          <div className="mb-10 flex items-center justify-between">
            <Link href="/" className="chip">
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 5-7 7 7 7" />
              </svg>
              전체 목록
            </Link>
            <ThemeToggle />
          </div>

          <div className="rise flex flex-col items-center text-center">
            {folder.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={folder.thumbnail_url}
                alt=""
                className="rounded-sheet border-canvas mb-5 h-24 w-24 border-4 object-cover shadow-card"
              />
            ) : (
              <span className="rounded-sheet bg-brand text-on-brand shadow-card mb-5 flex h-24 w-24 items-center justify-center text-2xl font-black tracking-tight">
                {folder.name.slice(0, 2)}
              </span>
            )}

            <h1 className="t-h2 text-ink text-balance">{folder.name}</h1>
            {folder.description && <p className="t-sub mt-2.5 max-w-md text-balance">{folder.description}</p>}

            <div className="mt-5 flex items-center gap-2">
              {folder.links.length > 0 && <span className="badge badge-brand">링크 {folder.links.length}</span>}
              {posts.length > 0 && <span className="badge">글 {posts.length}</span>}
            </div>
          </div>
        </div>
      </header>

      {/* ── 본문 시트 ─────────────────────────────────────── */}
      <div className="sheet relative -mt-8">
        <div className="mx-auto max-w-2xl px-5 pt-4 pb-20">
          <div className="sheet-grabber mb-8" />

          {folder.links.length > 0 && (
            <section className="mb-10">
              <LinkButtons links={folder.links} />
            </section>
          )}

          {folder.intro && (
            <section className="card-flat mb-10 p-5 sm:p-6">
              <h2 className="t-eyebrow mb-3">About</h2>
              <p className="prose-plain">{folder.intro}</p>
            </section>
          )}

          {posts.length > 0 && (
            <section>
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="t-eyebrow">Posts</h2>
                <span className="t-caption">{posts.length}개</span>
              </div>

              <ul className="space-y-2.5">
                {posts.map((post, index) => (
                  <li key={post.id} className="rise" style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>
                    <Link href={`/${encodeURIComponent(folder.slug)}/${post.id}`} className="link-tile group !gap-4">
                      {post.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.images[0]}
                          alt=""
                          loading="lazy"
                          className="rounded-tds-lg h-[68px] w-[68px] shrink-0 object-cover"
                        />
                      ) : (
                        <span className="rounded-tds-lg bg-brand-weak text-brand flex h-[68px] w-[68px] shrink-0 items-center justify-center">
                          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                            <path d="M6.5 3.5h6.6l4.9 4.9v12.1H6.5z" strokeLinejoin="round" />
                            <path d="M13 3.5v5h5" />
                          </svg>
                        </span>
                      )}

                      <span className="min-w-0 flex-1 py-0.5">
                        <span className="text-ink block truncate text-[15px] leading-6 font-bold">{post.title}</span>
                        {post.body && (
                          <span className="text-ink-2 mt-0.5 line-clamp-2 block text-[13px] leading-5">{post.body}</span>
                        )}
                        <span className="text-ink-3 mt-1.5 flex items-center gap-2 text-[12px] font-medium">
                          {post.images.length > 0 && <span>사진 {post.images.length}</span>}
                          {post.links.length > 0 && <span>링크 {post.links.length}</span>}
                        </span>
                      </span>

                      <span className="text-ink-3 group-hover:text-brand shrink-0 transition-all group-hover:translate-x-0.5">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-[18px] w-[18px]"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m9 5 7 7-7 7" />
                        </svg>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {posts.length === 0 && folder.links.length === 0 && !folder.intro && (
            <p className="t-sub py-16 text-center">아직 등록된 내용이 없습니다.</p>
          )}
        </div>
      </div>
    </main>
  );
}
