import { ChevronLeft, Eye, Images, Link2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Gallery from "@/components/Gallery";
import LinkButtons from "@/components/LinkButtons";
import ScrollToTop from "@/components/ScrollToTop";
import ShareButton from "@/components/ShareButton";
import ThemeToggle from "@/components/ThemeToggle";
import ViewCounter from "@/components/ViewCounter";
import { getPublicFolderBySlug, getPublicPost, listPublicPostParams } from "@/lib/queries";
import { brandStyle } from "@/lib/theme";

export const revalidate = 60;

/** 공개된 글은 빌드 시 미리 만들어 둔다 → 목록에서 눌렀을 때 바로 뜬다. */
export async function generateStaticParams() {
  return listPublicPostParams();
}

type Params = { params: Promise<{ slug: string; postId: string }> };

async function load(rawSlug: string, postId: string) {
  const slug = decodeURIComponent(rawSlug);
  try {
    const folder = await getPublicFolderBySlug(slug);
    if (!folder) return null;
    const post = await getPublicPost(folder.id, postId);
    if (!post) return null;
    return { folder, post };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, postId } = await params;
  const found = await load(slug, postId);
  if (!found) return { title: "찾을 수 없는 글" };

  return {
    title: `${found.post.title} · ${found.folder.name}`,
    description: found.post.body.slice(0, 120) || undefined,
    openGraph: {
      title: found.post.title,
      description: found.post.body.slice(0, 120) || undefined,
      images: found.post.images[0] ? [found.post.images[0]] : undefined,
    },
  };
}

export default async function PostPage({ params }: Params) {
  const { slug, postId } = await params;
  const found = await load(slug, postId);
  if (!found) notFound();

  const { folder, post } = found;
  const publishedAt = post.created_at ? new Date(post.created_at) : null;

  return (
    <main className="theme bg-canvas min-h-screen" style={brandStyle(folder.theme_color)}>
      <ViewCounter kind="post" id={post.id} />

      <div className="brand-glow">
        <div className="mx-auto max-w-2xl px-5 pt-5 pb-8">
          <div className="mb-9 flex items-center justify-between gap-3">
            <Link href={`/${encodeURIComponent(folder.slug)}`} className="chip tap min-w-0">
              <ChevronLeft className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{folder.name}</span>
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <ShareButton title={post.title} text={post.body.slice(0, 80) || undefined} />
              <ThemeToggle />
            </div>
          </div>

          <header className="rise">
            <h1 className="t-h2 text-ink text-balance">{post.title}</h1>
            <div className="t-caption mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              {publishedAt && !Number.isNaN(publishedAt.getTime()) && (
                <time dateTime={post.created_at}>
                  {publishedAt.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                </time>
              )}
              {post.images.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Images className="h-3.5 w-3.5" strokeWidth={2} />
                  {post.images.length}
                </span>
              )}
              {post.links.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Link2 className="h-3.5 w-3.5" strokeWidth={2} />
                  {post.links.length}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" strokeWidth={2} />
                {post.views.toLocaleString("ko-KR")}
              </span>
            </div>
          </header>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-5 pb-20">
        {post.images.length > 0 && (
          <section className="mb-8">
            <Gallery images={post.images} alt={post.title} />
          </section>
        )}

        {post.body && (
          <section className="mb-10">
            <p className="prose-plain">{post.body}</p>
          </section>
        )}

        {post.links.length > 0 && (
          <section>
            <h2 className="t-eyebrow mb-3">Links</h2>
            <LinkButtons links={post.links} variant={post.links.length === 1 ? "row" : "grid"} />
          </section>
        )}

        <div className="border-line mt-14 border-t pt-6">
          <Link href={`/${encodeURIComponent(folder.slug)}`} className="btn-weak btn-block">
            {folder.name} 페이지로 돌아가기
          </Link>
        </div>
      </div>
      <ScrollToTop />
    </main>
  );
}
