"use client";

import { ArrowLeft, ArrowRight, ImagePlus, Link2, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { withSize } from "@/lib/image";
import { MEDIA_BUCKET, supabaseBrowser } from "@/lib/supabase-browser";

const MAX_BYTES = 10 * 1024 * 1024;

/** 올리는 김에 가로·세로를 재 둔다. 방문자 화면에서 자리를 미리 잡는 데 쓴다. */
async function measure(file: File): Promise<{ width: number; height: number } | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    // gif/avif 등 브라우저가 못 읽는 경우 — 크기 없이 올린다
    return null;
  }
}

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
  const [manualOpen, setManualOpen] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  // 드래그가 자식 요소를 지날 때마다 leave 가 튀는 걸 막는 카운터
  const dragDepth = useRef(0);

  const busy = progress !== null;

  async function upload(files: File[]) {
    const picked = files.filter((file) => file.type.startsWith("image/")).slice(0, single ? 1 : 20);
    if (picked.length === 0) return;

    const oversize = picked.find((file) => file.size > MAX_BYTES);
    if (oversize) {
      setError(`${oversize.name || "이미지"}: 파일이 너무 큽니다 (최대 10MB).`);
      return;
    }

    setError(null);
    setProgress({ done: 0, total: picked.length });

    try {
      // 1) 서버에서 파일마다 서명된 업로드 URL 을 받는다 (메타데이터만 오간다)
      const { items } = await readJson<{ items: SignedItem[] }>(
        await fetch("/api/upload", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            files: picked.map((file) => ({ name: file.name, type: file.type, size: file.size })),
          }),
        }),
      );

      // 2) 브라우저 → Supabase Storage 직접 업로드 (서버를 거치지 않음)
      const storage = supabaseBrowser().storage.from(MEDIA_BUCKET);
      const uploaded: string[] = [];

      for (const [index, file] of picked.entries()) {
        const item = items[index];
        if (!item) throw new Error("업로드 정보를 받지 못했습니다. 다시 시도해 주세요.");

        const { error: uploadError } = await storage.uploadToSignedUrl(item.path, item.token, file, {
          contentType: file.type,
        });
        if (uploadError) throw new Error(`${file.name}: ${uploadError.message}`);

        const size = await measure(file);
        uploaded.push(size ? withSize(item.publicUrl, size.width, size.height) : item.publicUrl);
        setProgress({ done: index + 1, total: picked.length });
      }

      setUrls((prev) => (single ? uploaded.slice(0, 1) : [...prev, ...uploaded]));
    } catch (e) {
      setError(e instanceof Error ? e.message : "업로드에 실패했습니다.");
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  /** 캡처한 이미지를 Ctrl/Cmd + V 로 바로 올린다 (이 영역 안에 포커스가 있을 때만) */
  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const zone = zoneRef.current;
      if (!zone) return;
      const target = event.target as Node | null;
      if (!target || !zone.contains(target)) return;

      const files = Array.from(event.clipboardData?.files ?? []).filter((file) => file.type.startsWith("image/"));
      if (files.length === 0) return;

      event.preventDefault();
      void upload(files);
    }

    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [single]);

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
    <div
      ref={zoneRef}
      tabIndex={-1}
      className={`rounded-tds-lg space-y-3 border border-dashed p-3 transition-colors outline-none ${
        dragging ? "border-brand bg-brand-weak" : "border-line"
      }`}
      onDragEnter={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        dragDepth.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) e.preventDefault();
      }}
      onDragLeave={() => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDragging(false);
      }}
      onDrop={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        void upload(Array.from(e.dataTransfer.files));
      }}
    >
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
          onChange={(e) => void upload(Array.from(e.target.files ?? []))}
        />
        <span className="text-ink-3 text-xs font-medium">
          {dragging ? "여기에 놓으면 업로드됩니다" : "끌어다 놓거나 Ctrl+V 로 붙여넣어도 됩니다"}
        </span>
      </div>

      {/* 외부 이미지 주소를 직접 넣는 건 드물게 쓰는 탈출구라 접어 둔다 */}
      {manualOpen ? (
        <div className="flex items-center gap-2">
          <input
            className="input"
            placeholder="이미지 주소 (https://...)"
            value={manualUrl}
            autoFocus
            inputMode="url"
            spellCheck={false}
            onChange={(e) => setManualUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addManual();
              }
            }}
            aria-label="이미지 주소 직접 입력"
          />
          <button type="button" className="btn-ghost btn-field shrink-0" onClick={addManual} disabled={!manualUrl.trim()}>
            <Plus className="h-4 w-4" />
            추가
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="text-ink-3 hover:text-brand inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-semibold"
          onClick={() => setManualOpen(true)}
        >
          <Link2 className="h-3.5 w-3.5" />
          이미지 주소로 넣기
        </button>
      )}

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
              {/* 터치 기기에는 hover 가 없어서 항상 보이게 두고, 마우스에서만 hover 로 나타난다 */}
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/55 p-1.5 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                {!single && (
                  <>
                    <MiniButton label="왼쪽으로" onClick={() => move(index, -1)} disabled={index === 0}>
                      <ArrowLeft className="h-4 w-4" />
                    </MiniButton>
                    <MiniButton label="오른쪽으로" onClick={() => move(index, 1)} disabled={index === urls.length - 1}>
                      <ArrowRight className="h-4 w-4" />
                    </MiniButton>
                  </>
                )}
                <MiniButton label="삭제" onClick={() => setUrls((prev) => prev.filter((_, i) => i !== index))}>
                  <X className="h-4 w-4" />
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
      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md bg-white/15 text-white transition-colors hover:bg-white/30 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
