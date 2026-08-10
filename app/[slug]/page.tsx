import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import LinkButtons from "@/components/LinkButtons";
import ThemeToggle from "@/components/ThemeToggle";
import { getPublicFolderBySlug, listPublicPosts } from "@/lib/queries";

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

export default async function FolderPage({ params }: Params) {
  const { slug } = await params;
  const folder = await loadFolder(slug);
  if (!folder) notFound();

  const posts = await listPublicPosts(folder.id);

  return (
    <main className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 5-7 7 7 7" />
          </svg>
          전체 목록
        </Link>
        <ThemeToggle />
      </div>

      <header className="mb-10 text-center">
        {folder.thumbnail_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={folder.thumbnail_url}
            alt=""
            className="mx-auto mb-5 h-24 w-24 rounded-2xl border border-zinc-200 object-cover shadow-sm dark:border-zinc-800"
          />
        )}
        <h1 className="text-3xl font-extrabold tracking-tight">{folder.name}</h1>
        {folder.description && (
          <p className="mx-auto mt-2.5 max-w-md text-[15px] leading-7 text-zinc-500 dark:text-zinc-400">
            {folder.description}
          </p>
        )}
      </header>

      {folder.links.length > 0 && (
        <section className="mb-10">
          <LinkButtons links={folder.links} />
        </section>
      )}

      {folder.intro && (
        <section className="card mb-10 p-6">
          <h2 className="mb-3 text-xs font-bold tracking-widest text-zinc-400 uppercase dark:text-zinc-500">About</h2>
          <p className="prose-plain">{folder.intro}</p>
        </section>
      )}

      {posts.length > 0 && (
        <section>
          <h2 className="mb-4 text-xs font-bold tracking-widest text-zinc-400 uppercase dark:text-zinc-500">
            Posts · {posts.length}
          </h2>

          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.id}>
                <article className="card overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <Link href={`/${encodeURIComponent(folder.slug)}/${post.id}`} className="flex gap-4 p-4">
                    {post.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.images[0]}
                        alt=""
                        loading="lazy"
                        className="h-20 w-20 shrink-0 rounded-xl object-cover sm:h-24 sm:w-24"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-300 sm:h-24 sm:w-24 dark:bg-zinc-800 dark:text-zinc-600">
                        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <path d="M6.5 3.5h6.6l4.9 4.9v12.1H6.5z" strokeLinejoin="round" />
                          <path d="M13 3.5v5h5" />
                        </svg>
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold">{post.title}</h3>
                      {post.body && (
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                          {post.body}
                        </p>
                      )}
                      <p className="mt-2 flex items-center gap-2.5 text-xs text-zinc-400 dark:text-zinc-500">
                        {post.images.length > 0 && <span>사진 {post.images.length}장</span>}
                        {post.links.length > 0 && <span>링크 {post.links.length}개</span>}
                      </p>
                    </div>
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        </section>
      )}

      {posts.length === 0 && folder.links.length === 0 && !folder.intro && (
        <p className="py-16 text-center text-sm text-zinc-400">아직 등록된 내용이 없습니다.</p>
      )}
    </main>
  );
}
