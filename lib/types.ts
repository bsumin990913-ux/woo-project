import { safeBrand } from "@/lib/theme";

export type LinkItem = {
  label: string;
  url: string;
};

export type Folder = {
  id: string;
  slug: string;
  name: string;
  description: string;
  intro: string;
  thumbnail_url: string | null;
  links: LinkItem[];
  /** 이 폴더의 핵심 컬러 (#rrggbb) */
  theme_color: string;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  folder_id: string;
  title: string;
  links: LinkItem[];
  images: string[];
  body: string;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type FolderWithCount = Folder & { post_count: number };

/** jsonb 컬럼이 null/이상한 값으로 들어와도 앱이 죽지 않게 정규화한다. */
export function normalizeLinks(value: unknown): LinkItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is Record<string, unknown> => !!v && typeof v === "object")
    .map((v) => ({
      label: typeof v.label === "string" ? v.label : "",
      url: typeof v.url === "string" ? v.url : "",
    }))
    .filter((v) => v.url.trim().length > 0);
}

export function normalizeImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

export function normalizeFolder(row: Record<string, unknown>): Folder {
  return {
    id: String(row.id),
    slug: String(row.slug ?? ""),
    name: String(row.name ?? ""),
    description: String(row.description ?? ""),
    intro: String(row.intro ?? ""),
    thumbnail_url: (row.thumbnail_url as string) || null,
    links: normalizeLinks(row.links),
    theme_color: safeBrand(typeof row.theme_color === "string" ? row.theme_color : null),
    published: row.published !== false,
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

export function normalizePost(row: Record<string, unknown>): Post {
  return {
    id: String(row.id),
    folder_id: String(row.folder_id ?? ""),
    title: String(row.title ?? ""),
    links: normalizeLinks(row.links),
    images: normalizeImages(row.images),
    body: String(row.body ?? ""),
    published: row.published !== false,
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}
