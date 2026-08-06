/**
 * Presentation lookups for item types.
 *
 * The ItemType table stores an icon as a lucide *name* and a color as a *hex
 * string* — neither can be rendered directly. These maps turn them into a
 * component and a Tailwind class. The hex in the database stays the documented
 * source of truth; the class here is what actually paints.
 */
import {
  Code,
  File as FileIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
  StickyNote,
  Terminal,
  type LucideIcon,
} from "lucide-react";

/** lucide icon name → component. Keyed by `ItemType.icon`. */
const ITEM_TYPE_ICONS: Record<string, LucideIcon> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link: LinkIcon,
  File: FileIcon,
  Image: ImageIcon,
};

/**
 * Type slug → Tailwind text color. Each one is the exact palette match for the hex
 * recorded in `context/project-overview.md`:
 * blue-500 #3b82f6 · violet-500 #8b5cf6 · orange-500 #f97316 · yellow-300 #fde047
 * emerald-500 #10b981 · gray-500 #6b7280 · pink-500 #ec4899
 */
const ITEM_TYPE_COLOR_CLASSES: Record<string, string> = {
  snippets: "text-blue-500",
  prompts: "text-violet-500",
  commands: "text-orange-500",
  notes: "text-yellow-300",
  links: "text-emerald-500",
  files: "text-gray-500",
  images: "text-pink-500",
};

/** Type slug → left-border color, for the accent stripe on cards and item rows. */
const ITEM_TYPE_BORDER_CLASSES: Record<string, string> = {
  snippets: "border-l-blue-500",
  prompts: "border-l-violet-500",
  commands: "border-l-orange-500",
  notes: "border-l-yellow-300",
  links: "border-l-emerald-500",
  files: "border-l-gray-500",
  images: "border-l-pink-500",
};

/** Type slug → tinted background, for the icon tile on an item row. */
const ITEM_TYPE_BG_CLASSES: Record<string, string> = {
  snippets: "bg-blue-500/10",
  prompts: "bg-violet-500/10",
  commands: "bg-orange-500/10",
  notes: "bg-yellow-300/10",
  links: "bg-emerald-500/10",
  files: "bg-gray-500/10",
  images: "bg-pink-500/10",
};

/**
 * Type slug → solid dot color, for the dominant-type marker on a sidebar row.
 * Distinct from the tile tints above: at 8px a `/10` fill reads as nothing.
 */
const ITEM_TYPE_DOT_CLASSES: Record<string, string> = {
  snippets: "bg-blue-500",
  prompts: "bg-violet-500",
  commands: "bg-orange-500",
  notes: "bg-yellow-300",
  links: "bg-emerald-500",
  files: "bg-gray-500",
  images: "bg-pink-500",
};

/**
 * The Pro-gated system types, per `context/project-overview.md` §4. This lives
 * here rather than on the model because `ItemType` has no `isPro` column — a
 * type's tier is presentation until the Phase 4 gates in `limits.ts` land, and
 * those will enforce server-side regardless of what the sidebar renders.
 */
const PRO_ITEM_TYPE_SLUGS = new Set(["files", "images"]);

/**
 * Type slug → plural label. `ItemType.name` is singular ("Snippet") because it
 * names one item; a nav entry standing for a whole category reads as "Snippets".
 */
const ITEM_TYPE_PLURAL_LABELS: Record<string, string> = {
  snippets: "Snippets",
  prompts: "Prompts",
  commands: "Commands",
  notes: "Notes",
  links: "Links",
  files: "Files",
  images: "Images",
};

/** Falls back to a generic file icon for a name we don't recognize. */
export function getItemTypeIcon(iconName: string): LucideIcon {
  return ITEM_TYPE_ICONS[iconName] ?? FileIcon;
}

/** Falls back to the muted foreground for a slug we don't recognize. */
export function getItemTypeColorClass(slug: string): string {
  return ITEM_TYPE_COLOR_CLASSES[slug] ?? "text-muted-foreground";
}

export function getItemTypeBorderClass(slug: string): string {
  return ITEM_TYPE_BORDER_CLASSES[slug] ?? "border-l-border";
}

export function getItemTypeBgClass(slug: string): string {
  return ITEM_TYPE_BG_CLASSES[slug] ?? "bg-muted";
}

/** Falls back to a neutral dot — an empty collection has no dominant type. */
export function getItemTypeDotClass(slug: string): string {
  return ITEM_TYPE_DOT_CLASSES[slug] ?? "bg-muted-foreground/40";
}

/** Falls back to the stored name, which is what a custom type will have. */
export function getItemTypePluralLabel(slug: string, name: string): string {
  return ITEM_TYPE_PLURAL_LABELS[slug] ?? name;
}

/** Display only — the real gate is server-side, per `project-overview.md` §10. */
export function isProItemType(slug: string): boolean {
  return PRO_ITEM_TYPE_SLUGS.has(slug);
}
