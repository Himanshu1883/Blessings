import { Order, type IOrder } from "../models/Order.js";
import { AppError } from "../utils/apiResponse.js";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 38;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const CHARCOAL = [0.12, 0.1, 0.09] as const;
const MAROON = [0.35, 0.07, 0.06] as const;
const GOLD = [0.72, 0.52, 0.22] as const;
const IVORY = [0.98, 0.96, 0.91] as const;
const LINE = [0.78, 0.72, 0.62] as const;

type PdfPage = { ops: string[] };
type Color = readonly [number, number, number];
type TextOptions = {
  size?: number;
  align?: "left" | "right" | "center";
  font?: "regular" | "bold";
  color?: Color;
};

function normalizePdfText(value: unknown) {
  return String(value ?? "")
    .replace(/₹/g, "INR ")
    .replace(/[–—−]/g, "-")
    .replace(/[•·]/g, "-")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function escapePdfText(value: unknown) {
  return normalizePdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function money(value: number) {
  return `INR ${Math.round(value).toLocaleString("en-IN")}`;
}

function date(value: Date) {
  return value.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function titleCase(value: string | undefined) {
  return normalizePdfText(value ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function approxTextWidth(text: string, size: number) {
  return normalizePdfText(text).length * size * 0.48;
}

function fitText(text: string, size: number, maxWidth: number) {
  const normalized = normalizePdfText(text);
  if (approxTextWidth(normalized, size) <= maxWidth) return normalized;
  let fitted = normalized;
  while (fitted.length > 3 && approxTextWidth(`${fitted}...`, size) > maxWidth) {
    fitted = fitted.slice(0, -1);
  }
  return `${fitted.trimEnd()}...`;
}

function wrapParagraph(text: string, size: number, maxWidth: number) {
  const words = normalizePdfText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (approxTextWidth(next, size) <= maxWidth || !current) current = next;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function wrapText(text: string, size: number, maxWidth: number) {
  return normalizePdfText(text)
    .split(/\r?\n/)
    .flatMap((line) => wrapParagraph(line, size, maxWidth));
}

class PdfBuilder {
  private pages: PdfPage[] = [{ ops: [] }];
  private y = PAGE_HEIGHT - MARGIN;

  private get page() {
    return this.pages[this.pages.length - 1];
  }

  private color(color: Color, mode: "fill" | "stroke") {
    this.page.ops.push(`${color[0]} ${color[1]} ${color[2]} ${mode === "fill" ? "rg" : "RG"}`);
  }

  ensure(space: number) {
    if (this.y - space >= MARGIN + 46) return;
    this.pages.push({ ops: [] });
    this.y = PAGE_HEIGHT - MARGIN;
  }

  moveDown(amount: number) {
    this.y -= amount;
  }

  text(x: number, text: string, opts: TextOptions = {}) {
    const size = opts.size ?? 10;
    const font = opts.font === "bold" ? "F2" : "F1";
    let tx = x;
    if (opts.align === "right") tx = x - approxTextWidth(text, size);
    if (opts.align === "center") tx = x - approxTextWidth(text, size) / 2;
    if (opts.color) this.color(opts.color, "fill");
    this.page.ops.push(`BT /${font} ${size} Tf ${tx.toFixed(2)} ${this.y.toFixed(2)} Td (${escapePdfText(text)}) Tj ET`);
    if (opts.color) this.color(CHARCOAL, "fill");
  }

  wrappedText(x: number, text: string, maxWidth: number, opts: TextOptions = {}) {
    const size = opts.size ?? 10;
    for (const line of wrapText(text, size, maxWidth)) {
      this.ensure(size + 5);
      this.text(x, line, opts);
      this.moveDown(size + 4);
    }
  }

  line(x1: number, y1: number, x2: number, y2: number, width = 0.7, color: Color = LINE) {
    this.color(color, "stroke");
    this.page.ops.push(`${width} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
    this.color(CHARCOAL, "stroke");
  }

  hline(y: number, x1 = MARGIN, x2 = PAGE_WIDTH - MARGIN, width = 0.7, color: Color = LINE) {
    this.line(x1, y, x2, y, width, color);
  }

  rect(x: number, y: number, w: number, h: number, fill?: Color, stroke?: Color, width = 0.7) {
    if (fill) this.color(fill, "fill");
    if (stroke) this.color(stroke, "stroke");
    this.page.ops.push(`${width} w ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${fill ? (stroke ? "B" : "f") : "S"}`);
    this.color(CHARCOAL, "fill");
    this.color(CHARCOAL, "stroke");
  }

  currentY() {
    return this.y;
  }

  setY(y: number) {
    this.y = y;
  }

  private addPageFooters() {
    this.pages.forEach((page, index) => {
      page.ops.push(`${LINE[0]} ${LINE[1]} ${LINE[2]} RG 0.5 w ${MARGIN} 42 m ${PAGE_WIDTH - MARGIN} 42 l S`);
      page.ops.push(`${CHARCOAL[0]} ${CHARCOAL[1]} ${CHARCOAL[2]} rg`);
      page.ops.push(`BT /F1 7 Tf ${MARGIN} 26 Td (${escapePdfText("Blessings The Men's Boutique - generated invoice")}) Tj ET`);
      page.ops.push(`BT /F1 7 Tf ${PAGE_WIDTH - MARGIN - 40} 26 Td (${escapePdfText(`Page ${index + 1}/${this.pages.length}`)}) Tj ET`);
    });
  }

  build() {
    this.addPageFooters();
    const objects: string[] = [];
    const add = (body: string) => {
      objects.push(body);
      return objects.length;
    };
    const catalogId = add("<< /Type /Catalog /Pages 2 0 R >>");
    const pagesId = add("");
    const fontRegularId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    const fontBoldId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
    const pageIds: number[] = [];
    for (const page of this.pages) {
      const stream = [`${CHARCOAL[0]} ${CHARCOAL[1]} ${CHARCOAL[2]} RG`, `${CHARCOAL[0]} ${CHARCOAL[1]} ${CHARCOAL[2]} rg`, ...page.ops].join("\n");
      const contentId = add(`<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`);
      const pageId = add(
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`,
      );
      pageIds.push(pageId);
    }
    objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
    const offsets: number[] = [0];
    let pdf = "%PDF-1.4\n";
    objects.forEach((body, index) => {
      offsets.push(Buffer.byteLength(pdf, "latin1"));
      pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
    });
    const xref = Buffer.byteLength(pdf, "latin1");
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objects.length; i += 1) {
      pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return Buffer.from(pdf, "latin1");
  }
}

function drawLabel(pdf: PdfBuilder, x: number, label: string, color: Color = MAROON) {
  pdf.text(x, label.toUpperCase(), { size: 7, font: "bold", color });
}

function drawInfoCard(pdf: PdfBuilder, x: number, y: number, width: number, height: number, title: string, lines: string[]) {
  pdf.rect(x, y - height, width, height, IVORY, LINE);
  pdf.setY(y - 18);
  drawLabel(pdf, x + 14, title);
  pdf.moveDown(15);
  for (const line of lines.filter(Boolean)) {
    pdf.wrappedText(x + 14, line, width - 28, { size: 9 });
  }
}

function drawStatusPill(pdf: PdfBuilder, label: string, x: number, y: number, width: number, fill: Color) {
  pdf.rect(x, y - 20, width, 20, fill, fill);
  pdf.setY(y - 14);
  pdf.text(x + width / 2, label.toUpperCase(), { size: 7, align: "center", font: "bold", color: IVORY });
}

function drawHeader(pdf: PdfBuilder, order: IOrder) {
  pdf.rect(0, PAGE_HEIGHT - 122, PAGE_WIDTH, 122, CHARCOAL);
  pdf.rect(0, PAGE_HEIGHT - 126, PAGE_WIDTH, 4, GOLD);
  pdf.setY(PAGE_HEIGHT - 50);
  pdf.text(MARGIN, "Blessings", { size: 27, font: "bold", color: IVORY });
  pdf.moveDown(18);
  pdf.text(MARGIN, "THE MEN'S BOUTIQUE", { size: 8, font: "bold", color: GOLD });
  pdf.moveDown(14);
  pdf.wrappedText(MARGIN, "Luxury menswear atelier - sherwanis, bandhgalas, wedding suits and custom occasionwear.", 250, {
    size: 7,
    color: IVORY,
  });
  pdf.setY(PAGE_HEIGHT - 50);
  pdf.text(PAGE_WIDTH - MARGIN, "TAX INVOICE", { size: 18, align: "right", font: "bold", color: IVORY });
  pdf.moveDown(20);
  pdf.text(PAGE_WIDTH - MARGIN, `INV-${order.orderNumber}`, { size: 11, align: "right", color: GOLD });
  pdf.moveDown(14);
  pdf.text(PAGE_WIDTH - MARGIN, `Order ${order.orderNumber}`, { size: 9, align: "right", color: IVORY });
  pdf.moveDown(13);
  pdf.text(PAGE_WIDTH - MARGIN, `Issued ${date(order.createdAt)}`, { size: 9, align: "right", color: IVORY });
}

function drawSummaryStrip(pdf: PdfBuilder, order: IOrder) {
  const y = PAGE_HEIGHT - 146;
  const col = CONTENT_WIDTH / 4;
  const items = [
    ["Invoice total", money(order.total)],
    ["Payment", order.paymentMethod === "cod" ? "Cash on delivery" : "Online"],
    ["Payment status", titleCase(order.paymentStatus)],
    ["Order status", titleCase(order.orderStatus)],
  ];
  pdf.rect(MARGIN, y - 44, CONTENT_WIDTH, 44, IVORY, LINE);
  items.forEach(([label, value], i) => {
    const x = MARGIN + col * i;
    if (i > 0) pdf.line(x, y - 8, x, y - 36, 0.5, LINE);
    pdf.setY(y - 17);
    drawLabel(pdf, x + 12, label, i === 0 ? GOLD : MAROON);
    pdf.moveDown(15);
    pdf.text(x + 12, value, { size: i === 0 ? 11 : 8, font: i === 0 ? "bold" : "regular" });
  });
  pdf.setY(y - 62);
}

function drawAddressAndPayment(pdf: PdfBuilder, order: IOrder) {
  const address = order.shippingAddress;
  const y = pdf.currentY();
  const cardWidth = (CONTENT_WIDTH - 14) / 2;
  drawInfoCard(pdf, MARGIN, y, cardWidth, 92, "Bill / ship to", [
    address.name,
    address.line1,
    `${address.city}, ${address.state} ${address.pincode}`,
    `Phone: ${address.phone}`,
  ]);
  drawInfoCard(pdf, MARGIN + cardWidth + 14, y, cardWidth, 92, "Order details", [
    `Order number: ${order.orderNumber}`,
    `Invoice number: INV-${order.orderNumber}`,
    `Order date: ${date(order.createdAt)}`,
    `Payment mode: ${order.paymentMethod === "cod" ? "Cash on delivery" : "Razorpay / online"}`,
    order.trackingNumber ? `Tracking number: ${order.trackingNumber}` : "Tracking number: Not assigned",
  ]);
  pdf.setY(y - 112);
}

function drawItems(pdf: PdfBuilder, order: IOrder) {
  pdf.ensure(90);
  drawLabel(pdf, MARGIN, "Items");
  pdf.moveDown(13);
  const headerY = pdf.currentY();
  pdf.rect(MARGIN, headerY - 20, CONTENT_WIDTH, 20, MAROON, MAROON);
  pdf.setY(headerY - 14);
  pdf.text(MARGIN + 10, "#", { size: 7, font: "bold", color: IVORY });
  pdf.text(MARGIN + 34, "Description", { size: 7, font: "bold", color: IVORY });
  pdf.text(MARGIN + 305, "Qty", { size: 7, font: "bold", color: IVORY });
  pdf.text(MARGIN + 372, "Unit rate", { size: 7, align: "right", font: "bold", color: IVORY });
  pdf.text(MARGIN + 442, "Line total", { size: 7, align: "right", font: "bold", color: IVORY });
  pdf.text(PAGE_WIDTH - MARGIN - 10, "Status", { size: 7, align: "right", font: "bold", color: IVORY });
  pdf.moveDown(18);
  order.items.forEach((item, index) => {
    pdf.ensure(34);
    const rowTop = pdf.currentY() + 5;
    const rowHeight = 28;
    if (index % 2 === 0) pdf.rect(MARGIN, rowTop - rowHeight, CONTENT_WIDTH, rowHeight, [0.99, 0.98, 0.95]);
    pdf.setY(rowTop - 12);
    pdf.text(MARGIN + 10, String(index + 1), { size: 9, font: "bold" });
    pdf.text(MARGIN + 34, fitText(item.name, 8, 230), { size: 8, font: "bold" });
    pdf.moveDown(10);
    pdf.text(MARGIN + 34, fitText([`Size: ${item.size}`, item.color ? `Color: ${item.color}` : null].filter(Boolean).join("   "), 6, 230), {
      size: 6,
      color: MAROON,
    });
    pdf.setY(rowTop - 12);
    pdf.text(MARGIN + 305, String(item.quantity), { size: 8 });
    pdf.text(MARGIN + 372, money(item.unitPrice), { size: 8, align: "right" });
    pdf.text(MARGIN + 442, money(item.unitPrice * item.quantity), { size: 8, align: "right", font: "bold" });
    pdf.text(PAGE_WIDTH - MARGIN - 10, titleCase(order.orderStatus), { size: 7, align: "right" });
    pdf.setY(rowTop - rowHeight);
    pdf.hline(pdf.currentY() + 4, MARGIN, PAGE_WIDTH - MARGIN, 0.45, LINE);
    pdf.moveDown(4);
  });
}

function drawTotalsAndReceipt(pdf: PdfBuilder, order: IOrder) {
  pdf.ensure(78);
  const y = pdf.currentY();
  const notesWidth = 270;
  const totalsX = PAGE_WIDTH - MARGIN - 220;
  pdf.rect(MARGIN, y - 72, notesWidth, 72, IVORY, LINE);
  pdf.setY(y - 15);
  drawLabel(pdf, MARGIN + 14, "Receipt notes");
  pdf.moveDown(12);
  const notes = [
    "This invoice is generated from the final Blessings order record.",
    order.couponCode ? `Coupon applied: ${order.couponCode}${order.couponTitle ? ` (${order.couponTitle})` : ""}.` : "No coupon applied.",
  ];
  notes.forEach((note) => pdf.wrappedText(MARGIN + 14, note, notesWidth - 28, { size: 7 }));

  pdf.rect(totalsX, y - 72, 220, 72, [0.99, 0.98, 0.95], LINE);
  const row = (label: string, value: string, offset: number, bold = false, color: Color = CHARCOAL) => {
    pdf.setY(y - offset);
    pdf.text(totalsX + 14, label, { size: bold ? 10 : 8, font: bold ? "bold" : "regular", color });
    pdf.text(PAGE_WIDTH - MARGIN - 14, value, { size: bold ? 11 : 8, align: "right", font: bold ? "bold" : "regular", color });
  };
  row("Subtotal", money(order.subtotal), 17);
  row("Discount", order.discount > 0 ? `-${money(order.discount)}` : money(0), 31, false, order.discount > 0 ? MAROON : CHARCOAL);
  row(order.paymentMethod === "cod" ? "COD fee" : "Shipping", money(order.shippingFee), 45);
  pdf.hline(y - 54, totalsX + 14, PAGE_WIDTH - MARGIN - 14, 0.6, LINE);
  row("Grand total", money(order.total), 67, true, MAROON);
  pdf.setY(y - 82);
}

function drawPaymentAndSupport(pdf: PdfBuilder, order: IOrder) {
  pdf.ensure(38);
  const y = pdf.currentY();
  const paid = order.paymentStatus === "paid" || (order.paymentMethod === "cod" && order.orderStatus === "delivered");
  drawStatusPill(pdf, paid ? "Payment received" : titleCase(order.paymentStatus), MARGIN, y, 150, paid ? [0.13, 0.39, 0.25] : GOLD);
  drawStatusPill(pdf, titleCase(order.orderStatus), MARGIN + 160, y, 150, MAROON);
  pdf.setY(y - 34);
  pdf.text(MARGIN, "Thank you for choosing Blessings. Quote the order number for any order support.", { size: 8, font: "bold", color: MAROON });
  pdf.text(PAGE_WIDTH - MARGIN, "Authorized invoice - digitally generated", { size: 7, align: "right" });
}

export function invoiceFilename(orderNumber: string) {
  return `${normalizePdfText(orderNumber).replace(/[^A-Za-z0-9-]/g, "-")}-invoice.pdf`;
}

export function renderInvoicePdf(order: IOrder) {
  const pdf = new PdfBuilder();
  drawHeader(pdf, order);
  drawSummaryStrip(pdf, order);
  drawAddressAndPayment(pdf, order);
  drawItems(pdf, order);
  pdf.moveDown(6);
  drawTotalsAndReceipt(pdf, order);
  drawPaymentAndSupport(pdf, order);
  return pdf.build();
}

export async function getInvoicePdf(orderId: string, userId: string, isAdmin = false) {
  const order = await Order.findOne(isAdmin ? { _id: orderId } : { _id: orderId, userId });
  if (!order) throw new AppError(404, "Order not found");
  return {
    order,
    filename: invoiceFilename(order.orderNumber),
    pdf: renderInvoicePdf(order),
  };
}
