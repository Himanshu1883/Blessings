import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { PreFooterBanner } from "@/components/site/pre-footer-banner";
import { CurrencyProvider } from "@/lib/currency";
import { AuthProvider } from "@/lib/auth-context";
import { ShopProvider } from "@/lib/shop-store";
import { Toaster } from "@/components/ui/sonner";
import { ShopPanels } from "@/components/site/shop-panels";
import { MobileBottomNav } from "@/components/site/mobile-bottom-nav";
import { FloatingWhatsApp } from "@/components/site/floating-whatsapp";
import { ScrollExperienceProvider } from "@/components/site/scroll-experience";

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
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Blessings | Men's Boutique — Bespoke Sherwanis, Bandhgalas & Wedding Suits" },
      { name: "description", content: "Haute-couture menswear from Delhi. Handcrafted sherwanis, bandhgalas, wedding suits & indo-western sets for grooms worldwide — UK, USA, UAE, Canada." },
      { name: "author", content: "Blessings Men's Boutique" },
      { property: "og:title", content: "Blessings | Men's Boutique — Bespoke Sherwanis, Bandhgalas & Wedding Suits" },
      { property: "og:description", content: "Haute-couture menswear from Delhi. Handcrafted sherwanis, bandhgalas, wedding suits & indo-western sets for grooms worldwide — UK, USA, UAE, Canada." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Blessings | Men's Boutique — Bespoke Sherwanis, Bandhgalas & Wedding Suits" },
      { name: "twitter:description", content: "Haute-couture menswear from Delhi. Handcrafted sherwanis, bandhgalas, wedding suits & indo-western sets for grooms worldwide — UK, USA, UAE, Canada." },
      { property: "og:image", content: "/banners/banner-1.jpeg" },
      { name: "twitter:image", content: "/banners/banner-1.jpeg" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap",
      },
    ],
  }),
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
  const isHome = useRouterState({ select: (s) => s.location.pathname === "/" });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <ShopProvider>
          <ScrollExperienceProvider>
          <div className="flex min-h-screen flex-col bg-background text-foreground w-full max-w-[100vw]">
            <SiteHeader />
            <main className="flex-1 w-full min-w-0 pb-[calc(62px+env(safe-area-inset-bottom))] lg:pb-0">
              <Outlet />
            </main>
            {isHome ? (
              <SiteFooter />
            ) : (
              <PreFooterBanner>
                <SiteFooter />
              </PreFooterBanner>
            )}
          </div>
          <ShopPanels />
          <MobileBottomNav />
          <FloatingWhatsApp />
          <Toaster position="bottom-right" />
          </ScrollExperienceProvider>
          </ShopProvider>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
