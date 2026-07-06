import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { WHATSAPP_MESSAGES, whatsappUrl } from "@/lib/whatsapp";

export function FloatingWhatsApp() {
  return (
    <a
      href={whatsappUrl(WHATSAPP_MESSAGES.general)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed z-[60] right-4 md:right-6 bottom-[calc(76px+env(safe-area-inset-bottom))] lg:bottom-6 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_28px_rgba(37,211,102,0.45)] hover:scale-105 hover:shadow-[0_10px_32px_rgba(37,211,102,0.55)] active:scale-95 transition-all"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}
