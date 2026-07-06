import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { ParallaxScroll } from "@/components/site/parallax-scroll";

type PreFooterBannerProps = {
  children: ReactNode;
};

export function PreFooterBanner({ children }: PreFooterBannerProps) {
  return (
    <ParallaxScroll
      image="/banners/banner-2.jpeg"
      coverGradient="to-[color:var(--charcoal)]"
      foreground={
        <section className="parallax-scroll__panel max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 w-full" data-reveal-direction="right">
          <div className="max-w-2xl text-[color:var(--ivory)] py-12 sm:py-16 md:py-0">
            <p className="eyebrow text-[color:var(--gold-soft)] mb-4 sm:mb-6">The House of Blessings</p>
            <h2 className="font-serif italic text-3xl sm:text-4xl md:text-6xl lg:text-7xl leading-[1.05] text-balance">
              Dress like you <span className="text-[color:var(--gold-soft)]">mean it.</span>
            </h2>
            <p className="mt-8 text-[color:var(--ivory)]/85 text-sm md:text-base leading-relaxed max-w-lg">
              Hand-painted and hand-embroidered statement pieces from our Delhi atelier — bespoke fittings and
              worldwide delivery for the modern gentleman.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
              <Link
                to="/bespoke"
                className="inline-flex items-center justify-center gap-3 bg-[color:var(--gold)] hover:bg-[color:var(--ivory)] text-[color:var(--charcoal)] px-6 sm:px-8 py-3.5 sm:py-4 eyebrow text-[10px] sm:text-[10.5px] transition-colors"
              >
                Book bespoke <ArrowRight className="size-3.5" />
              </Link>
              <Link
                to="/shop/$category"
                params={{ category: "sherwanis" }}
                className="inline-flex items-center justify-center gap-3 border border-[color:var(--ivory)]/50 hover:border-[color:var(--gold-soft)] hover:text-[color:var(--gold-soft)] px-6 sm:px-8 py-3.5 sm:py-4 eyebrow text-[10px] sm:text-[10.5px] transition-colors"
              >
                Explore collection <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </section>
      }
      cover={children}
    />
  );
}
