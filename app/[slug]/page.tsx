import { ChevronRight, Eye, FileText, Images, Link2 } from "lucide-react";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import LinkButtons from "@/components/LinkButtons";
import ThemeToggle from "@/components/ThemeToggle";
import ViewCounter from "@/components/ViewCounter";
import ShareButton from "@/components/ShareButton";
import ScrollToTop from "@/components/ScrollToTop";
import { getPublicFolderBySlug, listPublicPosts, listPublicSlugs } from "@/lib/queries";
import { brandStyle } from "@/lib/theme";

export const revalidate = 60;

/** 공개된 폴더는 빌드 시 미리 만들어 둔다 → 방문 시 DB 왕복 없이 바로 뜬다.
 *  목록에 없는 새 폴더는 첫 방문 때 생성된 뒤 캐시된다. */
export async function generateStaticParams() {
  return (await listPublicSlugs()).map((slug) => ({ slug }));
}

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
      <ViewCounter kind="folder" id={folder.id} />

      <div className="brand-hero">
        <div className="mx-auto max-w-lg px-5 pt-4 pb-10">
          <div className="mb-6 flex items-center justify-end gap-2">
            <ShareButton title={folder.name} />
            <ThemeToggle />
          </div>

          {/* 프로필 */}
          <div className="rise flex flex-col items-center text-center">
            {folder.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={folder.thumbnail_url}
                alt=""
                className="border-surface shadow-card mb-4 h-[104px] w-[104px] rounded-full border-4 object-cover"
              />
            ) : (
              <span className="bg-brand text-on-brand shadow-card mb-4 flex h-[104px] w-[104px] items-center justify-center rounded-full text-3xl font-black tracking-tight">
                {folder.name.slice(0, 2)}
              </span>
            )}

            <h1 className="t-h2 text-ink text-balance">{folder.name}</h1>
            {folder.description && <p className="t-sub mt-2 max-w-sm text-balance text-[14px]">{folder.description}</p>}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-6 px-5 pb-16">
        {folder.links.length > 0 && (
          <section>
            <h2 className="t-eyebrow mb-2.5 px-1">Links</h2>
            <LinkButtons links={folder.links} variant={folder.links.length === 1 ? "row" : "grid"} />
          </section>
        )}

        {folder.intro && (
          <section className="card p-5">
            <h2 className="t-eyebrow mb-2.5">About</h2>
            <p className="prose-plain text-[15px] leading-[26px]">{folder.intro}</p>
          </section>
        )}

        {posts.length > 0 && (
          <section>
            <div className="mb-2.5 flex items-baseline justify-between px-1">
              <h2 className="t-eyebrow">Posts</h2>
              <span className="t-caption">{posts.length}개</span>
            </div>

            <ul className="space-y-2.5">
              {posts.map((post, index) => (
                <li key={post.id} className="rise" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
                  <Link href={`/${encodeURIComponent(folder.slug)}/${post.id}`} className="list-row group">
                    {post.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.images[0]}
                        alt=""
                        loading="lazy"
                        className="rounded-tds-lg h-14 w-14 shrink-0 object-cover"
                      />
                    ) : (
                      <span className="rounded-tds-lg bg-brand-weak text-brand flex h-14 w-14 shrink-0 items-center justify-center">
                        <FileText className="h-5 w-5" strokeWidth={1.7} />
                      </span>
                    )}

                    <span className="min-w-0 flex-1">
                      <span className="text-ink block truncate text-[15px] leading-6 font-bold">{post.title}</span>
                      {post.body && (
                        <span className="text-ink-2 mt-0.5 line-clamp-1 block text-[13px] leading-5">{post.body}</span>
                      )}
                      <span className="text-ink-3 mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] font-semibold">
                        {postDate(post.created_at) && <span>{postDate(post.created_at)}</span>}
                        {post.images.length > 0 && <Meta icon={Images} value={post.images.length} />}
                        {post.links.length > 0 && <Meta icon={Link2} value={post.links.length} />}
                        <Meta icon={Eye} value={post.views} />
                      </span>
                    </span>

                    <ChevronRight className="text-ink-3 group-hover:text-brand h-[18px] w-[18px] shrink-0 transition-all group-hover:translate-x-0.5" />
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
      <ScrollToTop />
    </main>
  );
}

/** 작업 기록이라 목록에서 언제 올린 글인지 보이는 게 낫다. 올해 글은 연도를 생략한다. */
function postDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;

  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("ko-KR", {
    year: sameYear ? undefined : "2-digit",
    month: "long",
    day: "numeric",
  });
}

function Meta({ icon: Icon, value }: { icon: typeof Eye; value: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      {value.toLocaleString("ko-KR")}
    </span>
  );
}
