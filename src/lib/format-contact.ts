export function isPlaceholderEmail(email?: string | null) {
  if (!email) return true;
  return /@(?:mobile\.)?zenmen\.local$/i.test(email) || /noreply/i.test(email);
}

export function displayEmail(email?: string | null) {
  if (!email || isPlaceholderEmail(email)) return null;
  return email;
}

export function normalizeIndianMobile(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export function isIndianMobile(phone: string) {
  return /^[6-9]\d{9}$/.test(normalizeIndianMobile(phone));
}

export function formatIndianMobile(phone?: string | null) {
  if (!phone) return null;
  const d = normalizeIndianMobile(phone);
  if (d.length !== 10) return phone;
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
}
