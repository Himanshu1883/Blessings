import type { ReactNode } from "react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { whatsappUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

type WhatsAppLinkProps = {
  message?: string;
  className?: string;
  iconClassName?: string;
  showIcon?: boolean;
  children?: ReactNode;
  "aria-label"?: string;
};

export function WhatsAppLink({
  message,
  className,
  iconClassName,
  showIcon = true,
  children,
  "aria-label": ariaLabel = "Chat on WhatsApp",
}: WhatsAppLinkProps) {
  return (
    <a
      href={whatsappUrl(message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={cn("inline-flex items-center gap-2 transition-colors", className)}
    >
      {showIcon && <WhatsAppIcon className={cn("size-4 text-[#25D366]", iconClassName)} />}
      {children}
    </a>
  );
}
