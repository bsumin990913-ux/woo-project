"use client";

import { Check, Link2, RotateCcw } from "lucide-react";
import { useState } from "react";

import { BRAND_PRESETS, DEFAULT_BRAND, brandStyle, normalizeHex, safeBrand } from "@/lib/theme";

/**
 * 폴더의 핵심 컬러를 고르는 입력기.
 * - 프리셋 스와치 / 컬러 피커 / HEX 직접 입력 세 가지 경로를 모두 지원한다.
 * - 아래 미리보기는 실제 공개 페이지와 같은 토큰(.theme)을 쓰므로
 *   여기서 보이는 색이 그대로 방문자 화면 색이다.
 */
export default function ThemePicker({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string | null;
}) {
  const initial = safeBrand(defaultValue);
  const [color, setColor] = useState(initial);
  // 입력 중에는 "#31" 처럼 미완성 값도 그대로 보여 줘야 타이핑이 끊기지 않는다
  const [draft, setDraft] = useState(initial);

  function commit(value: string) {
    setDraft(value);
    const parsed = normalizeHex(value);
    if (parsed) setColor(parsed);
  }

  const invalid = normalizeHex(draft) === null;

  return (
    <div className="space-y-4">
      <input type="hidden" name={name} value={color} />

      {/* 프리셋 */}
      <div className="flex flex-wrap gap-2">
        {BRAND_PRESETS.map((preset) => {
          const active = preset.value === color;
          return (
            <button
              key={preset.value}
              type="button"
              title={preset.label}
              aria-label={preset.label}
              aria-pressed={active}
              onClick={() => {
                setColor(preset.value);
                setDraft(preset.value);
              }}
              className="relative h-9 w-9 cursor-pointer rounded-full transition-transform hover:scale-110 active:scale-95"
              style={{
                backgroundColor: preset.value,
                boxShadow: active
                  ? `0 0 0 2px var(--canvas), 0 0 0 4px ${preset.value}`
                  : "inset 0 0 0 1px rgba(0,0,0,.08)",
              }}
            >
              {active && <Check className="absolute inset-0 m-auto h-4 w-4 text-white" strokeWidth={3} />}
            </button>
          );
        })}
      </div>

      {/* 직접 입력 */}
      <div className="flex flex-wrap items-center gap-2">
        <label
          className="relative h-[50px] w-[58px] shrink-0 cursor-pointer overflow-hidden rounded-tds-lg"
          style={{ backgroundColor: color, boxShadow: "inset 0 0 0 1px rgba(0,0,0,.08)" }}
          title="컬러 피커로 고르기"
        >
          <input
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value.toLowerCase());
              setDraft(e.target.value.toLowerCase());
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="컬러 피커"
          />
        </label>

        <input
          className={`input max-w-[190px] font-mono uppercase ${invalid ? "input-error" : ""}`}
          value={draft}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => setDraft(color)}
          placeholder="#3182F6"
          spellCheck={false}
          aria-label="핵심 컬러 HEX 코드"
        />

        {color.toLowerCase() !== DEFAULT_BRAND && (
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => {
              setColor(DEFAULT_BRAND);
              setDraft(DEFAULT_BRAND);
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            기본색으로
          </button>
        )}
      </div>

      {invalid && <p className="hint text-danger">HEX 코드 형식이 아니에요. 예) #3182F6</p>}

      {/* 미리보기 — 실제 공개 페이지와 같은 토큰을 쓴다 */}
      <div className="theme rounded-tds-xl border border-line p-4" style={brandStyle(color)}>
        <p className="t-eyebrow mb-3">미리보기</p>
        <div className="brand-hero -mx-4 -mt-1 mb-4 px-4 py-5">
          <div className="flex items-center gap-3">
            <span className="rounded-tds-lg bg-brand text-on-brand flex h-11 w-11 items-center justify-center">
              <Link2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-bold">내 폴더 이름</p>
              <p className="t-caption truncate">이 색이 방문자 화면에 그대로 적용됩니다</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-primary btn-sm" tabIndex={-1}>
            기본 버튼
          </button>
          <button type="button" className="btn-weak btn-sm" tabIndex={-1}>
            보조 버튼
          </button>
          <span className="badge badge-brand">배지</span>
          <span className="t-caption font-mono">{color.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
