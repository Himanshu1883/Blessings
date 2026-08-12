import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type InstagramReelProps = {
  src: string;
  className?: string;
};

export function InstagramReel({ src, className }: InstagramReelProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const isVisibleRef = useRef(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    video.autoplay = true;
    video.defaultMuted = true;
    video.setAttribute("webkit-playsinline", "true");
    video.setAttribute("x5-playsinline", "true");
    video.setAttribute("muted", "");
    video.muted = true;
    video.playsInline = true;

    const tryPlay = () => {
      if (!isVisibleRef.current || document.visibilityState === "hidden") return;
      video.muted = true;
      void video.play().catch(() => {});
    };

    const schedulePlay = () => {
      requestAnimationFrame(() => {
        tryPlay();
        window.setTimeout(tryPlay, 150);
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        schedulePlay();
      } else {
        video.pause();
      }
    };

    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            ([entry]) => {
              isVisibleRef.current = entry.isIntersecting;
              if (entry.isIntersecting) {
                schedulePlay();
              } else {
                video.pause();
              }
            },
            { threshold: 0.2, rootMargin: "0px 0px 10% 0px" },
          )
        : null;

    if (observer) {
      observer.observe(video);
    } else {
      isVisibleRef.current = true;
    }

    video.addEventListener("loadedmetadata", schedulePlay);
    video.addEventListener("loadeddata", schedulePlay);
    video.addEventListener("canplay", schedulePlay);
    video.addEventListener("canplaythrough", schedulePlay);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", schedulePlay);

    if (video.readyState >= 2 || !observer) schedulePlay();

    return () => {
      observer?.disconnect();
      video.removeEventListener("loadedmetadata", schedulePlay);
      video.removeEventListener("loadeddata", schedulePlay);
      video.removeEventListener("canplay", schedulePlay);
      video.removeEventListener("canplaythrough", schedulePlay);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", schedulePlay);
    };
  }, [src]);

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      disablePictureInPicture
      disableRemotePlayback
      controls={false}
      aria-hidden="true"
      className={cn(
        "h-full w-full object-contain object-center",
        className,
      )}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
