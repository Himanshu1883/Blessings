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
      height="40vh"
      coverGradient="to-[color:var(--charcoal)]"
      foreground={
        <section
          className="parallax-scroll__panel mx-auto w-full max-w-[1600px] px-4 sm:px-6 md:px-8"
          data-reveal-direction="right"
        >
          <div className="flex max-w-3xl flex-col justify-center py-4 text-[color:var(--ivory)] sm:py-5">
            <p className="eyebrow mb-2 text-[color:var(--gold-soft)] sm:mb-3">The House of Blessings</p>
            <h2 className="font-serif text-balance text-2xl leading-tight italic sm:text-3xl md:text-4xl lg:text-[2.75rem]">
              Dress like you <span className="text-[color:var(--gold-soft)]">mean it.</span>
            </h2>
            <p className="mt-2 hidden max-w-lg text-[13px] leading-relaxed text-[color:var(--ivory)]/80 sm:mt-3 sm:line-clamp-2 sm:block">
              Hand-painted and hand-embroidered statement pieces from our Delhi atelier — bespoke fittings and
              worldwide delivery.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-5 sm:gap-3">
              <Link
                to="/bespoke"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[color:var(--gold)] px-5 eyebrow text-[9px] tracking-[0.16em] text-[color:var(--charcoal)] transition-colors hover:bg-[color:var(--gold-soft)] sm:px-6"
              >
                Book bespoke
                <ArrowRight className="size-3.5" />
              </Link>
              <Link
                to="/shop/$category"
                params={{ category: "all" }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[color:var(--ivory)]/40 px-5 eyebrow text-[9px] tracking-[0.16em] text-[color:var(--ivory)] transition-colors hover:border-[color:var(--gold-soft)] hover:text-[color:var(--gold-soft)] sm:px-6"
              >
                Explore collection
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </section>
      }
      cover={children}
    />
  );
}
