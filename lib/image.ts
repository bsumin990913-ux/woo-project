/**
 * 이미지 크기를 주소 뒤에 `#가로x세로` 로 붙여 둔다.
 *
 * 왜 이렇게 하나:
 * - 브라우저에 width/height 를 알려 주면 이미지가 뜨기 전에 자리를 미리 잡아
 *   글이 아래로 밀리는 현상(레이아웃 시프트)이 사라진다.
 * - 프래그먼트(#뒤)는 요청에 실려 가지 않으므로 이미지 로딩에는 아무 영향이 없다.
 * - DB 스키마를 건드리지 않아도 되고, 크기가 없는 예전 주소도 그대로 동작한다.
 */

const SIZE_PATTERN = /#(\d{1,5})x(\d{1,5})$/;

export type ImageSize = { width: number; height: number };

export function withSize(url: string, width: number, height: number): string {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return url;
  return `${stripSize(url)}#${Math.round(width)}x${Math.round(height)}`;
}

export function imageSize(url: string): ImageSize | null {
  const match = SIZE_PATTERN.exec(url);
  if (!match) return null;
  return { width: Number(match[1]), height: Number(match[2]) };
}

/** 크기 표시를 뗀 순수 주소. 저장소 경로를 계산할 때 쓴다. */
export function stripSize(url: string): string {
  return url.replace(SIZE_PATTERN, "");
}
