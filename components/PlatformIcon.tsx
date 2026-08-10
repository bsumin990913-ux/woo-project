import type { PlatformKey } from "@/lib/platform";

type Glyph = "camera" | "play" | "note" | "doc" | "chat" | "x" | "code" | "pin" | "brush" | "mail" | "link" | "f";

const GLYPH_BY_PLATFORM: Record<PlatformKey, Glyph> = {
  instagram: "camera",
  youtube: "play",
  twitch: "play",
  tiktok: "note",
  spotify: "note",
  soundcloud: "note",
  notion: "doc",
  tistory: "doc",
  naver: "doc",
  threads: "chat",
  discord: "chat",
  facebook: "f",
  x: "x",
  github: "code",
  pinterest: "pin",
  behance: "brush",
  email: "mail",
  link: "link",
};

function Paths({ glyph }: { glyph: Glyph }) {
  switch (glyph) {
    case "camera":
      return (
        <>
          <rect x="3" y="3" width="18" height="18" rx="5.5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.1" cy="6.9" r="1.15" fill="currentColor" stroke="none" />
        </>
      );
    case "play":
      return (
        <>
          <rect x="2.5" y="4.5" width="19" height="15" rx="4.5" />
          <path d="M10.4 8.9 15.7 12l-5.3 3.1Z" fill="currentColor" strokeLinejoin="round" />
        </>
      );
    case "note":
      return (
        <>
          <path d="M9.2 17.4V6.6l9-2v10.6" />
          <circle cx="6.6" cy="17.6" r="2.7" />
          <circle cx="15.6" cy="15.2" r="2.7" />
        </>
      );
    case "doc":
      return (
        <>
          <path d="M6.5 3.5h6.6l4.9 4.9v12.1H6.5z" strokeLinejoin="round" />
          <path d="M13 3.5v5h5" />
          <path d="M9.4 13h5.2M9.4 16.6h5.2" />
        </>
      );
    case "chat":
      return <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H9.6L4.8 20.6A.5.5 0 0 1 4 20.2z" strokeLinejoin="round" />;
    case "x":
      return <path d="M5.5 5.5 18.5 18.5M18.5 5.5 5.5 18.5" />;
    case "code":
      return (
        <>
          <path d="M9 8.2 5.2 12 9 15.8M15 8.2 18.8 12 15 15.8" strokeLinejoin="round" />
          <path d="M13.2 5.2 10.8 18.8" />
        </>
      );
    case "pin":
      return (
        <>
          <path d="M12 21c0 0 6.8-6.1 6.8-10.6a6.8 6.8 0 1 0-13.6 0C5.2 14.9 12 21 12 21z" strokeLinejoin="round" />
          <circle cx="12" cy="10.2" r="2.5" />
        </>
      );
    case "brush":
      return (
        <>
          <path d="M4.2 19.8c0-2.4 1.4-3.6 3.2-3.6 1.4 0 2.4.9 2.4 2.1 0 1.6-1.6 2.5-3.2 2.5-1.5 0-2.4-.4-2.4-1z" strokeLinejoin="round" />
          <path d="m9.6 16 9.2-9.6-2-2L8 14" strokeLinejoin="round" />
        </>
      );
    case "mail":
      return (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2.8" />
          <path d="m3.9 7.6 8.1 5.7 8.1-5.7" />
        </>
      );
    case "f":
      return (
        <text
          x="12"
          y="17.5"
          textAnchor="middle"
          fontSize="15"
          fontWeight="700"
          fill="currentColor"
          stroke="none"
          fontFamily="Georgia, serif"
        >
          f
        </text>
      );
    case "link":
    default:
      return (
        <>
          <path d="M10.2 13.8a4.4 4.4 0 0 0 6.2 0l2.4-2.4a4.4 4.4 0 0 0-6.2-6.2l-1.2 1.2" strokeLinejoin="round" />
          <path d="M13.8 10.2a4.4 4.4 0 0 0-6.2 0l-2.4 2.4a4.4 4.4 0 0 0 6.2 6.2l1.2-1.2" strokeLinejoin="round" />
        </>
      );
  }
}

export default function PlatformIcon({
  platform,
  className = "h-5 w-5",
}: {
  platform: PlatformKey;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <Paths glyph={GLYPH_BY_PLATFORM[platform] ?? "link"} />
    </svg>
  );
}
