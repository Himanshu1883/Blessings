import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef, CSSProperties, ElementType } from "react";

type RevealProps<T extends ElementType = "div"> = {
  as?: T;
  variant?: "up" | "fade" | "left" | "right" | "scale";
  delay?: number;
} & ComponentPropsWithoutRef<T>;

export function Reveal<T extends ElementType = "div">({
  as,
  variant = "up",
  delay = 0,
  className,
  style,
  ...props
}: RevealProps<T>) {
  const Component = as ?? "div";

  return (
    <Component
      data-reveal={variant}
      className={cn(className)}
      style={{ ...style, "--reveal-i": delay } as CSSProperties}
      {...props}
    />
  );
}
