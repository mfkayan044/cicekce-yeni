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
    const senderEmail = process.env.SENDER_EMAIL || "siparis@cicekce.com";

    // 1. Try Resend API (Transactional)
    if (type === "transactional") {
      if (!resendApiKey) {
        return NextResponse.json({
          success: false,
          error: "RESEND_API_KEY Vercel veya .env dosyasında henüz tanımlı değil."
        }, { status: 400 });
      }

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: `Çiçekçe <${senderEmail}>`,
            to: [to],
            subject: subject || "Çiçekçe Sipariş Bilgilendirmesi",
            html: html || "<p>Merhaba</p>",
          })
        });

        const data = await res.json();

        if (res.ok) {
          return NextResponse.json({
            success: true,
            provider: "resend_api",
            id: data.id,
            message: `E-posta Resend API ile (${to}) adresine ulaştırıldı.`
          });
        } else {
          return NextResponse.json({
            success: false,
            error: `Resend API Hatası: ${data.message || data.error || "Gönderilemedi"}`
          }, { status: 400 });
        }
      } catch (e: any) {
        return NextResponse.json({ success: false, error: `Resend Bağlantı Hatası: ${e?.message}` }, { status: 500 });
      }
    }

    // 2. Try Brevo API (Marketing / Bulk)
    if (type === "marketing") {
      if (!brevoApiKey) {
        return NextResponse.json({
          success: false,
          error: "BREVO_API_KEY Vercel veya .env dosyasında henüz tanımlı değil. Vercel paneline ekledikten sonra bir kez Deploy/Redeploy yapmanız gerekir."
        }, { status: 400 });
      }

      try {
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": brevoApiKey,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            sender: { name: "Çiçekçe", email: senderEmail },
            to: [{ email: to }],
            subject: subject || "Çiçekçe Bilgilendirme",
            htmlContent: html || "<p>Merhaba</p>",
          })
        });

        const data = await res.json();

        if (res.ok) {
          return NextResponse.json({
            success: true,
            provider: "brevo_api",
            messageId: data.messageId,
            message: `E-posta Brevo API ile (${to}) adresine ulaştırıldı.`
          });
        } else {
          return NextResponse.json({
            success: false,
            error: `Brevo API Hatası: ${data.message || JSON.stringify(data)} (Brevo panelinizde '${senderEmail}' adresinin Onaylı Gönderici olarak ekli olduğundan emin olun).`
          }, { status: 400 });
        }
      } catch (e: any) {
        return NextResponse.json({ success: false, error: `Brevo Bağlantı Hatası: ${e?.message}` }, { status: 500 });
      }
    }

    // 3. Try Nodemailer SMTP Direct
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
        error: "Yedek SMTP sunucu ayarlarınız (Host, Kullanıcı Adı, Şifre) /yonetim/eposta sayfasından henüz girilmemiş."
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
