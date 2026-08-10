import type { CSSProperties } from "react";

/** 기본 핵심 컬러 = Toss TDS 인터랙션 블루 */
export const DEFAULT_BRAND = "#3182f6";

/** 폴더 테마 프리셋. 라벨은 관리자 화면에 그대로 보인다. */
export const BRAND_PRESETS: { label: string; value: string }[] = [
  { label: "토스 블루", value: "#3182f6" },
  { label: "딥 네이비", value: "#1b3a6b" },
  { label: "바이올렛", value: "#7048e8" },
  { label: "핑크", value: "#f06595" },
  { label: "레드", value: "#e42939" },
  { label: "오렌지", value: "#ff6b2c" },
  { label: "옐로", value: "#ffc107" },
  { label: "라임", value: "#40c057" },
  { label: "민트", value: "#12b886" },
  { label: "시안", value: "#15aabf" },
  { label: "브라운", value: "#8d6e4e" },
  { label: "잉크 블랙", value: "#191f28" },
];

/**
 * 입력값을 #rrggbb 형태로 정규화한다.
 * "3182f6", "#38F", "  #3182F6 " 전부 허용. 실패하면 null.
 */
export function normalizeHex(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    const [r, g, b] = raw.toLowerCase();
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toLowerCase()}`;
  return null;
}

/** 저장값이 깨져 있어도 화면이 무너지지 않도록 기본색으로 되돌린다. */
export function safeBrand(input: string | null | undefined): string {
  return normalizeHex(input) ?? DEFAULT_BRAND;
}

/** 상대 휘도 (WCAG). 0(검정) ~ 1(흰색) */
function luminance(hex: string): number {
  const value = safeBrand(hex).slice(1);
  const channels = [0, 2, 4].map((i) => {
    const c = parseInt(value.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/**
 * 핵심 컬러 위에 올릴 글자색.
 * 노랑(#FFC107·휘도 0.59)처럼 밝은 색에서 흰 글자를 쓰면 대비가 1.6:1 밖에 안 나온다.
 * 0.5 를 경계로 두면 파랑·초록 계열은 브랜드다운 흰 글자를 유지하면서
 * 밝은 색만 어두운 글자로 뒤집힌다.
 */
export function onBrand(hex: string): string {
  return luminance(hex) > 0.5 ? "#191f28" : "#ffffff";
}

/**
 * 테마 스코프에 뿌릴 인라인 변수.
 * <div className="theme" style={brandStyle(color)}> 로 감싸면
 * 그 안의 버튼·아이콘·포커스링·그라데이션이 전부 그 색을 따라간다.
 */
export function brandStyle(hex: string | null | undefined): CSSProperties {
  const brand = safeBrand(hex);
  return { "--brand": brand, "--on-brand": onBrand(brand) } as CSSProperties;
}
