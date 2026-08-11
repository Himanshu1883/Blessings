import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useScrollExperience } from "@/components/site/scroll-experience";
import { cn } from "@/lib/utils";
import { useEffect, type ReactNode } from "react";

const sizeMap = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

export function AdminModal({
  open,
  onOpenChange,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof sizeMap;
}) {
  const { lenis } = useScrollExperience();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lenis?.stop();

    return () => {
      document.body.style.overflow = previousOverflow;
      lenis?.start();
    };
  }, [open, lenis]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-lenis-prevent
        className={cn(
          sizeMap[size],
          "max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden",
        )}
      >
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle className="font-serif italic text-xl">{title}</DialogTitle>
        </DialogHeader>
        <div
          className="flex-1 overflow-y-auto overscroll-contain px-6 py-4 admin-scrollbar"
          data-lenis-prevent
        >
          {children}
        </div>
        {footer && (
          <DialogFooter className="px-6 py-4 border-t border-border shrink-0">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
