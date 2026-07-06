export const WHATSAPP_NUMBER = "9198100000000";
export const WHATSAPP_DISPLAY = "+91 98100 00000";

export function whatsappUrl(message?: string) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export const WHATSAPP_MESSAGES = {
  general: "Hi Blessings, I'd love to know more about your collections.",
  book: "Hi, I'd like to book a consultation at Blessings Men's Boutique.",
  chat: "Hi, I have a styling question for the Blessings team.",
} as const;
