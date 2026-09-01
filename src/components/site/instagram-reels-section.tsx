import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { InstagramLink } from "@/components/site/instagram-link";
import { InstagramReel } from "@/components/site/instagram-reel";
import { INSTAGRAM_HANDLE, INSTAGRAM_REELS } from "@/lib/social";
import { cn } from "@/lib/utils";

function ReelTile({ src, index }: { src: string; index: number }) {
  return (
    <InstagramLink
      className="relative flex h-full w-full items-center justify-center group overflow-hidden rounded-sm bg-[color:var(--muted)]/40 ring-1 ring-foreground/10 p-0"
      showIcon={false}
      aria-label={`Watch reel ${index + 1} on Instagram`}
    >
      <InstagramReel src={src} />
      <div className="absolute inset-0 bg-[color:var(--charcoal)]/0 group-hover:bg-[color:var(--charcoal)]/45 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
        <InstagramIcon className="size-6 text-[color:var(--ivory)]" />
      </div>
    </InstagramLink>
  );
}

function useCompactReelsLayout() {
  const [compact, setCompact] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return compact;
}

function ReelsCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    dragFree: false,
    containScroll: "trimSnaps",
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const syncCarousel = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    syncCarousel();
    emblaApi.on("select", syncCarousel);
    emblaApi.on("reInit", syncCarousel);
    emblaApi.on("resize", syncCarousel);
    return () => {
      emblaApi.off("select", syncCarousel);
      emblaApi.off("reInit", syncCarousel);
      emblaApi.off("resize", syncCarousel);
    };
  }, [emblaApi, syncCarousel]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  return (
    <div className="max-w-[1600px] mx-auto">
      <div className="relative px-4 sm:px-6 md:px-8">
        {(canScrollPrev || canScrollNext) && (
          <>
            <div
              className="pointer-events-none absolute inset-y-0 left-4 sm:left-6 md:left-8 z-10 w-12 bg-gradient-to-r from-background via-background/80 to-transparent"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-4 sm:right-6 md:right-8 z-10 w-12 bg-gradient-to-l from-background via-background/80 to-transparent"
              aria-hidden="true"
            />
          </>
        )}

        <div ref={emblaRef} className="overflow-hidden" data-lenis-prevent>
          <div className="flex gap-3 sm:gap-4">
            {INSTAGRAM_REELS.map((src, i) => (
              <div
                key={src}
                className="min-w-0 shrink-0 grow-0 basis-[58vw] max-w-[210px] sm:basis-[190px] md:basis-[210px] aspect-[9/16]"
              >
                <ReelTile src={src} index={i} />
              </div>
            ))}
          </div>
        </div>

        {canScrollPrev && (
          <button
            type="button"
            onClick={scrollPrev}
            className="absolute left-5 sm:left-7 md:left-9 top-1/2 -translate-y-1/2 z-20 size-9 sm:size-10 flex items-center justify-center rounded-full border border-foreground/25 bg-background/95 text-foreground shadow-md hover:border-[color:var(--maroon)] hover:text-[color:var(--maroon)] transition-colors touch-manipulation"
            aria-label="Previous reel"
          >
            <ArrowLeft className="size-4" strokeWidth={1.5} />
          </button>
        )}
        {canScrollNext && (
          <button
            type="button"
            onClick={scrollNext}
            className="absolute right-5 sm:right-7 md:right-9 top-1/2 -translate-y-1/2 z-20 size-9 sm:size-10 flex items-center justify-center rounded-full border border-foreground/25 bg-background/95 text-foreground shadow-md hover:border-[color:var(--maroon)] hover:text-[color:var(--maroon)] transition-colors touch-manipulation"
            aria-label="Next reel"
          >
            <ArrowRight className="size-4" strokeWidth={1.5} />
          </button>
        )}
      </div>

      <div className="mt-5 flex items-center justify-center gap-2 px-4">
        {INSTAGRAM_REELS.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => scrollTo(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300 touch-manipulation",
              i === selectedIndex
                ? "w-6 bg-[color:var(--maroon)]"
                : "w-1.5 bg-foreground/20 hover:bg-foreground/40",
            )}
            aria-label={`Go to reel ${i + 1}`}
          />
        ))}
      </div>

      <p className="mt-3 text-center eyebrow text-[9px] text-foreground/45 tracking-widest">
        Swipe or tap arrows
      </p>
    </div>
  );
}

function ReelsGrid() {
  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-6 gap-4">
      {INSTAGRAM_REELS.map((src, i) => (
        <div key={src} className="aspect-[9/16] w-full">
          <ReelTile src={src} index={i} />
        </div>
      ))}
    </div>
  );
}

export function InstagramReelsSection() {
  const compact = useCompactReelsLayout();

  return (
    <section data-reveal-direction="alternate" className="py-16 sm:py-24 md:py-28 bg-background">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6 mb-8 sm:mb-10">
        <div>
          <p className="eyebrow text-[color:var(--gold)] mb-4">(03) The Journal</p>
          <h2 className="font-serif italic text-3xl sm:text-4xl md:text-5xl">
            @{INSTAGRAM_HANDLE}
          </h2>
        </div>
        <InstagramLink
          className="inline-flex items-center gap-3 eyebrow text-[10px] border-b border-foreground/20 pb-1 hover:text-[color:var(--maroon)] hover:border-[color:var(--maroon)] self-start sm:self-auto"
          iconClassName="size-3.5"
        >
          Follow on Instagram
        </InstagramLink>
      </div>

      {compact ? <ReelsCarousel /> : <ReelsGrid />}
    </section>
  );
}
