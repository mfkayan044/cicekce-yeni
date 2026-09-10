import { NextResponse } from "next/server";
import { getAuditLogs, addAuditLog } from "@/lib/audit-logger";
import { setSetting } from "@/lib/settings-helper";

export async function GET() {
  try {
    const logs = await getAuditLogs();
    return NextResponse.json(logs);
  } catch (e) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "clear") {
      await setSetting("audit_logs", []);
      return NextResponse.json({ success: true, logs: [] });
    }

    const newLog = await addAuditLog(body.action || "Bilinmeyen İşlem", body.user || "Admin", body.ip || "127.0.0.1", body.status || "Başarılı");
    return NextResponse.json({ success: true, log: newLog });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Log error" }, { status: 500 });
  }
}
