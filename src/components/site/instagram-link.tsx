import type { ReactNode } from "react";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { INSTAGRAM_URL } from "@/lib/social";
import { cn } from "@/lib/utils";

type InstagramLinkProps = {
  className?: string;
  iconClassName?: string;
  showIcon?: boolean;
  children?: ReactNode;
  "aria-label"?: string;
};

export function InstagramLink({
  className,
  iconClassName,
  showIcon = true,
  children,
  "aria-label": ariaLabel = "Follow on Instagram",
}: InstagramLinkProps) {
  return (
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={cn("inline-flex items-center gap-2 transition-colors", className)}
    >
      {showIcon && <InstagramIcon className={cn("size-4", iconClassName)} />}
      {children}
    </a>
  );
}
