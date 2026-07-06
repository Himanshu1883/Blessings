import { createFileRoute } from "@tanstack/react-router";
import craftImg from "@/assets/craft.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the House — Blessings Men's Boutique" },
      { name: "description", content: "A four-generation menswear atelier from the heart of Delhi. Discover the story behind Blessings." },
      { property: "og:title", content: "About — Blessings" },
      { property: "og:description", content: "A four-generation menswear atelier from the heart of Delhi." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div data-reveal-section className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32">
      <p className="eyebrow text-[color:var(--gold)] mb-4 sm:mb-6">The House</p>
      <h1 className="font-serif italic text-3xl sm:text-5xl md:text-7xl leading-[1.05] max-w-3xl text-balance">Four generations. One thread.</h1>
      <div data-reveal-section data-reveal-direction="split" className="mt-10 sm:mt-16 grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-16 items-start">
        <img src={craftImg} alt="Atelier detail" className="w-full aspect-[4/5] object-cover" />
        <div className="space-y-6 text-foreground/70 leading-relaxed">
          <p>Blessings began as a small tailoring house in the lanes of Old Delhi in 1962 — cutting suits for a city on the cusp of reinvention.</p>
          <p>Four generations later, we remain a family-run atelier. We employ over eighty master craftsmen — embroiderers, cutters, finishers — many of whom have been with the house for decades.</p>
          <p>Today, we dress grooms and gentlemen in over forty countries. Every garment leaves our Delhi atelier hand-signed by the master tailor who cut it.</p>
        </div>
      </div>
    </div>
  );
}