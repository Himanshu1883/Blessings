export const WHATSAPP_NUMBER = "918860306034";
export const WHATSAPP_DISPLAY = "+91 88603 06034";

export function whatsappUrl(message?: string, number = WHATSAPP_NUMBER) {
  const base = `https://wa.me/${number.replace(/\D/g, "")}`;
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

export type CustomOrderLine = { label: string; value: string };

export function buildCustomOrderMessage(input: {
  productName: string;
  productUrl?: string;
  sku?: string | null;
  outOfStock?: boolean;
  lines: CustomOrderLine[];
  notes?: string;
}) {
  const rows: string[] = [
    `Hi Blessings, I'd like a custom order for ${input.productName}.`,
  ];
  if (input.outOfStock) {
    rows.push("This size / piece is currently out of stock — please make it to order.");
  }
  rows.push("");
  if (input.sku) rows.push(`SKU: ${input.sku}`);
  if (input.productUrl) rows.push(`Link: ${input.productUrl}`);
  rows.push("");
  for (const line of input.lines) {
    if (!line.value.trim()) continue;
    rows.push(`${line.label}: ${line.value.trim()}`);
  }
  if (input.notes?.trim()) {
    rows.push("");
    rows.push(`Notes: ${input.notes.trim()}`);
  }
  rows.push("");
  rows.push("Please share timeline, fabric availability, and a quote.");
  return rows.join("\n");
}
