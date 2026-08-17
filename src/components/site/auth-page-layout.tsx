import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AuthScrollingGallery } from "@/components/site/auth-scrolling-gallery";
import { cn } from "@/lib/utils";

type AuthPageLayoutProps = {
  mode: "login" | "signup";
  children: ReactNode;
};

export function AuthPageLayout({ mode, children }: AuthPageLayoutProps) {
  const galleryHeight =
    mode === "login"
      ? "h-[15rem] sm:h-[20rem] md:h-[26rem]"
      : "h-[17rem] sm:h-[24rem] md:h-[32rem]";

  return (
    <div
      className="flex min-h-[calc(100dvh-var(--header-height))] items-center justify-center px-4 py-8 sm:py-10"
      data-lenis-prevent
    >
      <div className="w-full max-w-5xl">
        <nav className="eyebrow text-[10px] text-muted-foreground mb-6 md:mb-8 text-center md:text-left">
          <Link to="/" className="hover:text-foreground transition-colors">
            HOME
          </Link>
          <span className="mx-2">·</span>
          <span className="text-foreground">{mode === "login" ? "LOGIN" : "SIGN UP"}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-14 md:items-center">
          <div className="w-full max-w-md mx-auto md:mx-0 md:max-w-none">{children}</div>
          <div className={cn("w-full max-w-md mx-auto md:max-w-none", galleryHeight)}>
            <AuthScrollingGallery className={cn("h-full w-full", galleryHeight)} />
          </div>
        </div>
      </div>
    </div>
  );
}

export const authInputClass =
  "h-11 rounded-none border-0 border-b border-border bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-foreground placeholder:text-muted-foreground/70";
