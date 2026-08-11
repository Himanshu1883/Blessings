import { cn } from "@/lib/utils";
import type { ReactNode, SVGProps } from "react";

type SiteIconProps = SVGProps<SVGSVGElement> & {
  className?: string;
};

function SiteIcon({
  className,
  viewBox = "0 0 448 512",
  children,
  ...props
}: SiteIconProps & { children: ReactNode }) {
  return (
    <svg
      className={cn("shrink-0 w-[1.125rem] h-[1.125rem] sm:w-5 sm:h-5", className)}
      width="20"
      height="20"
      fill="currentColor"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function UserIcon(props: SiteIconProps) {
  return (
    <SiteIcon {...props}>
      <path d="M313.6 304c-28.7 0-42.5 16-89.6 16-47.1 0-60.8-16-89.6-16C60.2 304 0 364.2 0 438.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-25.6c0-74.2-60.2-134.4-134.4-134.4zM400 464H48v-25.6c0-47.6 38.8-86.4 86.4-86.4 14.6 0 38.3 16 89.6 16 51.7 0 74.9-16 89.6-16 47.6 0 86.4 38.8 86.4 86.4V464zM224 288c79.5 0 144-64.5 144-144S303.5 0 224 0 80 64.5 80 144s64.5 144 144 144zm0-240c52.9 0 96 43.1 96 96s-43.1 96-96 96-96-43.1-96-96 43.1-96 96-96z" />
    </SiteIcon>
  );
}

export function SearchIcon(props: SiteIconProps) {
  return (
    <SiteIcon {...props}>
      <path d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z" />
    </SiteIcon>
  );
}

export function HeartIcon(props: SiteIconProps) {
  return (
    <SiteIcon {...props}>
      <path d="M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66 146.4-9.9 204.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.1-58.6 52.9-151.4-9.8-204.9z" />
    </SiteIcon>
  );
}

export function BagIcon(props: SiteIconProps) {
  return (
    <SiteIcon {...props}>
      <path d="M352 160v-32C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128v32H0v272c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V160h-96zM96 128c0-35.29 28.71-64 64-64s64 28.71 64 64v32H96v-32zm256 304c0 8.822-7.178 16-16 16H80c-8.822 0-16-7.178-16-16V192h288v240z" />
    </SiteIcon>
  );
}

export function MenuIcon(props: SiteIconProps) {
  return (
    <SiteIcon {...props}>
      <path d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z" />
    </SiteIcon>
  );
}

export function CloseIcon(props: SiteIconProps) {
  return (
    <SiteIcon {...props}>
      <path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z" />
    </SiteIcon>
  );
}

export function ChevronDownIcon(props: SiteIconProps) {
  return (
    <SiteIcon {...props}>
      <path d="M201.4 342.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 274.7 86.6 137.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z" />
    </SiteIcon>
  );
}

export function HomeIcon(props: SiteIconProps) {
  return (
    <SiteIcon viewBox="0 0 576 512" {...props}>
      <path d="M575.8 255.5c0 18-14 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40H456c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1H416 392c-22.1 0-40-17.9-40-40V448 384c0-17.7-14.3-32-32-32H256c-17.7 0-32 14.3-32 32v64 24c0 22.1-17.9 40-40 40H160 128.1c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2H104c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9 .1-2.8V287.6H32c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z" />
    </SiteIcon>
  );
}

export function CalendarIcon(props: SiteIconProps) {
  return (
    <SiteIcon {...props}>
      <path d="M152 64H56C25.1 64 0 89.1 0 120v336c0 30.9 25.1 56 56 56h392c30.9 0 56-25.1 56-56V120c0-30.9-25.1-56-56-56h-96V24c0-13.3-10.7-24-24-24s-24 10.7-24 24v40H152V24c0-13.3-10.7-24-24-24s-24 10.7-24 24v40zM48 448V176h384v272c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16z" />
    </SiteIcon>
  );
}

export function ChatIcon(props: SiteIconProps) {
  return (
    <SiteIcon {...props}>
      <path d="M256 32C114.6 32 0 125.1 0 240c0 47.6 19.9 91.2 52.9 126.3C38 405.7 7 439.1 6.5 439.5c-6.6 7-8.4 17.3-4.6 26.2S12.5 480 21.5 480c57.8 0 108.8-27.3 141.1-69.4 27.9 8.4 57.5 12.9 87.4 12.9 141.4 0 256-93.1 256-208S397.4 32 256 32z" />
    </SiteIcon>
  );
}

export function LogOutIcon(props: SiteIconProps) {
  return (
    <SiteIcon {...props}>
      <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.4-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.4c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z" />
    </SiteIcon>
  );
}

export function PackageIcon(props: SiteIconProps) {
  return (
    <SiteIcon {...props}>
      <path d="M50.7 58.5L0 160H208V32H93.7C75.8 32 59 41.3 50.7 58.5zM240 32V160H448L397.3 58.5C389 41.3 372.2 32 354.3 32H240zm208 160H48V416c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V192z" />
    </SiteIcon>
  );
}

export function TrashIcon(props: SiteIconProps) {
  return (
    <SiteIcon {...props}>
      <path d="M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z" />
    </SiteIcon>
  );
}

export function MinusIcon(props: SiteIconProps) {
  return (
    <SiteIcon viewBox="0 0 448 512" {...props}>
      <path d="M432 256c0 17.7-14.3 32-32 32H48c-17.7 0-32-14.3-32-32s14.3-32 32-32h352c17.7 0 32 14.3 32 32z" />
    </SiteIcon>
  );
}

export function PlusIcon(props: SiteIconProps) {
  return (
    <SiteIcon {...props}>
      <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" />
    </SiteIcon>
  );
}

export function EditIcon(props: SiteIconProps) {
  return (
    <SiteIcon {...props}>
      <path d="M290.74 93.24l128.02 128.02-277.99 277.99-114.14 12.6C11.35 513.54-1.59 500.62 14.38 485.34l12.69-114.14 277.96-277.99zm207.2-114.87l-60.61-60.61a31.998 31.998 0 0 0-45.15 0l-125.4 125.4-128.02 128.02L416 224l58.75-58.75c12.49-12.49 12.49-32.76 0-45.25z" />
    </SiteIcon>
  );
}
