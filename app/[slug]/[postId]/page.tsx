import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Gallery from "@/components/Gallery";
import LinkButtons from "@/components/LinkButtons";
import ThemeToggle from "@/components/ThemeToggle";
import { getPublicFolderBySlug, getPublicPost } from "@/lib/queries";

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
    <main className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
      <div className="mb-8 flex items-center justify-between">
        <Link
          href={`/${encodeURIComponent(folder.slug)}`}
          className="inline-flex min-w-0 items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 5-7 7 7 7" />
          </svg>
          <span className="truncate">{folder.name}</span>
        </Link>
        <ThemeToggle />
      </div>

      <header className="mb-7">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{post.title}</h1>
        {publishedAt && !Number.isNaN(publishedAt.getTime()) && (
          <time className="mt-2 block text-xs text-zinc-400 dark:text-zinc-500" dateTime={post.created_at}>
            {publishedAt.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
          </time>
        )}
      </header>

      {post.images.length > 0 && (
        <section className="mb-8">
          <Gallery images={post.images} alt={post.title} />
        </section>
      )}

      {post.body && (
        <section className="mb-8">
          <p className="prose-plain">{post.body}</p>
        </section>
      )}

      {post.links.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold tracking-widest text-zinc-400 uppercase dark:text-zinc-500">Links</h2>
          <LinkButtons links={post.links} />
        </section>
      )}
    </main>
  );
}
