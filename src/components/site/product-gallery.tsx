import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Maximize2, X, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type ProductGalleryProps = {
  images: string[];
  alt: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function touchDistance(a: { clientX: number; clientY: number }, b: { clientX: number; clientY: number }) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

export function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const count = images.length;
  const src = images[index] ?? "";

  const go = useCallback(
    (next: number) => {
      if (count < 2) return;
      setIndex((next + count) % count);
    },
    [count],
  );

  useEffect(() => {
    setIndex(0);
  }, [images]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lightbox) return;
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, lightbox]);

  useEffect(() => {
    images.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [images]);

  useEffect(() => {
    const el = thumbsRef.current?.querySelector<HTMLElement>(`[data-thumb="${index}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [index]);

  if (!src) return null;

  return (
    <>
      <div className="w-full">
        <div className="pdp-stage relative flex items-center justify-center overflow-hidden bg-background">
          <ZoomStage src={src} alt={alt} onSwipe={(dir) => go(index + dir)} swipeEnabled={count > 1} />

          <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
            {count > 1 && (
              <span className="eyebrow bg-[color:var(--ivory)]/90 px-2.5 py-1.5 text-[9px] text-[color:var(--charcoal)] backdrop-blur-sm">
                {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
              </span>
            )}
            <button
              type="button"
              aria-label="Open zoom view"
              onClick={() => setLightbox(true)}
              className="flex size-10 items-center justify-center bg-[color:var(--ivory)]/90 text-[color:var(--charcoal)] backdrop-blur-sm transition-colors hover:bg-[color:var(--ivory)]"
            >
              <Maximize2 className="size-4" strokeWidth={1.5} />
            </button>
          </div>

          <ZoomHint />
        </div>

        {count > 1 && (
          <div className="mt-3 flex items-center gap-2 sm:mt-4">
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => go(index - 1)}
              className="flex size-9 shrink-0 items-center justify-center border border-foreground/15 text-foreground/60 transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              <ChevronLeft className="size-4" strokeWidth={1.4} />
            </button>
            <div
              ref={thumbsRef}
              className="pdp-thumbs flex min-w-0 flex-1 gap-2 overflow-x-auto scroll-smooth"
            >
              {images.map((thumb, i) => (
                <button
                  key={`${thumb}-${i}`}
                  type="button"
                  data-thumb={i}
                  onClick={() => setIndex(i)}
                  aria-label={`View image ${i + 1}`}
                  aria-pressed={i === index}
                  className={cn(
                    "h-[4.5rem] w-[3.4rem] shrink-0 overflow-hidden border bg-background sm:h-20 sm:w-16",
                    i === index
                      ? "border-[color:var(--charcoal)]"
                      : "border-transparent hover:border-foreground/25",
                  )}
                >
                  <img src={thumb} alt="" className="h-full w-full object-cover object-top" />
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => go(index + 1)}
              className="flex size-9 shrink-0 items-center justify-center border border-foreground/15 text-foreground/60 transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              <ChevronRight className="size-4" strokeWidth={1.4} />
            </button>
          </div>
        )}
      </div>

      {lightbox && (
        <Lightbox
          images={images}
          index={index}
          alt={alt}
          onIndex={setIndex}
          onClose={() => setLightbox(false)}
        />
      )}
    </>
  );
}

function ZoomHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(() => setVisible(false), 2800);
    return () => window.clearTimeout(id);
  }, []);

  if (!visible) return null;

  return (
    <p className="pointer-events-none absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 bg-[color:var(--charcoal)]/55 px-3 py-1.5 text-[10px] tracking-[0.14em] text-[color:var(--ivory)] uppercase backdrop-blur-sm">
      <ZoomIn className="size-3" strokeWidth={1.6} />
      <span className="hidden lg:inline">Hover to zoom</span>
      <span className="lg:hidden">Pinch or double-tap</span>
    </p>
  );
}

function ZoomStage({
  src,
  alt,
  onSwipe,
  swipeEnabled,
}: {
  src: string;
  alt: string;
  onSwipe: (dir: 1 | -1) => void;
  swipeEnabled: boolean;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState("50% 50%");
  const [scale, setScale] = useState(1);
  const [hovering, setHovering] = useState(false);
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const lastTap = useRef(0);
  const scaleRef = useRef(1);
  const [canHover, setCanHover] = useState(false);

  const pointOrigin = (clientX: number, clientY: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return "50% 50%";
    const x = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
    const y = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100);
    return `${x}% ${y}%`;
  };

  const reset = () => {
    setScale(1);
    setOrigin("50% 50%");
    setHovering(false);
    pinch.current = null;
    swipe.current = null;
  };

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    reset();
  }, [src]);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const blockScroll = (e: TouchEvent) => {
      if (e.touches.length === 2 || scaleRef.current > 1) e.preventDefault();
    };
    el.addEventListener("touchmove", blockScroll, { passive: false });
    return () => el.removeEventListener("touchmove", blockScroll);
  }, []);

  return (
    <div
      ref={stageRef}
      className={cn(
        "relative flex h-full w-auto max-h-full max-w-full items-center justify-center overflow-hidden select-none",
        scale > 1 ? "touch-none" : "touch-pan-y",
        hovering || scale > 1 ? "cursor-crosshair" : "cursor-zoom-in",
      )}
      onMouseEnter={() => {
        if (!canHover) return;
        setHovering(true);
        setScale(2.2);
      }}
      onMouseMove={(e) => {
        if (!canHover) return;
        setHovering(true);
        setScale(2.2);
        setOrigin(pointOrigin(e.clientX, e.clientY));
      }}
      onMouseLeave={() => {
        if (!canHover) return;
        reset();
      }}
      onTouchStart={(e) => {
        if (e.touches.length === 2) {
          pinch.current = { dist: touchDistance(e.touches[0], e.touches[1]), scale };
          swipe.current = null;
          return;
        }
        if (e.touches.length === 1) {
          swipe.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
      }}
      onTouchMove={(e) => {
        if (e.touches.length === 2 && pinch.current) {
          const dist = touchDistance(e.touches[0], e.touches[1]);
          const next = clamp(pinch.current.scale * (dist / pinch.current.dist), 1, 3.4);
          const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          setOrigin(pointOrigin(midX, midY));
          setScale(next);
          return;
        }
        if (e.touches.length === 1 && scale > 1) {
          setOrigin(pointOrigin(e.touches[0].clientX, e.touches[0].clientY));
        }
      }}
      onTouchEnd={(e) => {
        if (pinch.current) {
          pinch.current = null;
          if (scale < 1.12) reset();
          return;
        }
        const t = e.changedTouches[0];
        if (!t) return;

        const now = Date.now();
        if (now - lastTap.current < 280) {
          lastTap.current = 0;
          if (scale > 1) reset();
          else {
            setOrigin(pointOrigin(t.clientX, t.clientY));
            setScale(2.4);
          }
          swipe.current = null;
          return;
        }
        lastTap.current = now;

        if (swipeEnabled && scale <= 1 && swipe.current) {
          const dx = t.clientX - swipe.current.x;
          const dy = t.clientY - swipe.current.y;
          if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) {
            onSwipe(dx < 0 ? 1 : -1);
          }
        }
        swipe.current = null;
      }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="pdp-zoom-img h-full w-auto max-w-full object-contain"
        style={{
          transformOrigin: origin,
          transform: `scale(${scale})`,
          transition: pinch.current || hovering ? "none" : "transform 220ms ease-out",
        }}
      />
    </div>
  );
}

function Lightbox({
  images,
  index,
  alt,
  onIndex,
  onClose,
}: {
  images: string[];
  index: number;
  alt: string;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const count = images.length;
  const src = images[index] ?? "";
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const pan = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const lastTap = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);

  const resetView = () => {
    setScale(1);
    setTx(0);
    setTy(0);
  };

  useEffect(() => {
    resetView();
  }, [index]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % count);
      if (e.key === "ArrowLeft") onIndex((index - 1 + count) % count);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [count, index, onClose, onIndex]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const prevent = (e: Event) => e.preventDefault();
    el.addEventListener("wheel", prevent, { passive: false });
    el.addEventListener("touchmove", prevent, { passive: false });
    return () => {
      el.removeEventListener("wheel", prevent);
      el.removeEventListener("touchmove", prevent);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-[color:var(--charcoal)]"
      role="dialog"
      aria-modal="true"
      aria-label="Zoomed product image"
    >
      <div className="flex items-center justify-between px-4 py-3 text-[color:var(--ivory)]">
        <p className="eyebrow text-[10px] text-[color:var(--ivory)]/70">
          {alt}
          {count > 1 ? `  ·  ${index + 1} / ${count}` : ""}
        </p>
        <button
          type="button"
          aria-label="Close zoom view"
          onClick={onClose}
          className="flex size-10 items-center justify-center hover:bg-white/10"
        >
          <X className="size-5" strokeWidth={1.4} />
        </button>
      </div>

      <div
        ref={stageRef}
        className="relative flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden"
        onDoubleClick={(e) => {
          if (scale > 1) {
            resetView();
            return;
          }
          setScale(2.6);
          setTx(0);
          setTy(0);
          e.preventDefault();
        }}
        onWheel={(e) => {
          e.preventDefault();
          setScale((s) => clamp(s + (e.deltaY < 0 ? 0.18 : -0.18), 1, 4));
        }}
        onTouchStart={(e) => {
          if (e.touches.length === 2) {
            pinch.current = { dist: touchDistance(e.touches[0], e.touches[1]), scale };
            pan.current = null;
            return;
          }
          if (e.touches.length === 1) {
            pan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx, ty };
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 2 && pinch.current) {
            const dist = touchDistance(e.touches[0], e.touches[1]);
            setScale(clamp(pinch.current.scale * (dist / pinch.current.dist), 1, 4.2));
            return;
          }
          if (e.touches.length === 1 && pan.current && scale > 1) {
            setTx(pan.current.tx + (e.touches[0].clientX - pan.current.x));
            setTy(pan.current.ty + (e.touches[0].clientY - pan.current.y));
          }
        }}
        onTouchEnd={(e) => {
          if (pinch.current) {
            pinch.current = null;
            if (scale < 1.08) resetView();
            return;
          }
          const t = e.changedTouches[0];
          if (!t) return;
          const now = Date.now();
          if (now - lastTap.current < 280) {
            lastTap.current = 0;
            if (scale > 1) resetView();
            else setScale(2.6);
            pan.current = null;
            return;
          }
          lastTap.current = now;

          if (scale <= 1 && pan.current && count > 1) {
            const dx = t.clientX - pan.current.x;
            if (Math.abs(dx) > 56) onIndex((index + (dx < 0 ? 1 : -1) + count) % count);
          }
          pan.current = null;
        }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="max-h-full max-w-full object-contain"
          style={{
            transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`,
            transition: pinch.current || pan.current ? "none" : "transform 200ms ease-out",
          }}
        />

        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => onIndex((index - 1 + count) % count)}
              className="absolute left-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center bg-white/10 text-[color:var(--ivory)] hover:bg-white/20"
            >
              <ChevronLeft className="size-5" strokeWidth={1.4} />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => onIndex((index + 1) % count)}
              className="absolute right-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center bg-white/10 text-[color:var(--ivory)] hover:bg-white/20"
            >
              <ChevronRight className="size-5" strokeWidth={1.4} />
            </button>
          </>
        )}
      </div>

      <p className="px-4 py-3 text-center text-[11px] tracking-[0.16em] text-[color:var(--ivory)]/55 uppercase">
        Pinch, scroll, or double-tap to zoom
      </p>
    </div>
  );
}
