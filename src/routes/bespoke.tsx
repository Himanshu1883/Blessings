import { createFileRoute } from "@tanstack/react-router";
import bespokeImg from "@/assets/bespoke.jpg";
import craftImg from "@/assets/craft.jpg";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/bespoke")({
  head: () => ({
    meta: [
      { title: "Bespoke Tailoring — Blessings Men's Boutique" },
      { name: "description", content: "The Blessings bespoke process — from private consultation to worldwide delivery. Virtual fittings available across UK, USA, UAE and Canada." },
      { property: "og:title", content: "Bespoke Tailoring — Blessings" },
      { property: "og:description", content: "Made-to-measure sherwanis, bandhgalas and wedding suits, delivered worldwide." },
    ],
  }),
  component: Bespoke,
});

function Bespoke() {
  return (
    <div>
      <section className="relative h-[70vh] overflow-hidden">
        <img src={bespokeImg} alt="Bespoke fitting" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[color:var(--charcoal)]/55" />
        <div className="relative h-full flex items-center justify-center text-center text-[color:var(--ivory)] px-6">
          <div className="max-w-2xl">
            <p className="eyebrow text-[color:var(--gold-soft)] mb-6">Made to Measure</p>
            <h1 className="font-serif italic text-5xl md:text-7xl leading-[1.05]">The Bespoke Experience</h1>
            <p className="mt-8 text-[color:var(--ivory)]/80">A garment made in your name, in your measurements, by hands that have spent a lifetime on the craft.</p>
          </div>
        </div>
      </section>
      <section className="max-w-[1200px] mx-auto px-6 md:px-8 py-24 md:py-32 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <img src={craftImg} alt="Craftsmanship" className="w-full aspect-[4/5] object-cover" />
        <div>
          <p className="eyebrow text-[color:var(--gold)] mb-4">The Journey</p>
          <h2 className="font-serif italic text-4xl md:text-5xl leading-tight">From Delhi, to your doorstep.</h2>
          <div className="mt-10 space-y-6">
            {[
              ["01", "Consultation", "Book a private in-person or virtual consultation with a house stylist."],
              ["02", "Fabric & Design", "Choose from our library of silks, velvets and pashminas — or bring your own vision."],
              ["03", "Master Pattern", "Your unique block is cut, patterned and fitted three times over 30 days."],
              ["04", "Delivery", "White-glove delivery to your home, wherever in the world it may be."],
            ].map(([n, t, d]) => (
              <div key={n} className="grid grid-cols-[auto_1fr] gap-6 border-b border-foreground/10 pb-6">
                <span className="font-serif italic text-2xl text-[color:var(--gold)]">{n}</span>
                <div>
                  <h4 className="eyebrow text-[10.5px] mb-2">{t}</h4>
                  <p className="text-sm text-foreground/60 leading-relaxed">{d}</p>
                </div>
              </div>
            ))}
          </div>
          <a href="#" className="mt-10 inline-flex items-center gap-3 bg-[color:var(--maroon)] hover:bg-[color:var(--charcoal)] text-[color:var(--ivory)] px-10 py-4 eyebrow text-[10.5px] transition-colors">
            Book an appointment <ArrowRight className="size-3.5" />
          </a>
        </div>
      </section>
    </div>
  );
}