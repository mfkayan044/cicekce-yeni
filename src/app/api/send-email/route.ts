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
    const { to, subject, html, isTest } = await request.json();

    // 1. Fetch saved SMTP settings from Supabase or db.json
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
        error: "SMTP ayarlarınız (/yonetim/eposta) henüz tanımlanmadı. Lütfen Host, Kullanıcı Adı ve Şifrenizi girin."
      }, { status: 400 });
    }

    if (mailEnabled === false) {
      return NextResponse.json({
        success: false,
        error: "E-posta gönderimi sistem ayarlarından kapatılmış (mail_enabled = false)."
      }, { status: 400 });
    }

    // 2. Configure Nodemailer Transporter
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

    // 3. Send real email via SMTP
    const info = await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      mode: "real_smtp",
      message: `E-posta başarıyla (${info.accepted.join(", ")}) adresine gönderildi!`
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || "SMTP e-posta gönderimi sırasında hata oluştu."
    }, { status: 500 });
  }
}
