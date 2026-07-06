import { createFileRoute } from "@tanstack/react-router";
import { WhatsAppLink } from "@/components/site/whatsapp-link";
import { WHATSAPP_DISPLAY, WHATSAPP_MESSAGES } from "@/lib/whatsapp";

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
    <div data-reveal-section className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32">
      <p className="eyebrow text-[color:var(--gold)] mb-4 sm:mb-6">Get in Touch</p>
      <h1 className="font-serif italic text-3xl sm:text-5xl md:text-6xl text-balance">Come see us in Delhi.</h1>
      <div className="mt-10 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10">
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
            <WhatsAppLink message={WHATSAPP_MESSAGES.general} className="hover:text-[#25D366] text-foreground/70">
              WhatsApp: {WHATSAPP_DISPLAY}
            </WhatsAppLink>
            <br />
            hello@blessings.house
          </p>
        </div>
        <div>
          <h3 className="eyebrow text-[10px] mb-4">Virtual Consultation</h3>
          <p className="text-sm text-foreground/70 leading-relaxed mb-4">
            For our international clientele, we host virtual fittings over Zoom or WhatsApp video.
          </p>
          <WhatsAppLink
            message={WHATSAPP_MESSAGES.book}
            className="inline-flex eyebrow text-[10px] border-b border-[#25D366] text-[#25D366] pb-1 hover:opacity-80"
          >
            Book on WhatsApp →
          </WhatsAppLink>
        </div>
      </div>
    </div>
  );
}