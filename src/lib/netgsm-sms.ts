import { getSetting } from "@/lib/settings-helper";

export interface SendSmsParams {
  phone: string;
  message: string;
}

export async function sendNetgsmSms({ phone, message }: SendSmsParams): Promise<boolean> {
  try {
    const apis = await getSetting("api_settings", {});
    const usercode = apis.smsUser || process.env.NETGSM_USER;
    const password = apis.smsPassword || process.env.NETGSM_PASSWORD;
    const msgheader = apis.smsHeader || process.env.NETGSM_HEADER || "CICEKCE";

    if (!usercode || !password) {
      return false;
    }

    let cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("90")) cleanPhone = cleanPhone.substring(2);
    if (cleanPhone.startsWith("0")) cleanPhone = cleanPhone.substring(1);

    if (cleanPhone.length !== 10) {
      return false;
    }

    const url = new URL("https://api.netgsm.com.tr/sms/send/get");
    url.searchParams.append("usercode", usercode);
    url.searchParams.append("password", password);
    url.searchParams.append("gsmno", cleanPhone);
    url.searchParams.append("message", message);
    url.searchParams.append("msgheader", msgheader);

    const res = await fetch(url.toString(), { method: "GET" });
    const text = await res.text();
    return text.startsWith("00");
  } catch (err) {
    console.error("NetGSM SMS sending error:", err);
    return false;
  }
}
