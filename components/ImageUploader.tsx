"use client";

import { ArrowLeft, ArrowRight, ImagePlus, Plus, X } from "lucide-react";
import { useRef, useState } from "react";

import { MEDIA_BUCKET, supabaseBrowser } from "@/lib/supabase-browser";

const MAX_BYTES = 10 * 1024 * 1024;

type SignedItem = { path: string; token: string; publicUrl: string };

/** 서버가 JSON 이 아닌 걸 돌려줘도(413 "Request Entity Too Large" 등) 읽을 수 있는 에러로 바꾼다. */
async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    const snippet = text.trim().slice(0, 80) || `HTTP ${response.status}`;
    throw new Error(`서버 응답을 읽지 못했습니다 (${response.status}): ${snippet}`);
  }
  if (!response.ok) {
    const message = (parsed as { error?: string } | null)?.error;
    throw new Error(message ?? `요청이 실패했습니다 (${response.status}).`);
  }
  return parsed as T;
}

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
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const busy = progress !== null;

  async function upload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).slice(0, single ? 1 : 20);

    const oversize = files.find((file) => file.size > MAX_BYTES);
    if (oversize) {
      setError(`${oversize.name}: 파일이 너무 큽니다 (최대 10MB).`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setError(null);
    setProgress({ done: 0, total: files.length });

    try {
      // 1) 서버에서 파일마다 서명된 업로드 URL 을 받는다 (메타데이터만 오간다)
      const { items } = await readJson<{ items: SignedItem[] }>(
        await fetch("/api/upload", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            files: files.map((file) => ({ name: file.name, type: file.type, size: file.size })),
          }),
        }),
      );

      // 2) 브라우저 → Supabase Storage 직접 업로드 (서버를 거치지 않음)
      const storage = supabaseBrowser().storage.from(MEDIA_BUCKET);
      const uploaded: string[] = [];

      for (const [index, file] of files.entries()) {
        const item = items[index];
        if (!item) throw new Error("업로드 정보를 받지 못했습니다. 다시 시도해 주세요.");

        const { error: uploadError } = await storage.uploadToSignedUrl(item.path, item.token, file, {
          contentType: file.type,
        });
        if (uploadError) throw new Error(`${file.name}: ${uploadError.message}`);

        uploaded.push(item.publicUrl);
        setProgress({ done: index + 1, total: files.length });
      }

      setUrls((prev) => (single ? uploaded.slice(0, 1) : [...prev, ...uploaded]));
    } catch (e) {
      setError(e instanceof Error ? e.message : "업로드에 실패했습니다.");
    } finally {
      setProgress(null);
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
          <ImagePlus className="h-4 w-4" />
          {progress
            ? `업로드 중… ${progress.done}/${progress.total}`
            : single
              ? "이미지 선택"
              : "이미지 추가 (여러 장 가능)"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={!single}
          className="hidden"
          onChange={(e) => upload(e.target.files)}
        />
        <span className="text-ink-3 text-xs font-medium">jpg · png · webp · gif / 장당 최대 10MB</span>
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
          <Plus className="h-4 w-4" />
          추가
        </button>
      </div>

      {error && <p className="rounded-tds-md bg-danger-weak text-danger px-3 py-2.5 text-xs font-medium">{error}</p>}

      {urls.length > 0 && (
        <div className={single ? "w-40" : "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"}>
          {urls.map((url, index) => (
            <figure
              key={`${url}-${index}`}
              className="border-line bg-surface-2 rounded-tds-lg group relative overflow-hidden border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="aspect-square w-full object-cover" loading="lazy" />
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/55 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                {!single && (
                  <>
                    <MiniButton label="왼쪽으로" onClick={() => move(index, -1)} disabled={index === 0}>
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </MiniButton>
                    <MiniButton label="오른쪽으로" onClick={() => move(index, 1)} disabled={index === urls.length - 1}>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </MiniButton>
                  </>
                )}
                <MiniButton label="삭제" onClick={() => setUrls((prev) => prev.filter((_, i) => i !== index))}>
                  <X className="h-3.5 w-3.5" />
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
      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md bg-white/15 text-white transition-colors hover:bg-white/30 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
