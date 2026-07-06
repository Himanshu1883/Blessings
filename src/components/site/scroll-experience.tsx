import { useRouterState } from "@tanstack/react-router";
import Lenis from "lenis";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";

type ScrollExperienceContextValue = {
  lenis: Lenis | null;
};

const ScrollExperienceContext = createContext<ScrollExperienceContextValue>({
  lenis: null,
});

export function useScrollExperience() {
  return useContext(ScrollExperienceContext);
}

type RevealDirection = "up" | "left" | "right" | "split" | "alternate";

function applyRevealDirection(el: Element, index: number, direction: RevealDirection | null) {
  el.classList.remove("reveal-from-left", "reveal-from-right");

  if (direction === "left") {
    el.classList.add("reveal-from-left");
  } else if (direction === "right") {
    el.classList.add("reveal-from-right");
  } else if (direction === "split" || direction === "alternate") {
    el.classList.add(index % 2 === 0 ? "reveal-from-left" : "reveal-from-right");
  }
}

function registerRevealItem(
  el: Element,
  index: number,
  direction: RevealDirection | null,
) {
  el.classList.add("reveal-item");
  (el as HTMLElement).style.setProperty("--reveal-i", String(index));
  applyRevealDirection(el, index, direction);
}

function setupScrollReveals() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced) {
    document.querySelectorAll(".reveal-group, [data-reveal]").forEach((el) => {
      el.classList.add("is-inview");
    });
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-inview");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -5% 0px" },
  );

  const targets = document.querySelectorAll(
    "main section:not(.reveal-ignore), main .parallax-scroll__panel, main [data-reveal-section], footer, [data-reveal]",
  );

  targets.forEach((section) => {
    if (section.classList.contains("reveal-group")) return;

    section.classList.add("reveal-group");
    const direction = (section.getAttribute("data-reveal-direction") ??
      null) as RevealDirection | null;

    section.querySelectorAll(":scope > *").forEach((child, i) => {
      const grid = child.classList.contains("grid")
        ? child
        : child.querySelector(":scope > .grid, :scope > .flex.snap-x");

      if (grid && (grid.classList.contains("grid") || grid.classList.contains("snap-x"))) {
        const gridDirection =
          (grid.getAttribute("data-reveal-direction") as RevealDirection | null) ?? direction;

        grid.querySelectorAll(":scope > *").forEach((gridChild, gi) => {
          registerRevealItem(gridChild, gi, gridDirection);
        });
        return;
      }

      if (!child.classList.contains("absolute")) {
        registerRevealItem(child, i, direction);
      }
    });

    observer.observe(section);

    const rect = section.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
      section.classList.add("is-inview");
      observer.unobserve(section);
    }
  });

  document.querySelectorAll("[data-reveal]:not(.reveal-group)").forEach((el) => {
    observer.observe(el);
  });

  return () => observer.disconnect();
}

export function ScrollExperienceProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

    if (!reduced) {
      const instance = new Lenis({
        duration: coarsePointer ? 0.9 : 1.15,
        easing: (t) => 1 - Math.pow(1 - t, 4),
        smoothWheel: true,
        syncTouch: false,
        touchMultiplier: 1.6,
        wheelMultiplier: 0.9,
        infinite: false,
      });

      lenisRef.current = instance;
      setLenis(instance);

      const raf = (time: number) => {
        instance.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);

      document.documentElement.classList.add("lenis", "lenis-smooth");
    }

    return () => {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      setLenis(null);
      document.documentElement.classList.remove("lenis", "lenis-smooth");
    };
  }, []);

  useEffect(() => {
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(0, { immediate: true, force: true });
    } else {
      window.scrollTo(0, 0);
    }

    let cleanup = () => {};
    const frame = requestAnimationFrame(() => {
      cleanup = setupScrollReveals();
    });

    return () => {
      cancelAnimationFrame(frame);
      cleanup();
    };
  }, [pathname]);

  return (
    <ScrollExperienceContext.Provider value={{ lenis }}>
      {children}
    </ScrollExperienceContext.Provider>
  );
}
