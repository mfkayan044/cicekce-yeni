import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings-helper";
import { addAuditLog } from "@/lib/audit-logger";

const defaultLoyaltySettings = {
  enabled: true,
  earnRate: 5, // %5 earn
  maxRedeemRate: 25, // %25 max redeem cap per order
  pointRatio: 1, // 1 Puan = 1 TL
  minOrderForPoints: 200, // Minimum order to earn/use points
};

export async function GET() {
  try {
    const settings = await getSetting("loyalty_settings", defaultLoyaltySettings);
    return NextResponse.json(settings || defaultLoyaltySettings);
  } catch (e) {
    return NextResponse.json(defaultLoyaltySettings);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await setSetting("loyalty_settings", body);
    await addAuditLog("ÇiçekPuan Sadakat Programı Ayarları Güncellendi");
    return NextResponse.json({ success: true, settings: body });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Loyalty settings error" }, { status: 500 });
  }
}
