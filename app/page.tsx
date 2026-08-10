import Link from "next/link";

import LinkButtons from "@/components/LinkButtons";
import SetupNotice from "@/components/SetupNotice";
import ThemeToggle from "@/components/ThemeToggle";
import { listPublicFolders } from "@/lib/queries";
import type { FolderWithCount } from "@/lib/types";

export const revalidate = 60;

export default async function HomePage() {
  let folders: FolderWithCount[] = [];
  let failure: string | null = null;

  try {
    folders = await listPublicFolders();
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
      <header className="mb-12 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Works</h1>
          <p className="mt-2 text-[15px] text-zinc-500 dark:text-zinc-400">
            지금 작업하고 있는 프로젝트들을 모아 뒀습니다.
          </p>
        </div>
        <ThemeToggle className="mt-1" />
      </header>

      {failure ? (
        <SetupNotice detail={failure} />
      ) : folders.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">아직 공개된 프로젝트가 없습니다.</p>
          <Link href="/admin" className="btn-ghost btn-sm mt-4">
            대시보드에서 폴더 만들기
          </Link>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder) => (
            <li key={folder.id}>
              <article className="card group h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
                <Link href={`/${encodeURIComponent(folder.slug)}`} className="block">
                  <div className="aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
                    {folder.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={folder.thumbnail_url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl font-black text-zinc-300 dark:text-zinc-700">
                        {folder.name.slice(0, 2)}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 p-5">
                    <h2 className="text-lg font-bold tracking-tight">{folder.name}</h2>
                    {folder.description && (
                      <p className="line-clamp-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                        {folder.description}
                      </p>
                    )}
                    <p className="pt-1 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                      글 {folder.post_count}개
                    </p>
                  </div>
                </Link>

                {folder.links.length > 0 && (
                  <div className="border-t border-zinc-100 px-5 py-3.5 dark:border-zinc-800">
                    <LinkButtons links={folder.links.slice(0, 4)} compact />
                  </div>
                )}
              </article>
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-16 border-t border-zinc-200 pt-6 text-center dark:border-zinc-800">
        <Link href="/admin" className="text-xs text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300">
          관리자
        </Link>
      </footer>
    </main>
  );
}
