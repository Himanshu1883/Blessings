import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { FloatingWhatsApp } from "@/components/site/floating-whatsapp";
import { MobileBottomNav } from "@/components/site/mobile-bottom-nav";
import { PreFooterBanner } from "@/components/site/pre-footer-banner";
import { ScrollExperienceProvider } from "@/components/site/scroll-experience";
import { ShopPanels } from "@/components/site/shop-panels";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import { CurrencyProvider } from "@/lib/currency";
import { CouponsProvider } from "@/lib/coupons-context";
import { ShopProvider } from "@/lib/shop-store";
import { cn } from "@/lib/utils";
import { reportLovableError } from "../lib/lovable-error-reporting";
import appCss from "../styles.css?url";
import {
  BRAND_LOGO,
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  OG_IMAGE,
  SITE_NAME,
  organizationJsonLd,
  seoHead,
} from "@/lib/seo";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => {
    const seo = seoHead({
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      path: "/",
      image: OG_IMAGE,
      jsonLd: organizationJsonLd(),
    });
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "theme-color", content: "#6b1d1d" },
        { name: "application-name", content: SITE_NAME },
        { name: "apple-mobile-web-app-title", content: "Blessings" },
        ...seo.meta,
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "icon", href: "/favicon.ico?v=3", sizes: "any" },
        { rel: "icon", href: `${BRAND_LOGO}?v=3`, type: "image/png", sizes: "512x512" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png?v=3" },
        { rel: "shortcut icon", href: "/favicon.ico?v=3" },
        ...(seo.links ?? []),
      ],
      scripts: seo.scripts,
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";
  const isAdmin = pathname.startsWith("/admin");
  const isInvoice = pathname.includes("/invoice");
  const isAuthPage =
    pathname === "/login" || pathname === "/signup" || pathname === "/auth/callback";

  if (isAdmin) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CurrencyProvider>
            <Outlet />
            <Toaster position="bottom-right" />
          </CurrencyProvider>
        </AuthProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <CouponsProvider>
          <ShopProvider>
            <ScrollExperienceProvider>
              <div className="flex min-h-screen flex-col bg-white text-foreground w-full max-w-[100vw]">
                <div className={isInvoice ? "print:hidden" : undefined}>
                  <SiteHeader />
                </div>
                <main
                  className={cn(
                    "flex-1 w-full min-w-0 pb-[calc(62px+env(safe-area-inset-bottom))] lg:pb-0 pt-[var(--header-height)]",
                    isAuthPage && "overflow-x-hidden",
                    isInvoice && "print:pt-0 print:pb-0",
                  )}
                >
                  <Outlet />
                </main>
                <div className={isInvoice ? "print:hidden" : undefined}>
                {isHome || isAuthPage ? (
                  <SiteFooter />
                ) : (
                  <PreFooterBanner>
                    <SiteFooter />
                  </PreFooterBanner>
                )}
                </div>
              </div>
              <div className={isInvoice ? "print:hidden" : undefined}>
              <ShopPanels />
              <MobileBottomNav />
              <FloatingWhatsApp />
              </div>
              <Toaster position="bottom-right" />
            </ScrollExperienceProvider>
          </ShopProvider>
          </CouponsProvider>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
