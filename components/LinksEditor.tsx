"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useRef, useState } from "react";

import PlatformIcon from "@/components/PlatformIcon";
import { detectPlatform, fallbackLabel, normalizeUrl } from "@/lib/platform";
import type { LinkItem } from "@/lib/types";

/** "instagram.com/foo", "https://…", "me@you.com" 정도면 주소로 본다. */
function looksLikeUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || /\s/.test(trimmed)) return false;
  if (/^mailto:/i.test(trimmed) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return true;
  try {
    const url = new URL(normalizeUrl(trimmed));
    return url.hostname.includes(".");
  } catch {
    return false;
  }
}

export default function LinksEditor({
  name,
  defaultValue = [],
}: {
  /** 폼에 실려 나갈 hidden input 이름 (JSON 문자열) */
  name: string;
  defaultValue?: LinkItem[];
}) {
  const [links, setLinks] = useState<LinkItem[]>(defaultValue);
  const [quick, setQuick] = useState("");
  const [rejected, setRejected] = useState(0);
  // 새로 만든 줄에 바로 커서를 놓기 위한 표시
  const focusIndex = useRef<number | null>(null);

  function update(index: number, patch: Partial<LinkItem>) {
    setLinks((prev) => prev.map((link, i) => (i === index ? { ...link, ...patch } : link)));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= links.length) return;
    setLinks((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  /**
   * 붙여넣은 텍스트에서 주소를 뽑아 그대로 줄을 만든다.
   * 여러 줄을 한꺼번에 붙여넣으면 링크도 한꺼번에 생긴다.
   * (예전엔 "링크 추가" → 주소칸 클릭 → 붙여넣기 3단계였다)
   */
  function addFromText(text: string): number {
    const candidates = text
      .split(/[\s,]+/)
      .map((piece) => piece.trim())
      .filter(Boolean);

    const accepted = candidates.filter(looksLikeUrl);
    if (accepted.length === 0) return 0;

    setLinks((prev) => {
      // 이미 들어 있는 주소는 다시 넣지 않는다
      const seen = new Set(prev.map((link) => normalizeUrl(link.url)));
      const fresh: LinkItem[] = [];
      for (const raw of accepted) {
        const url = normalizeUrl(raw);
        if (seen.has(url)) continue;
        seen.add(url);
        fresh.push({ label: "", url });
      }
      return [...prev, ...fresh];
    });

    setRejected(candidates.length - accepted.length);
    return accepted.length;
  }

  function commitQuick() {
    if (addFromText(quick) > 0) setQuick("");
  }

  return (
    <div className="space-y-2.5">
      <input type="hidden" name={name} value={JSON.stringify(links)} />

      {/* 빠른 추가 — 붙여넣으면 그 자리에서 줄이 생긴다 */}
      <div className="flex items-center gap-2">
        <input
          className="input"
          value={quick}
          placeholder="주소를 붙여넣으세요 (여러 개 한꺼번에도 가능)"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setQuick(e.target.value)}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (!text.trim()) return;
            // 주소로 보이는 게 하나라도 있으면 입력칸에 남기지 않고 바로 줄로 만든다
            if (addFromText(text) > 0) {
              e.preventDefault();
              setQuick("");
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitQuick();
            }
          }}
          aria-label="주소 붙여넣어 링크 추가"
        />
        <button type="button" className="btn-ghost btn-field shrink-0" onClick={commitQuick} disabled={!quick.trim()}>
          <Plus className="h-4 w-4" />
          추가
        </button>
      </div>

      {rejected > 0 && (
        <p className="hint mt-0">주소 형식이 아닌 항목 {rejected}개는 건너뛰었습니다.</p>
      )}

      {links.length === 0 && (
        <p className="border-line text-ink-3 rounded-tds-lg border border-dashed px-4 py-7 text-center text-sm">
          아직 링크가 없습니다. 인스타그램·유튜브·틱톡 주소를 위 칸에 붙여넣어 보세요.
        </p>
      )}

      {links.map((link, index) => {
        const platform = detectPlatform(link.url);
        return (
          <div
            key={index}
            className="border-line rounded-tds-lg flex flex-col gap-2 border p-2.5 sm:flex-row sm:items-center"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${platform.color}1f`, color: platform.color }}
              title={platform.label}
            >
              <PlatformIcon platform={platform.key} className="h-[18px] w-[18px]" />
            </span>

            {/* 주소가 먼저다. 표시 이름은 비워 두면 플랫폼 이름이 자동으로 들어간다. */}
            <input
              className="input flex-1"
              placeholder="https://instagram.com/..."
              value={link.url}
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              autoFocus={focusIndex.current === index}
              onChange={(e) => update(index, { url: e.target.value })}
              aria-label={`링크 ${index + 1} 주소`}
            />
            <input
              className="input sm:max-w-[170px]"
              placeholder={fallbackLabel(link.url) || "표시 이름 (선택)"}
              value={link.label}
              onChange={(e) => update(index, { label: e.target.value })}
              aria-label={`링크 ${index + 1} 표시 이름`}
            />

            <div className="flex shrink-0 gap-1">
              <IconButton label="위로" onClick={() => move(index, -1)} disabled={index === 0}>
                <ArrowUp className="h-4 w-4" />
              </IconButton>
              <IconButton label="아래로" onClick={() => move(index, 1)} disabled={index === links.length - 1}>
                <ArrowDown className="h-4 w-4" />
              </IconButton>
              <IconButton
                label="삭제"
                danger
                onClick={() => setLinks((prev) => prev.filter((_, i) => i !== index))}
              >
                <X className="h-4 w-4" />
              </IconButton>
            </div>
          </div>
        );
      })}

      {links.length > 0 && (
        <button
          type="button"
          className="btn-ghost btn-sm"
          onClick={() => {
            focusIndex.current = links.length;
            setLinks((prev) => [...prev, { label: "", url: "" }]);
          }}
        >
          <Plus className="h-4 w-4" />
          직접 입력할 줄 추가
        </button>
      )}
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`icon-btn rounded-tds-md ${danger ? "text-danger hover:bg-danger-weak" : ""}`}
    >
      {children}
    </button>
  );
}
