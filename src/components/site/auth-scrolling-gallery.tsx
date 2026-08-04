import { cn } from "@/lib/utils";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import catSherwani from "@/assets/cat-sherwani.jpg";
import catBandhgala from "@/assets/cat-bandhgala.jpg";
import catGroom from "@/assets/cat-groom.jpg";
import catIndowestern from "@/assets/cat-indowestern.jpg";
import craft from "@/assets/craft.jpg";
import bespoke from "@/assets/bespoke.jpg";

const COLUMN_A = [product1, catSherwani, product3, catGroom, craft, product2];
const COLUMN_B = [catBandhgala, product4, catIndowestern, bespoke, product1, catIndowestern];

function ScrollColumn({
  images,
  direction,
  className,
}: {
  images: string[];
  direction: "up" | "down";
  className?: string;
}) {
  const loop = [...images, ...images];

  return (
    <div className={cn("auth-gallery-column relative h-full overflow-hidden", className)}>
      <div
        className={cn(
          "flex flex-col gap-2 sm:gap-3",
          direction === "up" ? "auth-gallery-scroll-up" : "auth-gallery-scroll-down",
        )}
      >
        {loop.map((src, i) => (
          <div key={`${src}-${i}`} className="aspect-[4/5] w-full shrink-0 overflow-hidden bg-muted">
            <img src={src} alt="" className="size-full object-cover" loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AuthScrollingGallery({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden grid grid-cols-2 gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-sm",
        className,
      )}
      aria-hidden
    >
      <ScrollColumn images={COLUMN_A} direction="up" className="h-full" />
      <ScrollColumn images={COLUMN_B} direction="down" className="h-full" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/15 via-transparent to-background/25" />
    </div>
  );
}
