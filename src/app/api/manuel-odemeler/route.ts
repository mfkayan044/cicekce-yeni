import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings-helper";
import { addAuditLog } from "@/lib/audit-logger";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");
const initialTsPath = path.join(process.cwd(), "src", "lib", "initial-db.ts");

const defaultLinks = [
  {
    id: "m1",
    date: new Date().toLocaleString("tr-TR"),
    desc: "Özel Buket Siparişi (33 Kırmızı Gül)",
    amount: "2.500 ₺",
    payer: "Halil SERTKAYA",
    phone: "905321112233",
    status: "Ödendi",
    linkUrl: "/odeme?manual=m1"
  }
];

function readDb() {
  try {
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }
  } catch (e) {}
  return {};
}

function writeDbAndTs(linksData: any[]) {
  try {
    const db = readDb();
    db.manualPaymentLinks = linksData;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
    const tsCode = `export const initialDbData: any = ${JSON.stringify(db, null, 2)};\n`;
    fs.writeFileSync(initialTsPath, tsCode, "utf-8");
  } catch (e) {}
}

export async function GET() {
  try {
    const local = readDb().manualPaymentLinks || defaultLinks;
    const links = await getSetting("manual_payment_links", local);
    return NextResponse.json(Array.isArray(links) ? links : defaultLinks);
  } catch (e) {
    return NextResponse.json(defaultLinks);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const local = readDb().manualPaymentLinks || defaultLinks;
    const existing = await getSetting("manual_payment_links", local);

    const newLink = {
      id: Date.now().toString(),
      date: new Date().toLocaleString("tr-TR"),
      desc: body.desc || "Özel Çiçek Siparişi",
      amount: body.amount ? (body.amount.includes("₺") ? body.amount : `${body.amount} ₺`) : "1.000 ₺",
      payer: body.payer || "Müşteri",
      phone: body.phone ? body.phone.replace(/[^0-9]/g, "") : "",
      status: "Bekliyor",
      linkUrl: `/odeme?manual=${Date.now()}`
    };

    const updated = [newLink, ...(Array.isArray(existing) ? existing : [])];
    await setSetting("manual_payment_links", updated);
    writeDbAndTs(updated);
    await addAuditLog(`Yeni Manuel Ödeme Linki Oluşturuldu: ${newLink.desc} (${newLink.amount}) - Müşteri: ${newLink.payer}`);

    return NextResponse.json({ success: true, link: newLink, links: updated }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to save link" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;
    const local = readDb().manualPaymentLinks || defaultLinks;
    const existing = await getSetting("manual_payment_links", local);

    const updated = (Array.isArray(existing) ? existing : []).map((l: any) =>
      String(l.id) === String(id) ? { ...l, status } : l
    );

    await setSetting("manual_payment_links", updated);
    writeDbAndTs(updated);
    await addAuditLog(`Manuel Ödeme Linki Durumu Güncellendi: #${id} -> ${status}`);

    return NextResponse.json({ success: true, links: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update link" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const local = readDb().manualPaymentLinks || defaultLinks;
    const existing = await getSetting("manual_payment_links", local);

    const updated = (Array.isArray(existing) ? existing : []).filter((l: any) => String(l.id) !== String(id));
    await setSetting("manual_payment_links", updated);
    writeDbAndTs(updated);
    await addAuditLog(`Manuel Ödeme Linki Silindi: #${id}`);

    return NextResponse.json({ success: true, links: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to delete link" }, { status: 500 });
  }
}
