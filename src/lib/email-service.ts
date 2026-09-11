/**
 * Çiçekçe E-Posta Entegrasyon Servisi (Resend + Brevo + SMTP Fallback)
 * 
 * 1. Resend API: Transactional Mailler (Sipariş Onayı, Görsel Onayı, Durum Güncellemeleri, Hoş Geldin)
 * 2. Brevo API: Marketing & Pazarlama Mailleri (Yarım Kalan Sepet, Özel Gün Hatırlatıcıları, Bülten)
 * 3. Domain URL: https://www.cicekce.com
 */

export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.cicekce.com";
export const BRAND_NAME = "Çiçekçe";
export const SENDER_EMAIL = process.env.SENDER_EMAIL || "siparis@cicekce.com";

// --- BEAUTIFUL HTML EMAIL TEMPLATES ---

export function getOrderReceivedHtml(order: any): string {
  const itemsHtml = (order.items || [])
    .map((item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9;">
          <div style="font-weight: bold; color: #1e293b; font-size: 14px;">🌸 ${item.title || item.name || "Çiçek Buketi"}</div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: center; font-weight: bold; color: #475569;">
          ${item.quantity || 1} Adet
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: bold; color: #0f172a;">
          ${item.price || "—"}
        </td>
      </tr>
    `).join("");

  const trackingLink = `${BASE_URL}/siparis-takip?orderId=${order.id}`;

  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head><meta charset="utf-8"><title>Siparişiniz Alındı</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf6f0; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background-color: #2b2623; padding: 30px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">🌸 Çiçekçe</h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #e2e8f0; font-weight: 500;">Siparişiniz Başarıyla Alındı!</p>
        </div>

        <!-- Body -->
        <div style="padding: 30px;">
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 16px; text-align: center; margin-bottom: 24px;">
            <div style="font-size: 13px; color: #166534; font-weight: bold; text-transform: uppercase;">SİPARİŞ KODUNUZ</div>
            <div style="font-size: 24px; font-weight: 900; color: #14532d; margin-top: 4px;">#${order.id}</div>
          </div>

          <p style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
            Sayın <strong>${order.customerName || "Müşterimiz"}</strong>,<br>
            Siparişiniz atölyemize ulaştı! Çiçeğiniz taze canlı çiçeklerle özenle hazırlanacak, çıkış öncesinde <strong>canlı fotoğraf onayı</strong> tarafınıza iletilecektir.
          </p>

          <!-- Order Summary Table -->
          <div style="border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; margin-bottom: 24px;">
            <div style="background-color: #f8fafc; padding: 12px 16px; font-weight: 800; font-size: 13px; color: #475569; border-bottom: 1px solid #e2e8f0;">
              SİPARİŞ DETAYLARI
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              ${itemsHtml}
            </table>
            <div style="background-color: #faf6f0; padding: 14px 16px; text-align: right; font-weight: 900; font-size: 16px; color: #2b2623; border-top: 1px solid #e2e8f0;">
              Toplam Ödenen: ${order.totalAmount || order.totalPrice || "0 ₺"}
            </div>
          </div>

          <!-- Recipient Info -->
          <div style="background-color: #f8fafc; border-radius: 16px; padding: 16px; font-size: 13px; color: #475569; margin-bottom: 24px; border: 1px solid #f1f5f9;">
            <div style="font-weight: 800; color: #1e293b; margin-bottom: 8px;">📍 Teslimat Bilgileri:</div>
            <div>Alıcı: <strong>${order.recipientName || "—"}</strong> (${order.recipientPhone || "—"})</div>
            <div>Teslimat Zamanı: <strong>${order.deliveryDate || "Bugün"} (${order.deliveryTime || "15:00 - 18:00"})</strong></div>
            <div style="margin-top: 4px;">Adres: ${order.address || "—"}</div>
          </div>

          <!-- Call to Action Button -->
          <div style="text-align: center; margin-top: 30px;">
            <a href="${trackingLink}" style="display: inline-block; background-color: #2b2623; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 14px; font-weight: 800; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
              🔎 Canlı Sipariş Takibi
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
          © 2026 Çiçekçe Online Çiçekçilik A.Ş. · <a href="${BASE_URL}" style="color: #64748b;">www.cicekce.com</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getPhotoApprovalHtml(order: any): string {
  const approvalLink = `${BASE_URL}/siparis-onay/${order.id}`;
  const photoUrl = order.preparedPhoto || "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600";

  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head><meta charset="utf-8"><title>Canlı Görsel Onayı</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf6f0; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background-color: #7c3aed; padding: 25px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 24px; font-weight: 900;">📸 Çiçeğiniz Hazırlandı!</h2>
          <p style="margin: 6px 0 0 0; font-size: 14px; color: #f3e8ff;">Sipariş #${order.id} Canlı Görsel Onayı Bekliyor</p>
        </div>

        <!-- Body -->
        <div style="padding: 30px; text-align: center;">
          <p style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 20px;">
            Sayın <strong>${order.customerName || "Müşterimiz"}</strong>,<br>
            Floristlerimiz #${order.id} numaralı siparişinizi atölyemizde özenle hazırladı! Aşağıdaki canlı fotoğrafı inceleyip onaylayabilirsiniz:
          </p>

          <!-- Prepared Photo -->
          <div style="margin: 20px 0; border-radius: 16px; overflow: hidden; border: 2px solid #e9d5ff; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <img src="${photoUrl}" alt="Hazırlanan Çiçek" style="width: 100%; max-height: 400px; object-fit: cover; display: block;" />
          </div>

          <div style="background-color: #f3e8ff; border-radius: 14px; padding: 12px 16px; font-size: 12px; color: #6b21a8; font-weight: bold; margin-bottom: 24px; display: inline-block;">
            ⏳ 15 Dakika İçinde Otomatik Onaylanacaktır
          </div>

          <div>
            <a href="${approvalLink}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 16px; font-weight: 900; font-size: 16px; box-shadow: 0 6px 20px rgba(124, 58, 237, 0.3);">
              ✨ Görseli İncele & Onayla
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
          © 2026 Çiçekçe · <a href="${BASE_URL}" style="color: #64748b;">www.cicekce.com</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getDeliveredNoticeHtml(order: any): string {
  const reviewLink = `${BASE_URL}/hesabim?tab=orders`;

  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head><meta charset="utf-8"><title>Siparişiniz Teslim Edildi</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf6f0; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background-color: #059669; padding: 25px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 24px; font-weight: 900;">✅ Çiçeğiniz Teslim Edildi!</h2>
          <p style="margin: 6px 0 0 0; font-size: 14px; color: #d1fae5;">Sipariş #${order.id} Başarıyla Ulaştırıldı</p>
        </div>

        <!-- Body -->
        <div style="padding: 30px; text-align: center;">
          <p style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 20px;">
            Sayın <strong>${order.customerName || "Müşterimiz"}</strong>,<br>
            #${order.id} numaralı siparişiniz alıcı <strong>${order.recipientName || "Alıcı Müşteri"}</strong> kişisine başarıyla teslim edilmiştir.
          </p>

          ${order.deliveredPhoto ? `
            <div style="margin: 20px 0; border-radius: 16px; overflow: hidden; border: 2px solid #a7f3d0; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
              <img src="${order.deliveredPhoto}" alt="Teslimat Fotoğrafı" style="width: 100%; max-height: 350px; object-fit: cover; display: block;" />
            </div>
          ` : ""}

          <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 16px; padding: 16px; margin: 24px 0; text-align: center;">
            <div style="font-size: 14px; font-weight: 900; color: #78350f;">⭐ Hizmetimizi Değerlendirin!</div>
            <div style="font-size: 12px; color: #92400e; margin-top: 4px;">Değerlendirmenizi tamamlayın, bir sonraki siparişiniz için 50 ÇiçekPuan kazanın.</div>
          </div>

          <div>
            <a href="${reviewLink}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 14px; font-weight: 900; font-size: 14px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);">
              ⭐ Değerlendir & Puan Kazan
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
          © 2026 Çiçekçe · <a href="${BASE_URL}" style="color: #64748b;">www.cicekce.com</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getAbandonedCartHtml(cart: any): string {
  const checkoutLink = `${BASE_URL}/sepet`;

  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head><meta charset="utf-8"><title>Çiçeğiniz Sepette Kaldı</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf6f0; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background-color: #2b2623; padding: 25px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 24px; font-weight: 900;">🛒 Çiçeğiniz Sepette Sizi Bekliyor!</h2>
          <p style="margin: 6px 0 0 0; font-size: 14px; color: #e2e8f0;">Sevdiklerinizi Mutlu Etmeyi Ertelemeyin</p>
        </div>

        <!-- Body -->
        <div style="padding: 30px; text-align: center;">
          <p style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 20px;">
            Merhaba <strong>${cart.customerName || cart.customer || "Müşterimiz"}</strong>,<br>
            Seçtiğiniz <strong>"${cart.product || "Çiçek Buketi"}"</strong> sepetinizde kaldı. Taze çiçek stoklarımız tükenmeden siparişinizi tek tıkla tamamlayabilirsiniz!
          </p>

          <div style="background-color: #fff7ed; border: 1px solid #ffedd5; border-radius: 16px; padding: 20px; margin: 20px 0; text-align: center;">
            <div style="font-size: 13px; font-weight: bold; color: #c2410c;">SEPET TUTARINIZ</div>
            <div style="font-size: 26px; font-weight: 900; color: #9a3412; margin-top: 4px;">${cart.total || cart.cartTotal || "0 ₺"}</div>
          </div>

          <div>
            <a href="${checkoutLink}" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 16px; font-weight: 900; font-size: 16px; box-shadow: 0 6px 20px rgba(234, 88, 12, 0.3);">
              💐 Siparişi Şimdi Tamamla
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
          © 2026 Çiçekçe · <a href="${BASE_URL}" style="color: #64748b;">www.cicekce.com</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

// --- EMAIL SENDING ENGINES ---

/**
 * Send Transactional Email via Resend API (Primary) or SMTP (Fallback)
 */
export async function sendTransactionalEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: `Çiçekçe Sipariş <${SENDER_EMAIL}>`,
          to: [to],
          subject,
          html,
        })
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, provider: "resend", id: data.id };
      }
    } catch (e) {}
  }

  // Fallback to internal /api/send-email (SMTP)
  try {
    const fallbackRes = await fetch(`${BASE_URL}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html }),
    });
    if (fallbackRes.ok) {
      return { success: true, provider: "smtp" };
    }
  } catch (e) {}

  return { success: false, error: "Email sending failed" };
}

/**
 * Send Marketing Email via Brevo API (Primary)
 */
export async function sendMarketingEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const brevoApiKey = process.env.BREVO_API_KEY;

  if (brevoApiKey) {
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          sender: { name: BRAND_NAME, email: SENDER_EMAIL },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        })
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, provider: "brevo", messageId: data.messageId };
      }
    } catch (e) {}
  }

  return sendTransactionalEmail({ to, subject, html });
}
