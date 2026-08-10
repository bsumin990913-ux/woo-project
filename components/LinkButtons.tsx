import { ChevronRight } from "lucide-react";

import PlatformIcon from "@/components/PlatformIcon";
import { detectPlatform, fallbackLabel, normalizeUrl } from "@/lib/platform";
import type { LinkItem } from "@/lib/types";

export default function LinkButtons({ links, compact = false }: { links: LinkItem[]; compact?: boolean }) {
  if (links.length === 0) return null;

  if (compact) {
    return (
      <ul className="flex flex-wrap gap-1.5">
        {links.map((link, index) => {
          const platform = detectPlatform(link.url);
          return (
            <li key={index}>
              <a href={normalizeUrl(link.url)} target="_blank" rel="noopener noreferrer" className="chip">
                <span style={{ color: platform.color }}>
                  <PlatformIcon platform={platform.key} className="h-3.5 w-3.5" />
                </span>
                {link.label.trim() || fallbackLabel(link.url)}
              </a>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="space-y-2.5">
      {links.map((link, index) => {
        const platform = detectPlatform(link.url);
        const label = link.label.trim() || fallbackLabel(link.url);

        return (
          <li key={index} className="rise" style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>
            <a href={normalizeUrl(link.url)} target="_blank" rel="noopener noreferrer" className="link-tile group">
              <span
                className="rounded-tds-md flex h-11 w-11 shrink-0 items-center justify-center"
                style={{ backgroundColor: `${platform.color}1f`, color: platform.color }}
              >
                <PlatformIcon platform={platform.key} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="text-ink block truncate text-[15px] leading-6 font-bold">{label}</span>
                <span className="text-ink-3 block truncate text-[13px] leading-5">{prettyUrl(link.url)}</span>
              </span>

              <ChevronRight className="text-ink-3 group-hover:text-brand h-[18px] w-[18px] shrink-0 transition-all group-hover:translate-x-0.5" />
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
