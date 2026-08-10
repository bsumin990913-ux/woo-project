import { ChevronRight } from "lucide-react";

import PlatformIcon from "@/components/PlatformIcon";
import { detectPlatform, fallbackLabel, normalizeUrl } from "@/lib/platform";
import type { LinkItem } from "@/lib/types";

type Variant = "grid" | "row" | "chips";

/**
 * variant
 * - grid  : 2열 압축 타일. SNS 여러 개가 한 줄씩 차지하지 않게 한다. (기본)
 * - row   : 한 줄 전체를 쓰는 큰 타일. 링크가 1~2개일 때만 어울린다.
 * - chips : 카드 안에 들어가는 아주 작은 알약 (홈 카드용)
 */
export default function LinkButtons({
  links,
  variant = "grid",
  compact = false,
}: {
  links: LinkItem[];
  variant?: Variant;
  /** 예전 호출부 호환용. true 면 chips 와 같다. */
  compact?: boolean;
}) {
  if (links.length === 0) return null;
  const mode: Variant = compact ? "chips" : variant;

  if (mode === "chips") {
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

  if (mode === "grid") {
    return (
      // 아주 좁은 화면(≈360px 이하)에서는 한 줄에 하나씩.
      // 2열로 밀어 넣으면 "인스타그램 서브계정" 같은 라벨이 뭉텅 잘린다.
      <ul className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
        {links.map((link, index) => {
          const platform = detectPlatform(link.url);
          const label = link.label.trim() || fallbackLabel(link.url);
          // 홀수 개일 때 마지막 하나는 남은 폭을 다 쓰게 해 빈칸을 없앤다
          const fillsRow = links.length % 2 === 1 && index === links.length - 1;

          return (
            <li
              key={index}
              className={`rise ${fillsRow ? "min-[380px]:col-span-2" : ""}`}
              style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
            >
              <a href={normalizeUrl(link.url)} target="_blank" rel="noopener noreferrer" className="link-chip">
                <span
                  className="rounded-tds-md flex h-9 w-9 shrink-0 items-center justify-center"
                  style={{ backgroundColor: `${platform.color}1f`, color: platform.color }}
                >
                  <PlatformIcon platform={platform.key} className="h-[18px] w-[18px]" />
                </span>
                <span className="text-ink min-w-0 flex-1 truncate text-[14px] font-bold">{label}</span>
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
