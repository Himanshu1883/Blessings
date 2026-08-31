import { cn } from "@/lib/utils";

export function GoogleAuthButton({
  href,
  disabled,
  label = "Continue with Google",
}: {
  href: string;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <a
      href={disabled ? undefined : href}
      aria-disabled={disabled}
      className={cn(
        "flex w-full items-center justify-center gap-3 border border-foreground/15 py-3 text-sm transition-colors",
        disabled
          ? "pointer-events-none opacity-50"
          : "hover:bg-muted/40",
      )}
    >
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.49 12.27c0-.82-.07-1.64-.23-2.43H12v4.6h6.46a5.52 5.52 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.55-5.17 3.55-8.8Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.96-1.07 7.95-2.93l-3.88-3c-1.08.73-2.47 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24Z"
        />
        <path
          fill="#FBBC05"
          d="M5.27 14.27A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.27V6.64H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.36l4-3.09Z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.14 15.24 0 12 0A12 12 0 0 0 1.27 6.64l4 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
        />
      </svg>
      {label}
    </a>
  );
}
