import { createRequire } from "module";
import type { Response } from "express";
import type { Itinerary, InvoiceItem } from "./types.js";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PDFDocument = require("pdfkit") as any;

const TEAL        = "#053E50";
const BLUE        = "#37729A";
const GOLD        = "#937C66";
const DARK        = "#1A2E35";
const GRAY        = "#8A7F7D";
const LIGHT_GRAY  = "#B0A9A6";
const LINE_COLOR  = "#E8E0DB";
const FAINT_LINE  = "#F7F3F1";
const GREEN       = "#059669";

function fmtDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long", day: "numeric", year: "numeric",
  }).format(new Date(dateStr + (dateStr.length === 10 ? "T12:00:00" : "")));
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function subDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function fmtMoney(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function drawHeader(doc: any, itinerary: Itinerary, type: "quote" | "invoice"): number {
  const isInvoice = type === "invoice";
  const title = isInvoice ? "Pure Kauai Experience\nInvoice" : "Experience Quote";

  doc.font("Helvetica-Bold").fontSize(13).fillColor(TEAL).text("PURE KAUAI", 50, 50);
  doc.font("Helvetica").fontSize(8.5).fillColor(GRAY);
  doc.text("North Shore, Kauai, Hawaii 96714", 50, 67);
  const hostEmail = itinerary.hostEmail ?? "concierge@purekauai.com";
  const hostPhone = itinerary.hostPhone ?? "+1 808 826 0000";
  doc.text(`${hostEmail}  ·  ${hostPhone}`, 50, 79);
  if (itinerary.hostName) {
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(TEAL);
    doc.text(`${itinerary.hostName}, Pure Kauai Concierge`, 50, 91);
  }

  const rW = 160;
  const rX = 545 - rW;
  doc.font("Helvetica").fontSize(16).fillColor(TEAL);
  doc.text(title, rX, 48, { align: "right", width: rW, lineGap: 2 });

  let metaY = itinerary.hostName ? 104 : 92;
  if (isInvoice && itinerary.invoiceNumber) {
    doc.font("Helvetica").fontSize(8).fillColor(GRAY);
    doc.text(`Invoice #: ${itinerary.invoiceNumber}`, rX, metaY, { align: "right", width: rW });
    metaY += 12;
    if (itinerary.approvedAt) {
      doc.text(`Date: ${fmtDate(itinerary.approvedAt)}`, rX, metaY, { align: "right", width: rW });
      metaY += 12;
    }
    doc.font("Helvetica-Bold").fontSize(8).fillColor(GREEN);
    doc.text("✓  STATUS: CONFIRMED", rX, metaY, { align: "right", width: rW });
  } else {
    doc.font("Helvetica").fontSize(8).fillColor(GRAY);
    doc.text(`Ref: ${itinerary.id.slice(0, 8).toUpperCase()}`, rX, metaY, { align: "right", width: rW });
    metaY += 12;
    doc.text(`Date: ${fmtDate(new Date().toISOString().split("T")[0])}`, rX, metaY, { align: "right", width: rW });
  }

  const divY = 118;
  doc.moveTo(50, divY).lineTo(545, divY).strokeColor(TEAL).lineWidth(2).stroke();

  return divY + 14;
}

function drawGuestBlock(doc: any, itinerary: Itinerary, y: number, type: "quote" | "invoice"): number {
  const isInvoice = type === "invoice";
  const totalGuests = itinerary.adults + itinerary.children;
  const guestStr = `${totalGuests} guest${totalGuests !== 1 ? "s" : ""}${
    itinerary.adults > 0
      ? ` (${itinerary.adults} adult${itinerary.adults !== 1 ? "s" : ""}${
          itinerary.children > 0 ? `, ${itinerary.children} child${itinerary.children !== 1 ? "ren" : ""}` : ""
        })`
      : ""
  }`;

  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(GRAY).text("PREPARED FOR", 50, y);
  doc.font("Helvetica-Bold").fontSize(13).fillColor(TEAL).text(itinerary.guestName, 50, y + 11);

  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(GRAY).text("TRAVEL DATES", 280, y);
  doc.font("Helvetica").fontSize(9).fillColor(TEAL);
  doc.text(`${fmtDate(itinerary.checkIn)} — ${fmtDate(itinerary.checkOut)}`, 280, y + 11);
  doc.font("Helvetica").fontSize(8.5).fillColor(GRAY).text(guestStr, 280, y + 24);

  let newY = y + 40;

  if (isInvoice && itinerary.approvedAt) {
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(GRAY).text("DEPOSIT DUE", 50, newY);
    doc.font("Helvetica").fontSize(9).fillColor(TEAL).text(fmtDate(addDays(itinerary.approvedAt, 7)), 50, newY + 11);

    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(GRAY).text("BALANCE DUE", 280, newY);
    doc.font("Helvetica").fontSize(9).fillColor(TEAL).text(fmtDate(subDays(itinerary.checkIn, 30)), 280, newY + 11);
    newY += 28;
  }

  newY += 14;
  doc.moveTo(50, newY).lineTo(545, newY).strokeColor(LINE_COLOR).lineWidth(0.5).stroke();

  return newY + 14;
}

function drawLineItems(doc: any, itinerary: Itinerary, y: number): number {
  const grouped: Record<string, InvoiceItem[]> = {};
  for (const item of itinerary.invoice) {
    const cat = item.category || "Services";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }

  for (const [cat, items] of Object.entries(grouped)) {
    if (y > 670) { doc.addPage(); y = 50; }

    doc.font("Helvetica-Bold").fontSize(8).fillColor(BLUE).text(cat.toUpperCase(), 50, y);
    doc.moveTo(50, y + 13).lineTo(545, y + 13).strokeColor("#F0ECEA").lineWidth(0.5).stroke();
    y += 22;

    for (const item of items) {
      if (y > 680) { doc.addPage(); y = 50; }

      const price = item.pricePerUnit === 0 ? "Complimentary" : fmtMoney(item.totalPrice);
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor(DARK).text(item.name, 50, y, { width: 340 });
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor(DARK).text(price, 395, y, { align: "right", width: 150 });
      y += 15;

      if (item.description) {
        const descLines = doc.heightOfString(item.description, { width: 340, fontSize: 8 });
        doc.font("Helvetica").fontSize(8).fillColor(GRAY).text(item.description, 50, y, { width: 340 });
        y += Math.min(descLines, 28);
      }

      let unitText = "";
      if (item.pricePerUnit > 0 && item.unit === "flat rate") {
        unitText = "Flat rate";
      } else if (item.pricePerUnit > 0) {
        unitText = `${fmtMoney(item.pricePerUnit)} × ${item.quantity} ${item.unit}`;
      }
      if (unitText) {
        doc.font("Helvetica").fontSize(8).fillColor(LIGHT_GRAY).text(unitText, 395, y - Math.min(doc.heightOfString(item.description ?? "", { width: 340, fontSize: 8 }), 28), { align: "right", width: 150 });
      }

      y += 10;
      doc.moveTo(50, y).lineTo(545, y).strokeColor(FAINT_LINE).lineWidth(0.5).stroke();
      y += 10;
    }
    y += 6;
  }

  return y;
}

function drawTotals(doc: any, itinerary: Itinerary, y: number, type: "quote" | "invoice"): number {
  const isInvoice = type === "invoice";
  const subtotal = itinerary.invoice.reduce((s, i) => s + i.totalPrice, 0);
  const deposit  = subtotal * 0.5;

  if (y > 630) { doc.addPage(); y = 50; }

  const rightX = 350;
  const valW   = 195;

  doc.moveTo(rightX, y).lineTo(545, y).strokeColor(LINE_COLOR).lineWidth(0.5).stroke();
  y += 12;

  const totalLabel = isInvoice ? "Invoice Total" : "Subtotal";
  doc.font("Helvetica").fontSize(9).fillColor(GRAY).text(totalLabel, rightX, y, { width: 120 });
  doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK).text(fmtMoney(subtotal), rightX, y, { align: "right", width: valW });
  y += 22;

  if (isInvoice && itinerary.approvedAt) {
    const depositDue = fmtDate(addDays(itinerary.approvedAt, 7));
    const balanceDue = fmtDate(subDays(itinerary.checkIn, 30));

    doc.font("Helvetica-Bold").fontSize(11).fillColor(TEAL).text("Deposit Due", rightX, y, { width: 120 });
    doc.font("Helvetica-Bold").fontSize(13).fillColor(TEAL).text(fmtMoney(deposit), rightX, y, { align: "right", width: valW });
    y += 17;
    doc.font("Helvetica").fontSize(8).fillColor(GRAY).text(`Due by ${depositDue}`, rightX, y, { width: 200 });
    y += 22;

    doc.font("Helvetica").fontSize(9).fillColor(GRAY).text("Balance Due", rightX, y, { width: 120 });
    doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK).text(fmtMoney(deposit), rightX, y, { align: "right", width: valW });
    y += 15;
    doc.font("Helvetica").fontSize(8).fillColor(LIGHT_GRAY).text(`Due by ${balanceDue} (30 days prior to arrival)`, rightX, y, { width: 200 });
    y += 18;
  } else {
    doc.font("Helvetica-Bold").fontSize(11).fillColor(TEAL).text("Deposit Due Now", rightX, y, { width: 145 });
    doc.font("Helvetica-Bold").fontSize(13).fillColor(TEAL).text(fmtMoney(deposit), rightX, y, { align: "right", width: valW });
    y += 17;
    doc.font("Helvetica").fontSize(8).fillColor(GRAY).text("50% to confirm reservation", rightX, y, { width: 200 });
    y += 22;

    doc.font("Helvetica").fontSize(9).fillColor(GRAY).text("Balance Due", rightX, y, { width: 120 });
    doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK).text(fmtMoney(deposit), rightX, y, { align: "right", width: valW });
    y += 15;
    doc.font("Helvetica").fontSize(8).fillColor(LIGHT_GRAY).text("30 days prior to arrival", rightX, y, { width: 200 });
    y += 18;
  }

  return y;
}

function drawFinePrint(doc: any, itinerary: Itinerary, y: number, type: "quote" | "invoice"): number {
  if (y > 680) { doc.addPage(); y = 50; }

  y += 18;
  doc.moveTo(50, y).lineTo(545, y).strokeColor(LINE_COLOR).lineWidth(0.5).stroke();
  y += 12;

  const text = type === "quote"
    ? `This proposal is prepared exclusively for ${itinerary.guestName} and is valid for 14 days from the date above. All experiences are subject to availability and confirmed upon receipt of deposit. Rates are quoted in USD. Taxes, gratuities, and transportation not included unless stated.`
    : `This invoice is issued to ${itinerary.guestName} upon confirmation of their Pure Kauai experience. Payment of the deposit confirms acceptance of all terms. All experiences are subject to availability. Rates are quoted in USD. Taxes, gratuities, and transportation not included unless stated.`;

  doc.font("Helvetica").fontSize(7.5).fillColor(LIGHT_GRAY).text(text, 50, y, { width: 495 });
  y += doc.heightOfString(text, { width: 495, fontSize: 7.5 }) + 10;

  return y;
}

function drawSignatureLines(doc: any, y: number): void {
  if (y > 670) { doc.addPage(); y = 50; }

  y += 16;
  doc.moveTo(50, y).lineTo(545, y).strokeColor(LINE_COLOR).lineWidth(0.5).stroke();
  y += 22;

  doc.font("Helvetica").fontSize(9).fillColor(GRAY).text("Guest Signature:", 50, y);
  doc.moveTo(50, y + 24).lineTo(240, y + 24).strokeColor(LIGHT_GRAY).lineWidth(0.5).stroke();
  doc.font("Helvetica").fontSize(9).fillColor(GRAY).text("Date:", 280, y);
  doc.moveTo(280, y + 24).lineTo(430, y + 24).strokeColor(LIGHT_GRAY).lineWidth(0.5).stroke();
  y += 44;

  doc.font("Helvetica").fontSize(9).fillColor(GRAY).text("Authorized by:", 50, y);
  doc.moveTo(50, y + 24).lineTo(240, y + 24).strokeColor(LIGHT_GRAY).lineWidth(0.5).stroke();
  doc.font("Helvetica").fontSize(9).fillColor(GRAY).text("Date:", 280, y);
  doc.moveTo(280, y + 24).lineTo(430, y + 24).strokeColor(LIGHT_GRAY).lineWidth(0.5).stroke();
}

export function streamQuotePDF(itinerary: Itinerary, res: Response): void {
  const doc = new PDFDocument({ margin: 50, size: "LETTER" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="pure-kauai-quote-${itinerary.slug}.pdf"`);
  doc.pipe(res);

  let y = drawHeader(doc, itinerary, "quote");
  y = drawGuestBlock(doc, itinerary, y, "quote");
  if (itinerary.invoice.length > 0) {
    y = drawLineItems(doc, itinerary, y);
    y = drawTotals(doc, itinerary, y, "quote");
  }
  drawFinePrint(doc, itinerary, y, "quote");

  doc.end();
}

export function streamInvoicePDF(itinerary: Itinerary, res: Response): void {
  const doc = new PDFDocument({ margin: 50, size: "LETTER" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="pure-kauai-invoice-${itinerary.slug}.pdf"`);
  doc.pipe(res);

  let y = drawHeader(doc, itinerary, "invoice");
  y = drawGuestBlock(doc, itinerary, y, "invoice");
  if (itinerary.invoice.length > 0) {
    y = drawLineItems(doc, itinerary, y);
    y = drawTotals(doc, itinerary, y, "invoice");
  }
  const afterFinePrint = drawFinePrint(doc, itinerary, y, "invoice");
  drawSignatureLines(doc, afterFinePrint);

  doc.end();
}
