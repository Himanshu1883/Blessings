export const WHATSAPP_NUMBER = "918860306034";
export const WHATSAPP_DISPLAY = "+91 88603 06034";

export function whatsappUrl(message?: string) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export const WHATSAPP_MESSAGES = {
  general: "Hi Blessings, I'd love to know more about your collections.",
  book: "Hi, I'd like to book a consultation at Blessings Men's Boutique.",
  chat: "Hi, I have a styling question for the Blessings team.",
  returns: "Hi Blessings, I have a question about a return or exchange.",
  shipping: "Hi Blessings, I'd like help with shipping or delivery.",
} as const;
