export type PlatformKey =
  | "instagram"
  | "youtube"
  | "tiktok"
  | "x"
  | "threads"
  | "facebook"
  | "github"
  | "naver"
  | "tistory"
  | "behance"
  | "notion"
  | "discord"
  | "twitch"
  | "spotify"
  | "soundcloud"
  | "pinterest"
  | "email"
  | "link";

type PlatformMeta = {
  key: PlatformKey;
  label: string;
  /** 아이콘 배경/글자에 쓰는 브랜드 계열 색 */
  color: string;
};

const META: Record<PlatformKey, PlatformMeta> = {
  instagram: { key: "instagram", label: "Instagram", color: "#E1306C" },
  youtube: { key: "youtube", label: "YouTube", color: "#FF0033" },
  tiktok: { key: "tiktok", label: "TikTok", color: "#00E7DC" },
  x: { key: "x", label: "X", color: "#71767B" },
  threads: { key: "threads", label: "Threads", color: "#8E8E93" },
  facebook: { key: "facebook", label: "Facebook", color: "#1877F2" },
  github: { key: "github", label: "GitHub", color: "#8B949E" },
  naver: { key: "naver", label: "Naver", color: "#03C75A" },
  tistory: { key: "tistory", label: "Tistory", color: "#FF5A4A" },
  behance: { key: "behance", label: "Behance", color: "#1769FF" },
  notion: { key: "notion", label: "Notion", color: "#9B9B9B" },
  discord: { key: "discord", label: "Discord", color: "#5865F2" },
  twitch: { key: "twitch", label: "Twitch", color: "#9146FF" },
  spotify: { key: "spotify", label: "Spotify", color: "#1DB954" },
  soundcloud: { key: "soundcloud", label: "SoundCloud", color: "#FF5500" },
  pinterest: { key: "pinterest", label: "Pinterest", color: "#E60023" },
  email: { key: "email", label: "Email", color: "#F59E0B" },
  link: { key: "link", label: "Link", color: "#6366F1" },
};

const HOST_RULES: Array<[RegExp, PlatformKey]> = [
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)(twitter\.com|x\.com)$/, "x"],
  [/(^|\.)threads\.(net|com)$/, "threads"],
  [/(^|\.)(facebook\.com|fb\.com)$/, "facebook"],
  [/(^|\.)github\.(com|io)$/, "github"],
  [/(^|\.)(naver\.com|naver\.me)$/, "naver"],
  [/(^|\.)tistory\.com$/, "tistory"],
  [/(^|\.)behance\.net$/, "behance"],
  [/(^|\.)(notion\.so|notion\.site)$/, "notion"],
  [/(^|\.)(discord\.gg|discord\.com)$/, "discord"],
  [/(^|\.)twitch\.tv$/, "twitch"],
  [/(^|\.)spotify\.com$/, "spotify"],
  [/(^|\.)soundcloud\.com$/, "soundcloud"],
  [/(^|\.)pinterest\.(com|co\.kr)$/, "pinterest"],
];

/** 사용자가 "instagram.com/foo" 처럼 프로토콜 없이 넣어도 동작하게 보정 */
export function normalizeUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (/^(https?:)?\/\//i.test(value)) return value.replace(/^\/\//, "https://");
  if (/^mailto:/i.test(value)) return value;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${value}`;
  return `https://${value}`;
}

export function detectPlatform(rawUrl: string): PlatformMeta {
  const url = normalizeUrl(rawUrl);
  if (url.startsWith("mailto:")) return META.email;
  try {
    const host = new URL(url).hostname.toLowerCase();
    for (const [pattern, key] of HOST_RULES) {
      if (pattern.test(host)) return META[key];
    }
  } catch {
    // 파싱 실패 시 일반 링크로 처리
  }
  return META.link;
}

/** 라벨이 비어 있을 때 보여줄 기본 문구 (플랫폼명 또는 도메인) */
export function fallbackLabel(rawUrl: string): string {
  const platform = detectPlatform(rawUrl);
  if (platform.key !== "link") return platform.label;
  try {
    return new URL(normalizeUrl(rawUrl)).hostname.replace(/^www\./, "");
  } catch {
    return rawUrl;
  }
}

/** 폴더명 → URL 슬러그 (한글 유지) */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
