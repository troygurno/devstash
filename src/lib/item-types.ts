/**
 * Presentation lookups for item types.
 *
 * `mock-data.ts` (and later the ItemType table) stores an icon as a lucide *name*
 * and a color as a *hex string* — neither can be rendered directly. These maps turn
 * them into a component and a Tailwind class. The hex in the data stays the
 * documented source of truth; the class here is what actually paints.
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

/** lucide icon name → component. Keyed by `MockItemType.icon`. */
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
