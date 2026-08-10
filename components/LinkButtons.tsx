import PlatformIcon from "@/components/PlatformIcon";
import { detectPlatform, fallbackLabel, normalizeUrl } from "@/lib/platform";
import type { LinkItem } from "@/lib/types";

export default function LinkButtons({ links, compact = false }: { links: LinkItem[]; compact?: boolean }) {
  if (links.length === 0) return null;

  return (
    <ul className={compact ? "flex flex-wrap gap-2" : "space-y-2.5"}>
      {links.map((link, index) => {
        const platform = detectPlatform(link.url);
        const label = link.label.trim() || fallbackLabel(link.url);

        if (compact) {
          return (
            <li key={index}>
              <a
                href={normalizeUrl(link.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <span style={{ color: platform.color }}>
                  <PlatformIcon platform={platform.key} className="h-3.5 w-3.5" />
                </span>
                {label}
              </a>
            </li>
          );
        }

        return (
          <li key={index}>
            <a
              href={normalizeUrl(link.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3.5 rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${platform.color}1f`, color: platform.color }}
              >
                <PlatformIcon platform={platform.key} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
                  {label}
                </span>
                <span className="block truncate text-xs text-zinc-400 dark:text-zinc-500">
                  {prettyUrl(link.url)}
                </span>
              </span>

              <span className="shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 dark:text-zinc-600">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 5 7 7-7 7" />
                </svg>
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function prettyUrl(raw: string): string {
  try {
    const url = new URL(normalizeUrl(raw));
    if (url.protocol === "mailto:") return url.pathname;
    return (url.hostname.replace(/^www\./, "") + url.pathname).replace(/\/$/, "");
  } catch {
    return raw;
  }
}
