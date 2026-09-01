import { createFileRoute, Outlet } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/admin")({
  head: () => {
    const seo = seoHead({
      title: "Admin",
      description: "Blessings admin.",
      path: "/admin",
      noindex: true,
    });
    return {
      ...seo,
      links: [
        ...(seo.links ?? []),
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,500;1,600&display=swap",
        },
      ],
    };
  },
  component: () => <Outlet />,
});
