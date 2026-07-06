import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { useScrollExperience } from "@/components/site/scroll-experience";

type ParallaxScrollProps = {
  image: string;
  foreground: ReactNode;
  cover: ReactNode;
  coverGradient?: string;
  /** Override default parallax pin height, e.g. "30vh" */
  height?: string;
};

export function ParallaxScroll({
  image,
  foreground,
  cover,
  coverGradient = "to-background",
  height,
}: ParallaxScrollProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const { lenis } = useScrollExperience();

  const parallaxStyle = height
    ? ({ "--parallax-height": height } as CSSProperties)
    : undefined;

  useEffect(() => {
    const root = rootRef.current;
    const media = mediaRef.current;
    if (!root || !media) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasScrollTimeline = CSS.supports("animation-timeline", "scroll()");
    if (prefersReduced || hasScrollTimeline) return;

    const update = () => {
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / (rect.height + vh)));
      media.style.transform = `scale(${1 + progress * 0.1})`;
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    lenis?.on("scroll", update);
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      lenis?.off("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [lenis]);

  return (
    <div className="parallax-scroll" ref={rootRef} style={parallaxStyle}>
      <div className="parallax-scroll__pin" aria-hidden="true">
        <div
          ref={mediaRef}
          className="parallax-scroll__media"
          style={{ backgroundImage: `url(${image})` }}
        />
        <div className="parallax-scroll__shade" />
      </div>

      <div className="parallax-scroll__foreground">{foreground}</div>

      <div className="parallax-scroll__cover shadow-[0_-40px_80px_rgba(0,0,0,0.12)]">
        <div
          className={`h-10 md:h-20 bg-gradient-to-b from-transparent ${coverGradient} -mb-10 md:-mb-20 pointer-events-none`}
          aria-hidden="true"
        />
        {cover}
      </div>
    </div>
  );
}
