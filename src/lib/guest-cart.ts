const KEY = "blessings.guest-cart";

export type GuestCartLine = {
  productId: string;
  size: string;
  quantity: number;
};

export function readGuestCart(): GuestCartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GuestCartLine[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line) =>
        line &&
        typeof line.productId === "string" &&
        typeof line.size === "string" &&
        typeof line.quantity === "number" &&
        line.quantity > 0,
    );
  } catch {
    return [];
  }
}

export function writeGuestCart(lines: GuestCartLine[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(lines));
}

export function addGuestCartLine(
  lines: GuestCartLine[],
  productId: string,
  size: string,
  quantity: number,
): GuestCartLine[] {
  const index = lines.findIndex((line) => line.productId === productId && line.size === size);
  if (index === -1) return [...lines, { productId, size, quantity }];
  return lines.map((line, i) =>
    i === index ? { ...line, quantity: line.quantity + quantity } : line,
  );
}

export function updateGuestCartLine(
  lines: GuestCartLine[],
  productId: string,
  size: string,
  quantity: number,
): GuestCartLine[] {
  if (quantity <= 0) return lines.filter((line) => !(line.productId === productId && line.size === size));
  return lines.map((line) =>
    line.productId === productId && line.size === size ? { ...line, quantity } : line,
  );
}

export function removeGuestCartLine(
  lines: GuestCartLine[],
  productId: string,
  size: string,
): GuestCartLine[] {
  return lines.filter((line) => !(line.productId === productId && line.size === size));
}
