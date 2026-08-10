"use client";

import { useState } from "react";

import PlatformIcon from "@/components/PlatformIcon";
import { detectPlatform, fallbackLabel } from "@/lib/platform";
import type { LinkItem } from "@/lib/types";

export default function LinksEditor({
  name,
  defaultValue = [],
}: {
  /** 폼에 실려 나갈 hidden input 이름 (JSON 문자열) */
  name: string;
  defaultValue?: LinkItem[];
}) {
  const [links, setLinks] = useState<LinkItem[]>(defaultValue);

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

  return (
    <div className="space-y-2.5">
      <input type="hidden" name={name} value={JSON.stringify(links)} />

      {links.length === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          아직 링크가 없습니다. 인스타그램·유튜브·틱톡 등 주소를 추가해 보세요.
        </p>
      )}

      {links.map((link, index) => {
        const platform = detectPlatform(link.url);
        return (
          <div
            key={index}
            className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-950/50"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${platform.color}1f`, color: platform.color }}
              title={platform.label}
            >
              <PlatformIcon platform={platform.key} className="h-[18px] w-[18px]" />
            </span>

            <input
              className="input sm:max-w-[180px]"
              placeholder={fallbackLabel(link.url) || "표시 이름"}
              value={link.label}
              onChange={(e) => update(index, { label: e.target.value })}
            />
            <input
              className="input flex-1"
              placeholder="https://instagram.com/..."
              value={link.url}
              onChange={(e) => update(index, { url: e.target.value })}
            />

            <div className="flex shrink-0 gap-1">
              <IconButton label="위로" onClick={() => move(index, -1)} disabled={index === 0}>
                ↑
              </IconButton>
              <IconButton label="아래로" onClick={() => move(index, 1)} disabled={index === links.length - 1}>
                ↓
              </IconButton>
              <IconButton
                label="삭제"
                danger
                onClick={() => setLinks((prev) => prev.filter((_, i) => i !== index))}
              >
                ✕
              </IconButton>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        className="btn-ghost btn-sm"
        onClick={() => setLinks((prev) => [...prev, { label: "", url: "" }])}
      >
        + 링크 추가
      </button>
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
      className={`h-9 w-9 cursor-pointer rounded-lg border text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        danger
          ? "border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/40"
          : "border-zinc-200 text-zinc-500 hover:bg-white dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}
