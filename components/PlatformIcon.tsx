import {
  AtSign,
  AudioLines,
  BookOpen,
  Brush,
  Camera,
  CirclePlay,
  Disc3,
  FileText,
  GitBranch,
  Link2,
  Mail,
  MapPin,
  MessagesSquare,
  MonitorPlay,
  Music2,
  Newspaper,
  ThumbsUp,
  X,
  type LucideIcon,
} from "lucide-react";

import type { PlatformKey } from "@/lib/platform";

/**
 * lucide 는 상표 문제로 브랜드 로고 아이콘을 제공하지 않는다(v1 에서 제거됨).
 * 그래서 플랫폼의 "성격"을 나타내는 아이콘을 쓰고, 브랜드 식별은 색으로 한다.
 */
const ICON_BY_PLATFORM: Record<PlatformKey, LucideIcon> = {
  instagram: Camera,
  youtube: CirclePlay,
  twitch: MonitorPlay,
  tiktok: Music2,
  spotify: Disc3,
  soundcloud: AudioLines,
  notion: FileText,
  tistory: BookOpen,
  naver: Newspaper,
  threads: AtSign,
  discord: MessagesSquare,
  facebook: ThumbsUp,
  x: X,
  github: GitBranch,
  pinterest: MapPin,
  behance: Brush,
  email: Mail,
  link: Link2,
};

export default function PlatformIcon({
  platform,
  className = "h-5 w-5",
}: {
  platform: PlatformKey;
  className?: string;
}) {
  const Icon = ICON_BY_PLATFORM[platform] ?? Link2;
  return <Icon className={className} strokeWidth={1.9} aria-hidden="true" />;
}
