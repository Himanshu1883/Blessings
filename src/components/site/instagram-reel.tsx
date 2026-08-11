import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type InstagramReelProps = {
  src: string;
  className?: string;
};

export function InstagramReel({ src, className }: InstagramReelProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    video.setAttribute("webkit-playsinline", "true");
    video.setAttribute("x5-playsinline", "true");
    video.muted = true;

    const tryPlay = () => {
      void video.play().catch(() => {});
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          tryPlay();
        } else {
          video.pause();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px 10% 0px" },
    );

    observer.observe(video);
    video.addEventListener("loadeddata", tryPlay);

    if (video.readyState >= 2) tryPlay();

    return () => {
      observer.disconnect();
      video.removeEventListener("loadeddata", tryPlay);
    };
  }, [src]);

  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      disablePictureInPicture
      controls={false}
      aria-hidden="true"
      className={cn(
        "h-full w-full object-contain object-center",
        className,
      )}
    />
  );
}
