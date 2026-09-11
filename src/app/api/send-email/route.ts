import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");

function getEmailSettings() {
  try {
    if (fs.existsSync(dbPath)) {
      const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
      if (db.emailSettings) return db.emailSettings;
    }
  } catch (e) {}
  return {};
}

export async function POST(request: Request) {
  try {
    const { to, subject, html, type = "transactional" } = await request.json();

    if (!to) {
      return NextResponse.json({ success: false, error: "Alıcı e-posta adresi (to) gereklidir." }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const brevoApiKey = process.env.BREVO_API_KEY;

    // 1. Try Resend API (Transactional)
    if (type === "transactional" && resendApiKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: `Çiçekçe <${process.env.SENDER_EMAIL || "siparis@cicekce.com"}>`,
            to: [to],
            subject: subject || "Çiçekçe Sipariş Bilgilendirmesi",
            html: html || "<p>Merhaba</p>",
          })
        });

        if (res.ok) {
          const data = await res.json();
          return NextResponse.json({
            success: true,
            provider: "resend_api",
            id: data.id,
            message: `E-posta Resend API ile (${to}) adresine ulaştırıldı.`
          });
        }
      } catch (e) {}
    }

    // 2. Try Brevo API (Marketing / Bulk)
    if ((type === "marketing" || !resendApiKey) && brevoApiKey) {
      try {
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": brevoApiKey,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            sender: { name: "Çiçekçe", email: process.env.SENDER_EMAIL || "siparis@cicekce.com" },
            to: [{ email: to }],
            subject: subject || "Çiçekçe Bilgilendirme",
            htmlContent: html || "<p>Merhaba</p>",
          })
        });

        if (res.ok) {
          const data = await res.json();
          return NextResponse.json({
            success: true,
            provider: "brevo_api",
            messageId: data.messageId,
            message: `E-posta Brevo API ile (${to}) adresine ulaştırıldı.`
          });
        }
      } catch (e) {}
    }

    // 3. Fallback to Nodemailer SMTP
    let settings: any = {};
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("id", "email_settings")
        .single();
      if (data && data.value) settings = data.value;
      else settings = getEmailSettings();
    } catch (e) {
      settings = getEmailSettings();
    }

    const {
      mailEnabled,
      mailHost,
      mailPort,
      mailEncryption,
      mailUsername,
      mailPassword,
      mailFromAddress,
      mailFromName
    } = settings;

    if (!mailHost || !mailUsername || !mailPassword) {
      return NextResponse.json({
        success: false,
        error: "E-posta API anahtarlarınız (RESEND_API_KEY / BREVO_API_KEY) veya SMTP ayarlarınız henüz tanımlanmadı."
      }, { status: 400 });
    }

    if (mailEnabled === false) {
      return NextResponse.json({
        success: false,
        error: "E-posta gönderimi sistem ayarlarından kapatılmış."
      }, { status: 400 });
    }

    const portNum = parseInt(mailPort || "587", 10);
    const isSecure = mailEncryption === "ssl" || portNum === 465;

    const transporter = nodemailer.createTransport({
      host: mailHost,
      port: portNum,
      secure: isSecure,
      auth: {
        user: mailUsername,
        pass: mailPassword,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const fromHeader = `"${mailFromName || "Çiçekçe Sipariş Servisi"}" <${mailFromAddress || mailUsername}>`;

    const mailOptions = {
      from: fromHeader,
      to: to || mailUsername,
      subject: subject || "Çiçekçe Otomatik Bilgilendirme",
      html: html || "<p>Merhaba, bu bir test e-postasıdır.</p>"
    };

    const info = await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      provider: "real_smtp",
      message: `E-posta başarıyla SMTP (${info.accepted.join(", ")}) adresine gönderildi!`
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || "E-posta gönderimi sırasında hata oluştu."
    }, { status: 500 });
  }
}
