"use client";

import { useRef, useState } from "react";

export default function ImageUploader({
  name,
  defaultValue = [],
  single = false,
}: {
  /** hidden input 이름. single 이면 URL 문자열, 아니면 JSON 배열이 실린다. */
  name: string;
  defaultValue?: string[];
  single?: boolean;
}) {
  const [urls, setUrls] = useState<string[]>(defaultValue.filter(Boolean));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      Array.from(files)
        .slice(0, single ? 1 : files.length)
        .forEach((file) => body.append("files", file));

      const response = await fetch("/api/upload", { method: "POST", body });
      const json = (await response.json()) as { urls?: string[]; error?: string };
      if (!response.ok) throw new Error(json.error ?? "업로드에 실패했습니다.");

      const uploaded = json.urls ?? [];
      setUrls((prev) => (single ? uploaded.slice(0, 1) : [...prev, ...uploaded]));
    } catch (e) {
      setError(e instanceof Error ? e.message : "업로드에 실패했습니다.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function addManual() {
    const value = manualUrl.trim();
    if (!value) return;
    setUrls((prev) => (single ? [value] : [...prev, value]));
    setManualUrl("");
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= urls.length) return;
    setUrls((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={single ? (urls[0] ?? "") : JSON.stringify(urls)} />

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-ghost btn-sm" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? "업로드 중…" : single ? "이미지 선택" : "이미지 추가 (여러 장 가능)"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={!single}
          className="hidden"
          onChange={(e) => upload(e.target.files)}
        />
        <span className="text-xs text-zinc-500 dark:text-zinc-400">jpg · png · webp · gif / 장당 최대 10MB</span>
      </div>

      <div className="flex gap-2">
        <input
          className="input"
          placeholder="또는 이미지 주소를 직접 붙여넣기"
          value={manualUrl}
          onChange={(e) => setManualUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addManual();
            }
          }}
        />
        <button type="button" className="btn-ghost btn-sm shrink-0" onClick={addManual}>
          추가
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      )}

      {urls.length > 0 && (
        <div className={single ? "w-40" : "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"}>
          {urls.map((url, index) => (
            <figure
              key={`${url}-${index}`}
              className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="aspect-square w-full object-cover" loading="lazy" />
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/55 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                {!single && (
                  <>
                    <MiniButton label="왼쪽으로" onClick={() => move(index, -1)} disabled={index === 0}>
                      ←
                    </MiniButton>
                    <MiniButton label="오른쪽으로" onClick={() => move(index, 1)} disabled={index === urls.length - 1}>
                      →
                    </MiniButton>
                  </>
                )}
                <MiniButton label="삭제" onClick={() => setUrls((prev) => prev.filter((_, i) => i !== index))}>
                  ✕
                </MiniButton>
              </div>
              {!single && index === 0 && (
                <span className="absolute top-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  대표
                </span>
              )}
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="h-7 w-7 cursor-pointer rounded-md bg-white/15 text-xs text-white transition-colors hover:bg-white/30 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
