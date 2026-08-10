import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Gallery from "@/components/Gallery";
import LinkButtons from "@/components/LinkButtons";
import ThemeToggle from "@/components/ThemeToggle";
import { getPublicFolderBySlug, getPublicPost } from "@/lib/queries";
import { brandStyle } from "@/lib/theme";

export const revalidate = 60;

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
      <div className="brand-glow">
        <div className="mx-auto max-w-2xl px-5 pt-5 pb-8">
          <div className="mb-9 flex items-center justify-between gap-3">
            <Link href={`/${encodeURIComponent(folder.slug)}`} className="chip min-w-0">
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 5-7 7 7 7" />
              </svg>
              <span className="truncate">{folder.name}</span>
            </Link>
            <ThemeToggle />
          </div>

          <header className="rise">
            <h1 className="t-h2 text-ink text-balance">{post.title}</h1>
            {publishedAt && !Number.isNaN(publishedAt.getTime()) && (
              <time className="t-caption mt-2.5 block" dateTime={post.created_at}>
                {publishedAt.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
              </time>
            )}
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
            <h2 className="t-eyebrow mb-4">Links</h2>
            <LinkButtons links={post.links} />
          </section>
        )}

        <div className="border-line mt-14 border-t pt-6">
          <Link href={`/${encodeURIComponent(folder.slug)}`} className="btn-weak btn-block">
            {folder.name} 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}
