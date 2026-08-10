import Link from "next/link";

import LinkButtons from "@/components/LinkButtons";
import SetupNotice from "@/components/SetupNotice";
import ThemeToggle from "@/components/ThemeToggle";
import { listPublicFolders } from "@/lib/queries";
import { brandStyle } from "@/lib/theme";
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
    <main className="min-h-screen">
      <div className="brand-hero">
        <div className="mx-auto max-w-5xl px-5 pt-6 pb-14 sm:pt-8 sm:pb-20">
          <div className="mb-12 flex items-center justify-between sm:mb-16">
            <span className="text-ink flex items-center gap-2 text-[15px] font-extrabold tracking-tight">
              <span className="bg-brand text-on-brand flex h-7 w-7 items-center justify-center rounded-[9px] text-xs">
                W
              </span>
              Works
            </span>
            <ThemeToggle />
          </div>

          <div className="rise max-w-xl">
            <p className="badge badge-brand mb-4">{folders.length}개의 프로젝트</p>
            <h1 className="t-h1 text-ink text-balance">
              지금 만들고 있는 것들을
              <br />
              한곳에 모았습니다.
            </h1>
            <p className="t-sub mt-4">
              폴더 하나가 프로젝트 하나예요. 눌러서 링크와 작업 기록을 확인해 보세요.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 pb-20">
        {failure ? (
          <SetupNotice detail={failure} />
        ) : folders.length === 0 ? (
          <div className="card px-6 py-16 text-center">
            <p className="t-sub">아직 공개된 프로젝트가 없습니다.</p>
            <Link href="/admin" className="btn-weak mt-5 inline-flex">
              대시보드에서 폴더 만들기
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {folders.map((folder, index) => (
              <li
                key={folder.id}
                className="theme rise"
                style={{ ...brandStyle(folder.theme_color), animationDelay: `${Math.min(index, 9) * 55}ms` }}
              >
                <article className="card group hover:border-brand-line flex h-full flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-card">
                  <Link href={`/${encodeURIComponent(folder.slug)}`} className="block">
                    <div className="bg-brand-weak relative aspect-[16/10] w-full overflow-hidden">
                      {folder.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={folder.thumbnail_url}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <span className="text-brand/35 absolute inset-0 flex items-center justify-center text-4xl font-black tracking-tight">
                          {folder.name.slice(0, 2)}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 px-5 pt-5">
                      <h2 className="t-h3 text-ink truncate">{folder.name}</h2>
                      {folder.description && (
                        <p className="text-ink-2 line-clamp-2 text-[14px] leading-6">{folder.description}</p>
                      )}
                    </div>
                  </Link>

                  <div className="mt-auto flex items-center gap-2 px-5 pt-4 pb-5">
                    <span className="badge badge-brand">글 {folder.post_count}</span>
                    {folder.links.length > 0 && <span className="badge">링크 {folder.links.length}</span>}
                    <span className="text-ink-3 group-hover:text-brand ml-auto text-[13px] font-semibold transition-colors">
                      /{folder.slug}
                    </span>
                  </div>

                  {folder.links.length > 0 && (
                    <div className="border-line border-t px-5 py-3.5">
                      <LinkButtons links={folder.links.slice(0, 4)} compact />
                    </div>
                  )}
                </article>
              </li>
            ))}
          </ul>
        )}

        <footer className="border-line mt-16 border-t pt-6 text-center">
          <Link href="/admin" className="text-ink-3 hover:text-ink text-xs font-medium transition-colors">
            관리자
          </Link>
        </footer>
      </div>
    </main>
  );
}
