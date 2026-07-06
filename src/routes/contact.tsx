import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Delhi Flagship — Blessings" },
      { name: "description", content: "Visit the Blessings flagship in Delhi, or reach us on WhatsApp for a virtual consultation." },
      { property: "og:title", content: "Contact — Blessings" },
      { property: "og:description", content: "Delhi flagship, virtual fittings, WhatsApp concierge." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-24 md:py-32">
      <p className="eyebrow text-[color:var(--gold)] mb-6">Get in Touch</p>
      <h1 className="font-serif italic text-5xl md:text-6xl">Come see us in Delhi.</h1>
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <h3 className="eyebrow text-[10px] mb-4">Flagship Boutique</h3>
          <p className="text-sm text-foreground/70 leading-relaxed">
            21, South Extension II<br />
            New Delhi 110049<br />
            India
          </p>
          <p className="mt-4 eyebrow text-[10px] text-foreground/50">Mon — Sat, 11am to 8pm</p>
        </div>
        <div>
          <h3 className="eyebrow text-[10px] mb-4">Concierge</h3>
          <p className="text-sm text-foreground/70 leading-relaxed">
            WhatsApp: +91 98100 00000<br />
            hello@blessings.house
          </p>
        </div>
        <div>
          <h3 className="eyebrow text-[10px] mb-4">Virtual Consultation</h3>
          <p className="text-sm text-foreground/70 leading-relaxed mb-4">
            For our international clientele, we host virtual fittings over Zoom or WhatsApp video.
          </p>
          <a href="#" className="inline-block eyebrow text-[10px] border-b border-[color:var(--maroon)] text-[color:var(--maroon)] pb-1">Book Now →</a>
        </div>
      </div>
    </div>
  );
}