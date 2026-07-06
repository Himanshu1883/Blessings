import { Link } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { InstagramLink } from "@/components/site/instagram-link";
import { WhatsAppLink } from "@/components/site/whatsapp-link";
import { WHATSAPP_MESSAGES } from "@/lib/whatsapp";

const SHOP_LINKS = [
  { label: "Statement Blacks", to: "/shop/$category" as const, params: { category: "sherwanis" } },
  { label: "Wild Motif", to: "/shop/$category" as const, params: { category: "indo-western" } },
  { label: "Hand-Painted Edit", to: "/shop/$category" as const, params: { category: "occasion-kurtas" } },
  { label: "Nature Collection", to: "/shop/$category" as const, params: { category: "bandhgalas" } },
  { label: "Heritage & Detail", to: "/shop/$category" as const, params: { category: "wedding-suits" } },
  { label: "Bespoke", to: "/bespoke" as const },
] as const;

const HOUSE_LINKS = [
  { label: "Our Story", to: "/about" as const },
  { label: "The Bespoke Process", to: "/bespoke" as const },
  { label: "Book a Consultation", to: "/contact" as const },
  { label: "Visit the Delhi Atelier", to: "/contact" as const },
  { label: "Press", to: "/journal" as const },
] as const;

const CARE_LINKS = [
  "Worldwide Shipping",
  "Size Guide",
  "Returns & Exchange",
  "Fabric & Care",
  "Track Order",
  "FAQs",
] as const;

function FooterLink({
  label,
  to,
  params,
}: {
  label: string;
  to: "/bespoke" | "/about" | "/contact" | "/journal" | "/shop/$category";
  params?: { category: string };
}) {
  return (
    <Link to={to} params={params} className="hover:text-[color:var(--gold-soft)] transition-colors duration-300">
      {label}
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative min-h-[40vh] bg-[color:var(--charcoal)] text-[color:var(--ivory)]/75 overflow-hidden pb-[calc(76px+env(safe-area-inset-bottom))] lg:pb-0">
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: "url(/blessings_1.jpg.jpeg)",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          filter: "grayscale(1)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--charcoal)] via-transparent to-[color:var(--charcoal)] pointer-events-none" />

      <div className="relative min-h-[40vh] w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 pt-10 lg:pt-12 pb-5 flex flex-col">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-6 gap-y-6 lg:gap-5 flex-1">
          <div className="col-span-2 lg:col-span-4">
            <div className="font-serif text-2xl lg:text-3xl tracking-[0.14em] text-[color:var(--ivory)]">BLESSINGS</div>
            <div className="text-[9px] tracking-[0.44em] text-[color:var(--ivory)]/45 mt-1">MEN&apos;S BOUTIQUE · DELHI</div>
            <p className="mt-3 text-xs lg:text-sm text-[color:var(--ivory)]/65 leading-relaxed max-w-sm hidden sm:block">
              A Delhi atelier making hand-painted and hand-embroidered statement pieces for men who dress like they
              mean it — shipped worldwide.
            </p>
            <div className="flex gap-2.5 mt-3">
              <InstagramLink
                aria-label="Instagram"
                className="size-11 border border-[color:var(--ivory)]/15 grid place-items-center text-[color:var(--ivory)]/80 hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] transition-colors"
                iconClassName="size-4"
              />
              <WhatsAppLink
                message={WHATSAPP_MESSAGES.general}
                aria-label="WhatsApp"
                className="size-11 border border-[color:var(--ivory)]/15 grid place-items-center text-[color:var(--ivory)]/80 hover:border-[#25D366] hover:text-[#25D366] transition-colors"
                iconClassName="size-4"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="text-[9px] tracking-[0.32em] uppercase text-[color:var(--gold)] mb-3">Shop</div>
            <ul className="space-y-2 text-xs lg:text-sm">
              {SHOP_LINKS.map((link) => (
                <li key={link.label}>
                  {"params" in link ? (
                    <FooterLink label={link.label} to={link.to} params={link.params} />
                  ) : (
                    <FooterLink label={link.label} to={link.to} />
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <div className="text-[9px] tracking-[0.32em] uppercase text-[color:var(--gold)] mb-3">The House</div>
            <ul className="space-y-2 text-xs lg:text-sm">
              {HOUSE_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink label={link.label} to={link.to} />
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <div className="text-[9px] tracking-[0.32em] uppercase text-[color:var(--gold)] mb-3">Care</div>
            <ul className="space-y-2 text-xs lg:text-sm">
              {CARE_LINKS.map((label) => (
                <li key={label}>
                  <a href="#" className="hover:text-[color:var(--gold-soft)] transition-colors duration-300">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-2">
            <div className="text-[9px] tracking-[0.32em] uppercase text-[color:var(--gold)] mb-3">Inner Circle</div>
            <p className="text-xs lg:text-sm text-[color:var(--ivory)]/65 mb-3 leading-relaxed hidden sm:block">
              First look at new drops and private trunk shows.
            </p>
            <form className="flex border border-[color:var(--ivory)]/20 focus-within:border-[color:var(--gold)] transition-colors">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[color:var(--ivory)]/30 text-[color:var(--ivory)]"
              />
              <button
                type="submit"
                className="px-4 text-[color:var(--ivory)]/70 hover:text-[color:var(--gold)] transition-colors"
                aria-label="Subscribe"
              >
                <Send className="size-4" strokeWidth={1.4} />
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 lg:mt-10 pt-5 border-t border-[color:var(--ivory)]/10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-[10px] tracking-[0.28em] uppercase text-[color:var(--ivory)]/40">
          <div>© {new Date().getFullYear()} Blessings Men&apos;s Boutique. Handmade in India.</div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>Amex</span>
            <span>UPI</span>
            <span>PayPal</span>
          </div>
        </div>

        <div className="pointer-events-none select-none absolute bottom-0 inset-x-0 overflow-hidden hidden lg:block">
          <div className="font-serif italic font-medium text-[22vw] leading-none text-[color:var(--ivory)]/[0.03] whitespace-nowrap -mb-8 -ml-4 tracking-tighter">
            Blessings
          </div>
        </div>
      </div>
    </footer>
  );
}
