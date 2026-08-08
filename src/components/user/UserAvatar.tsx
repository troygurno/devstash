import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/**
 * Up to two initials for the fallback.
 *
 * Falls back to the email wherever the name is null or blank, which is the
 * OAuth-account-without-a-profile-name case — an empty avatar reads as a broken
 * image, so there is always at least one character. `"Brad Traversy"` gives `BT`;
 * `"demo@devstash.io"` gives `D`.
 */
export function getInitials(name: string | null, email: string): string {
  const source = name?.trim() || email.trim();
  const initials = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (initials || source[0] || "?").toUpperCase();
}

interface UserAvatarProps {
  name: string | null;
  email: string;
  /** The provider's profile picture — GitHub's, today. Null for credentials accounts. */
  image: string | null;
  className?: string;
}

/**
 * The account picture: the provider's image when there is one, initials otherwise.
 *
 * Radix's `AvatarImage` unmounts itself if the src fails to load, so a dead GitHub
 * URL degrades to the initials on its own rather than to a broken image — the
 * fallback is not only for accounts that never had a picture.
 *
 * Decorative by design: `alt=""` keeps the image out of the accessibility tree,
 * because every place this renders already states the name in adjacent text.
 */
export function UserAvatar({ name, email, image, className }: UserAvatarProps) {
  return (
    <Avatar className={cn("size-8 rounded-full", className)}>
      {image ? <AvatarImage src={image} alt="" /> : null}
      <AvatarFallback className="rounded-full text-xs">
        {getInitials(name, email)}
      </AvatarFallback>
    </Avatar>
  );
}
