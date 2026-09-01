import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { fetchCategories, fetchProducts } from "@/lib/catalog-api";
import { absoluteUrl } from "@/lib/seo";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [categories, products] = await Promise.all([fetchCategories(), fetchProducts()]);
        const entries = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/shop/all", changefreq: "daily", priority: "0.9" },
          { path: "/bespoke", changefreq: "monthly", priority: "0.8" },
          { path: "/about", changefreq: "monthly", priority: "0.7" },
          { path: "/contact", changefreq: "monthly", priority: "0.7" },
          { path: "/journal", changefreq: "weekly", priority: "0.6" },
          ...categories.map((c) => ({
            path: `/shop/${c.slug}`,
            changefreq: "weekly",
            priority: "0.8",
          })),
          ...products.map((p) => ({
            path: `/product/${p.slug || p.id}`,
            changefreq: "weekly",
            priority: "0.7",
          })),
        ];

        const seen = new Set<string>();
        const urls = entries
          .filter((e) => {
            if (seen.has(e.path)) return false;
            seen.add(e.path);
            return true;
          })
          .map(
            (e) =>
              `  <url>\n    <loc>${absoluteUrl(e.path)}</loc>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
          );

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
