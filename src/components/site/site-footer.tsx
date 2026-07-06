import { Link } from "@tanstack/react-router";
import { Instagram, MessageCircle, ArrowRight } from "lucide-react";
import { CATEGORIES } from "@/lib/catalog";

export function SiteFooter() {
  return (
    <footer className="relative bg-[color:var(--charcoal)] text-[color:var(--ivory)]/70 pt-24 md:pt-32 pb-8 overflow-hidden">
      {/* Watermark */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none select-none flex justify-center overflow-hidden">
        <span className="font-serif italic font-medium leading-none text-[22vw] text-[color:var(--ivory)]/[0.03] whitespace-nowrap translate-y-[15%]">
          Blessings
        </span>
      </div>

      <div className="relative max-w-[1600px] mx-auto px-6 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-10 md:gap-8 pb-20">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 space-y-6">
            <h2 className="font-serif italic text-4xl text-[color:var(--ivory)]">Blessings</h2>
            <p className="text-sm leading-relaxed max-w-xs">
              A haute-couture menswear house from Delhi. Bespoke sherwanis, bandhgalas
              and wedding suits, hand-crafted for the modern gentleman and delivered worldwide.
            </p>
            <div className="flex items-center gap-5 pt-2">
              <a href="#" className="hover:text-[color:var(--gold)] transition-colors" aria-label="Instagram"><Instagram className="size-4" strokeWidth={1.4} /></a>
              <a href="#" className="hover:text-[color:var(--gold)] transition-colors" aria-label="WhatsApp"><MessageCircle className="size-4" strokeWidth={1.4} /></a>
              <a href="#" className="eyebrow text-[10px] hover:text-[color:var(--gold)]">Pinterest</a>
            </div>
          </div>

          {/* Shop */}
          <div className="col-span-1 md:col-span-2 space-y-5">
            <h5 className="eyebrow text-[color:var(--gold)]">The Boutique</h5>
            <ul className="space-y-3 text-sm">
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link to="/shop/$category" params={{ category: c.slug }} className="hover:text-[color:var(--ivory)] transition-colors">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="col-span-1 md:col-span-2 space-y-5">
            <h5 className="eyebrow text-[color:var(--gold)]">The House</h5>
            <ul className="space-y-3 text-sm">
              <li><Link to="/about" className="hover:text-[color:var(--ivory)]">About</Link></li>
              <li><Link to="/bespoke" className="hover:text-[color:var(--ivory)]">Bespoke Process</Link></li>
              <li><Link to="/contact" className="hover:text-[color:var(--ivory)]">Delhi Flagship</Link></li>
              <li><Link to="/contact" className="hover:text-[color:var(--ivory)]">Book Consultation</Link></li>
              <li><Link to="/journal" className="hover:text-[color:var(--ivory)]">Journal</Link></li>
            </ul>
          </div>

          {/* Service */}
          <div className="col-span-2 md:col-span-2 space-y-5">
            <h5 className="eyebrow text-[color:var(--gold)]">Customer Care</h5>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-[color:var(--ivory)]">Shipping & Delivery</a></li>
              <li><a href="#" className="hover:text-[color:var(--ivory)]">Size Guide</a></li>
              <li><a href="#" className="hover:text-[color:var(--ivory)]">Returns</a></li>
              <li><a href="#" className="hover:text-[color:var(--ivory)]">Track Order</a></li>
              <li><a href="#" className="hover:text-[color:var(--ivory)]">FAQs</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 md:col-span-2 space-y-5">
            <h5 className="eyebrow text-[color:var(--gold)]">Inner Circle</h5>
            <p className="text-xs leading-relaxed">
              Private invitations to new collections and trunk shows.
            </p>
            <form className="flex items-center border-b border-[color:var(--ivory)]/20 focus-within:border-[color:var(--gold)] transition-colors">
              <input
                type="email"
                placeholder="Email address"
                className="bg-transparent flex-1 py-3 text-xs outline-none placeholder:text-[color:var(--ivory)]/40"
              />
              <button type="submit" className="text-[color:var(--gold)] p-2" aria-label="Subscribe">
                <ArrowRight className="size-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="pt-8 border-t border-[color:var(--ivory)]/10 flex flex-col md:flex-row items-center justify-between gap-4 eyebrow text-[9.5px] text-[color:var(--ivory)]/40">
          <p>© {new Date().getFullYear()} Blessings Men's Boutique. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>Amex</span>
            <span>Apple Pay</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-[color:var(--gold)]">Privacy</a>
            <a href="#" className="hover:text-[color:var(--gold)]">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}