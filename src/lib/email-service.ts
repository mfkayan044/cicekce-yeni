/**
 * Çiçekçe Lüks E-Posta Entegrasyon Servisi (Resend + Brevo + SMTP Fallback)
 * 
 * 1. Resend API: Transactional Mailler (Sipariş Onayı, Görsel Onayı, Kurye Takibi, Teslimat)
 * 2. Brevo API: Marketing & Pazarlama Mailleri (Yarım Kalan Sepet, Bülten, Hoş Geldin)
 * 3. Domain URL: https://www.cicekce.com
 */

export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.cicekce.com";
export const BRAND_NAME = "Çiçekçe";
export const SENDER_EMAIL = process.env.SENDER_EMAIL || "siparis@cicekce.com";

// --- BRAND DESIGN SYSTEM & HTML TEMPLATES ---

// Common Header HTML
function getHeaderHtml(title: string, subtitle: string, headerBg: string = "#2b2623"): string {
  return `
    <div style="background-color: ${headerBg}; padding: 30px 24px; text-align: center; color: #ffffff; border-bottom: 3px solid #d97706;">
      <div style="font-size: 26px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; font-family: 'Cinzel', Georgia, serif; color: #ffffff; margin-bottom: 8px;">
        🌸 Ç İ Ç E K Ç E
      </div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #ffffff;">${title}</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #e2e8f0; font-weight: 500;">${subtitle}</p>
    </div>
  `;
}

// Common Footer HTML
function getFooterHtml(): string {
  return `
    <div style="background-color: #faf6f0; padding: 24px; text-align: center; font-size: 12px; color: #78716c; border-top: 1px solid #e7e5e4;">
      <div style="font-weight: 800; color: #2b2623; font-size: 14px; margin-bottom: 6px;">🌸 Çiçekçe</div>
      <div style="margin-bottom: 10px; color: #57534e;">Aynı Gün Teslimat · Canlı Fotoğraf Onayı · Özel Tasarım Çiçekler</div>
      <div>
        <a href="${BASE_URL}" style="color: #b45309; font-weight: bold; text-decoration: none;">www.cicekce.com</a> · 
        <a href="${BASE_URL}/siparis-takip" style="color: #44403c; text-decoration: none;">Sipariş Takibi</a> · 
        <a href="${BASE_URL}/iletisim" style="color: #44403c; text-decoration: none;">Müşteri Hizmetleri</a>
      </div>
      <div style="margin-top: 12px; font-size: 11px; color: #a8a29e;">© 2026 Çiçekçe. Tüm hakları saklıdır.</div>
    </div>
  `;
}

/**
 * Helper to parse arrays from possible stringified JSON
 */
function parseJsonArray(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return [];
}

/**
 * 1. Sipariş Onayı (Kredi Kartı / Havale)
 */
export function getOrderReceivedHtml(order: any): string {
  const items = parseJsonArray(order.items);
  const addons = parseJsonArray(order.addons || order.extras || order.selectedExtras);

  const itemsHtml = items.map((item: any) => {
    const imgUrl = item.image || item.img || item.photo || item.imageUrl || "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=120";
    return `
      <tr>
        <td style="padding: 14px; border-bottom: 1px solid #f3f4f6;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${imgUrl}" alt="${item.title || item.name || "Çiçek"}" style="width: 48px; height: 48px; border-radius: 10px; object-fit: cover; border: 1px solid #e2e8f0; display: inline-block; vertical-align: middle; margin-right: 10px;" />
            <span style="font-weight: 800; color: #1c1917; font-size: 14px; vertical-align: middle;">🌸 ${item.title || item.name || "Özel Çiçek Aranjmanı"}</span>
          </div>
        </td>
        <td style="padding: 14px; border-bottom: 1px solid #f3f4f6; text-align: center; font-weight: 800; color: #78716c;">
          ${item.quantity || 1} Adet
        </td>
        <td style="padding: 14px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 900; color: #2b2623;">
          ${typeof item.price === "number" ? `${item.price} ₺` : item.price || "—"}
        </td>
      </tr>
    `;
  }).join("");

  const addonsHtml = addons.map((add: any) => {
    const addImg = add.image || add.img || add.photo || "";
    return `
      <tr style="background-color: #fefce8;">
        <td style="padding: 12px 14px; border-bottom: 1px solid #fef08a;">
          <div style="display: flex; align-items: center; gap: 10px;">
            ${addImg ? `<img src="${addImg}" alt="${add.name || add.title}" style="width: 36px; height: 36px; border-radius: 8px; object-fit: cover; border: 1px solid #fde047; display: inline-block; vertical-align: middle; margin-right: 8px;" />` : `<span style="font-size: 16px; margin-right: 8px;">🎁</span>`}
            <span style="font-weight: 700; color: #713f12; font-size: 13px; vertical-align: middle;">🎁 ${add.name || add.title || "Ekstra Ürün"}</span>
          </div>
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #fef08a; text-align: center; font-weight: 700; color: #854d0e;">
          ${add.quantity || 1} Adet
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #fef08a; text-align: right; font-weight: 900; color: #713f12;">
          ${typeof add.price === "number" ? `${add.price} ₺` : add.price || "—"}
        </td>
      </tr>
    `;
  }).join("");

  const trackingLink = `${BASE_URL}/siparis-takip?orderId=${order.id}`;

  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head><meta charset="utf-8"><title>Siparişiniz Alındı</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f4; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e7e5e4; box-shadow: 0 12px 30px rgba(0,0,0,0.06);">
        
        ${getHeaderHtml("Siparişiniz Başarıyla Alındı!", `Sipariş Kodu: #${order.id}`)}

        <div style="padding: 30px;">
          <!-- Order ID Badge -->
          <div style="background-color: #fef3c7; border: 1.5px solid #fde68a; border-radius: 16px; padding: 18px; text-align: center; margin-bottom: 24px;">
            <div style="font-size: 12px; color: #92400e; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">SİPARİŞ NUMARANIZ</div>
            <div style="font-size: 26px; font-weight: 900; color: #78350f; margin-top: 4px;">#${order.id}</div>
          </div>

          <p style="font-size: 15px; color: #44403c; line-height: 1.6; margin-bottom: 24px;">
            Sayın <strong>${order.customerName || "Değerli Müşterimiz"}</strong>,<br>
            Siparişiniz floristlerimizin atölyesine ulaştı! Çiçeğiniz taze canlı çiçeklerle özenle hazırlanacak, yola çıkmadan önce <strong>canlı fotoğraf onayı</strong> e-posta ve SMS ile tarafınıza iletilecektir.
          </p>

          <!-- Order Summary Table -->
          <div style="border: 1.5px solid #e7e5e4; border-radius: 18px; overflow: hidden; margin-bottom: 24px;">
            <div style="background-color: #faf6f0; padding: 14px 18px; font-weight: 900; font-size: 13px; color: #2b2623; border-bottom: 1px solid #e7e5e4; text-transform: uppercase; letter-spacing: 0.5px;">
              💐 Sipariş Özeti
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              ${itemsHtml}
              ${addonsHtml}
            </table>
            <div style="background-color: #faf6f0; padding: 16px 18px; text-align: right; font-weight: 900; font-size: 17px; color: #2b2623; border-top: 1px solid #e7e5e4;">
              Toplam Ödenen: <span style="color: #b45309;">${order.totalAmount || order.totalPrice || "1.250 ₺"}</span>
            </div>
          </div>

          <!-- Recipient Info Card -->
          <div style="background-color: #faf6f0; border-radius: 18px; padding: 18px; font-size: 13px; color: #57534e; margin-bottom: 28px; border: 1.5px solid #f5efe6;">
            <div style="font-weight: 900; color: #2b2623; margin-bottom: 10px; font-size: 14px;">📍 Teslimat Bilgileri:</div>
            <div style="margin-bottom: 4px;">Alıcı: <strong style="color: #1c1917;">${order.recipientName || "Zeynep Yılmaz"}</strong> (${order.recipientPhone || "0532 *** ** 12"})</div>
            <div style="margin-bottom: 4px;">Teslimat Zamanı: <strong style="color: #b45309;">${order.deliveryDate || "Bugün"} (${order.deliveryTime || "15:00 - 18:00"})</strong></div>
            <div>Adres: ${order.address || "Bağdat Caddesi No:142 Kadıköy / İstanbul"}</div>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-top: 32px;">
            <a href="${trackingLink}" style="display: inline-block; background-color: #2b2623; color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 16px; font-weight: 900; font-size: 15px; box-shadow: 0 6px 18px rgba(43, 38, 35, 0.25);">
              🔎 Canlı Sipariş Takibi Yap
            </a>
          </div>
        </div>

        ${getFooterHtml()}
      </div>
    </body>
    </html>
  `;
}

/**
 * Sipariş Hazırlanıyor Bildirimi
 */
export function getPreparingNoticeHtml(order: any): string {
  const trackingLink = `${BASE_URL}/siparis-takip?orderId=${order.id}`;

  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head><meta charset="utf-8"><title>Siparişiniz Hazırlanıyor</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f4; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e7e5e4; box-shadow: 0 12px 30px rgba(0,0,0,0.06);">
        
        ${getHeaderHtml("💐 Çiçeğiniz Hazırlanmaya Başlandı!", `Sipariş #${order.id} Atölyemizde`, "#b45309")}

        <div style="padding: 30px; text-align: center;">
          <p style="font-size: 15px; color: #44403c; line-height: 1.6; margin-bottom: 24px;">
            Sayın <strong>${order.customerName || "Değerli Müşterimiz"}</strong>,<br>
            <strong>#${order.id}</strong> numaralı siparişiniz floristlerimiz tarafından en taze canlı çiçeklerle hazırlanmaya başladı! Hazırlandığında canlı fotoğraf onayı tarafınıza iletilecektir.
          </p>

          <div style="background-color: #faf6f0; border-radius: 18px; padding: 20px; margin-bottom: 24px; border: 1.5px solid #f5efe6;">
            <div style="font-size: 13px; font-weight: 900; color: #2b2623; margin-bottom: 14px; text-align: center; text-transform: uppercase;">
              🌸 Sipariş Durum Bilgisi
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: bold; color: #78716c; text-align: center;">
              <div style="flex: 1;"><span style="color: #b45309; font-size: 14px; font-weight: 900;">💐 Hazırlanıyor</span></div>
              <div style="flex: 1;"><span>📸 Fotoğraf Onayı</span></div>
              <div style="flex: 1;"><span>🛵 Kuryede</span></div>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${trackingLink}" style="display: inline-block; background-color: #2b2623; color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 16px; font-weight: 900; font-size: 15px; box-shadow: 0 6px 18px rgba(43, 38, 35, 0.25);">
              🔎 Canlı Sipariş Takibi
            </a>
          </div>
        </div>

        ${getFooterHtml()}
      </div>
    </body>
    </html>
  `;
}

/**
 * 2. Canlı Fotoğraf Onayı İsteği
 */
export function getPhotoApprovalHtml(order: any): string {
  const approvalLink = `${BASE_URL}/siparis-onay/${order.id}`;
  const photoUrl = order.preparedPhoto || "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600";

  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head><meta charset="utf-8"><title>Canlı Görsel Onayı</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f4; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e7e5e4; box-shadow: 0 12px 30px rgba(0,0,0,0.06);">
        
        ${getHeaderHtml("📸 Çiçeğiniz Hazırlandı!", `Sipariş #${order.id} Canlı Görsel Onayı Bekliyor`, "#5b21b6")}

        <div style="padding: 30px; text-align: center;">
          <p style="font-size: 15px; color: #44403c; line-height: 1.6; margin-bottom: 20px;">
            Sayın <strong>${order.customerName || "Değerli Müşterimiz"}</strong>,<br>
            Floristlerimiz <strong>#${order.id}</strong> numaralı siparişinizi atölyemizde taze taze hazırladı! Çiçeğiniz kuryeye verilmeden önce canlı fotoğrafını inceleyip onaylayabilirsiniz:
          </p>

          <!-- Prepared Photo -->
          <div style="margin: 20px 0; border-radius: 20px; overflow: hidden; border: 3px solid #ddd6fe; box-shadow: 0 8px 25px rgba(91, 33, 182, 0.15);">
            <img src="${photoUrl}" alt="Hazırlanan Çiçek" style="width: 100%; max-height: 420px; object-fit: cover; display: block;" />
          </div>

          <div style="margin-top: 26px;">
            <a href="${approvalLink}" style="display: inline-block; background-color: #5b21b6; color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 18px; font-weight: 900; font-size: 16px; box-shadow: 0 8px 22px rgba(91, 33, 182, 0.35);">
              ✨ Görseli İncele & Onayla
            </a>
          </div>
        </div>

        ${getFooterHtml()}
      </div>
    </body>
    </html>
  `;
}

/**
 * 3. Kurye Yola Çıktı / Durum Güncellemesi
 */
export function getCourierNoticeHtml(order: any): string {
  const trackingLink = `${BASE_URL}/siparis-takip?orderId=${order.id}`;

  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head><meta charset="utf-8"><title>Çiçeğiniz Kuryede</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f4; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e7e5e4; box-shadow: 0 12px 30px rgba(0,0,0,0.06);">
        
        ${getHeaderHtml("🛵 Çiçeğiniz Kuryede Yola Çıktı!", `Sipariş #${order.id} Teslimat Aşamasında`, "#1e293b")}

        <div style="padding: 30px;">
          <p style="font-size: 15px; color: #44403c; line-height: 1.6; margin-bottom: 24px; text-align: center;">
            Sayın <strong>${order.customerName || "Değerli Müşterimiz"}</strong>,<br>
            <strong>#${order.id}</strong> numaralı siparişiniz özel kuryemize teslim edildi ve alıcı adrese doğru yola çıktı!
          </p>

          <!-- Delivery Status Steps -->
          <div style="background-color: #faf6f0; border-radius: 18px; padding: 20px; margin-bottom: 24px; border: 1.5px solid #f5efe6;">
            <div style="font-size: 13px; font-weight: 900; color: #2b2623; margin-bottom: 14px; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">
              🛵 Canlı Teslimat Süreci
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: bold; color: #78716c; text-align: center;">
              <div style="flex: 1;"><span style="color: #166534;">✅ Hazırlandı</span></div>
              <div style="flex: 1;"><span style="color: #b45309; font-size: 14px; font-weight: 900;">🛵 Kuryede</span></div>
              <div style="flex: 1;"><span>🏁 Teslim Edilecek</span></div>
            </div>
          </div>

          <!-- Recipient Info Card -->
          <div style="background-color: #f8fafc; border-radius: 16px; padding: 18px; font-size: 13px; color: #475569; margin-bottom: 28px; border: 1px solid #e2e8f0;">
            <div style="font-weight: 900; color: #1e293b; margin-bottom: 8px;">📍 Teslimat Adresi:</div>
            <div>Alıcı: <strong>${order.recipientName || "Zeynep Yılmaz"}</strong></div>
            <div>Tahmini Teslimat: <strong>${order.deliveryDate || "Bugün"} (${order.deliveryTime || "15:00 - 18:00"})</strong></div>
            <div style="margin-top: 4px;">Adres: ${order.address || "Bağdat Caddesi No:142 Kadıköy / İstanbul"}</div>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center;">
            <a href="${trackingLink}" style="display: inline-block; background-color: #2b2623; color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 16px; font-weight: 900; font-size: 15px; box-shadow: 0 6px 18px rgba(43, 38, 35, 0.25);">
              🗺️ Kuryeyi Haritada Takip Et
            </a>
          </div>
        </div>

        ${getFooterHtml()}
      </div>
    </body>
    </html>
  `;
}

/**
 * 4. Sipariş Teslim Edildi & ÇiçekPuan İnceleme İsteği
 */
export function getDeliveredNoticeHtml(order: any): string {
  const reviewLink = `${BASE_URL}/hesabim?tab=orders`;

  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head><meta charset="utf-8"><title>Siparişiniz Teslim Edildi</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f4; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e7e5e4; box-shadow: 0 12px 30px rgba(0,0,0,0.06);">
        
        ${getHeaderHtml("✅ Çiçeğiniz Teslim Edildi!", `Sipariş #${order.id} Alıcıya Ulaştırıldı`, "#059669")}

        <div style="padding: 30px; text-align: center;">
          <p style="font-size: 15px; color: #44403c; line-height: 1.6; margin-bottom: 20px;">
            Sayın <strong>${order.customerName || "Değerli Müşterimiz"}</strong>,<br>
            <strong>#${order.id}</strong> numaralı siparişiniz alıcı <strong>${order.recipientName || "Alıcı Müşteri"}</strong> kişisine özenle teslim edilmiştir. Sevdiklerinizi mutlu ettiğimiz için gururluyuz!
          </p>

          ${order.deliveredPhoto ? `
            <div style="margin: 20px 0; border-radius: 20px; overflow: hidden; border: 2.5px solid #a7f3d0; box-shadow: 0 6px 20px rgba(5, 150, 105, 0.12);">
              <img src="${order.deliveredPhoto}" alt="Teslimat Fotoğrafı" style="width: 100%; max-height: 380px; object-fit: cover; display: block;" />
            </div>
          ` : ""}

          <!-- Points Reward Banner -->
          <div style="background-color: #fef3c7; border: 1.5px solid #fde68a; border-radius: 18px; padding: 20px; margin: 26px 0; text-align: center;">
            <div style="font-size: 15px; font-weight: 900; color: #78350f;">⭐ Hizmetimizi Değerlendirin & 50 ÇiçekPuan Kazanın!</div>
            <div style="font-size: 13px; color: #92400e; margin-top: 6px;">Teslimatı 1 dakikada değerlendirin, bir sonraki alışverişinizde geçerli 50 ÇiçekPuan anında hesabınıza yüklensin.</div>
          </div>

          <div>
            <a href="${reviewLink}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 18px 38px; border-radius: 18px; font-weight: 900; font-size: 16px; box-shadow: 0 8px 22px rgba(5, 150, 105, 0.35);">
              ⭐ Değerlendir & 50 ÇiçekPuan Kazan
            </a>
          </div>
        </div>

        ${getFooterHtml()}
      </div>
    </body>
    </html>
  `;
}

/**
 * 5. Yarım Kalan Sepet Hatırlatması (Brevo Marketing)
 */
export function getAbandonedCartHtml(cart: any): string {
  const checkoutLink = `${BASE_URL}/sepet`;

  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head><meta charset="utf-8"><title>Çiçeğiniz Sepette Kaldı</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f4; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e7e5e4; box-shadow: 0 12px 30px rgba(0,0,0,0.06);">
        
        ${getHeaderHtml("🛒 Çiçeğiniz Sepette Sizi Bekliyor!", "Taze Stoklar Tükenmeden Tek Tıkla Tamamlayın", "#ea580c")}

        <div style="padding: 30px; text-align: center;">
          <p style="font-size: 15px; color: #44403c; line-height: 1.6; margin-bottom: 20px;">
            Merhaba <strong>${cart.customerName || cart.customer || "Değerli Müşterimiz"}</strong>,<br>
            Seçtiğiniz <strong>"${cart.product || "Vazoda Pembe Lisyantus & Gül Seti"}"</strong> sepetinizde sizi bekliyor! Taze çiçek stoklarımız tükenmeden siparişinizi %10 indirim fırsatıyla tamamlayabilirsiniz.
          </p>

          <!-- Coupon Code Banner -->
          <div style="background-color: #faf6f0; border: 2px dashed #b45309; border-radius: 18px; padding: 20px; margin: 24px 0; text-align: center;">
            <div style="font-size: 12px; font-weight: 800; color: #78716c; text-transform: uppercase; letter-spacing: 1px;">SİZE ÖZEL %10 İNDİRİM KUPONU</div>
            <div style="font-size: 28px; font-weight: 900; color: #2b2623; letter-spacing: 3px; margin-top: 4px;">HOSGELDIN100</div>
          </div>

          <div style="background-color: #fff7ed; border: 1.5px solid #ffedd5; border-radius: 16px; padding: 16px; margin-bottom: 26px;">
            <div style="font-size: 12px; font-weight: 800; color: #c2410c;">SEPET TUTARI</div>
            <div style="font-size: 24px; font-weight: 900; color: #9a3412; margin-top: 2px;">${cart.total || cart.cartTotal || "850 ₺"}</div>
          </div>

          <div>
            <a href="${checkoutLink}" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 18px; font-weight: 900; font-size: 16px; box-shadow: 0 8px 22px rgba(234, 88, 12, 0.35);">
              💐 Siparişi İndirimle Tamamla
            </a>
          </div>
        </div>

        ${getFooterHtml()}
      </div>
    </body>
    </html>
  `;
}

/**
 * 6. Yeni Üyelik & Hoş Geldin Mesajı
 */
export function getWelcomeNoticeHtml(user: any): string {
  const shopLink = `${BASE_URL}`;

  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head><meta charset="utf-8"><title>Çiçekçe'ye Hoş Geldiniz</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f4; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e7e5e4; box-shadow: 0 12px 30px rgba(0,0,0,0.06);">
        
        ${getHeaderHtml("🌸 Çiçekçe Ailesine Hoş Geldiniz!", "İlk Siparişinize Özel 100 ₺ İndiriminiz Tanımlandı", "#2b2623")}

        <div style="padding: 30px; text-align: center;">
          <p style="font-size: 15px; color: #44403c; line-height: 1.6; margin-bottom: 24px;">
            Merhaba <strong>${user?.name || "Değerli Müşterimiz"}</strong>,<br>
            Çiçekçe ailesine katıldığınız için teşekkür ederiz! Taze çiçekler, aynı gün özel kurye teslimatı ve canlı fotoğraf onayı avantajlarımızla sevdiklerinize unutulmaz sürprizler hazırlamaya hazırsınız.
          </p>

          <!-- Welcome Coupon Box -->
          <div style="background-color: #faf6f0; border: 2px dashed #d97706; border-radius: 20px; padding: 22px; margin: 24px 0;">
            <div style="font-size: 12px; font-weight: 800; color: #b45309; text-transform: uppercase; letter-spacing: 1px;">İLK SİPARİŞİNİZE ÖZEL 100 ₺ İNDİRİM KODU</div>
            <div style="font-size: 30px; font-weight: 900; color: #2b2623; letter-spacing: 4px; margin-top: 6px;">HOSGELDIN100</div>
          </div>

          <div>
            <a href="${shopLink}" style="display: inline-block; background-color: #2b2623; color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 18px; font-weight: 900; font-size: 16px; box-shadow: 0 8px 22px rgba(43, 38, 35, 0.3);">
              🛍️ İlk Alışverişe Başla
            </a>
          </div>
        </div>

        ${getFooterHtml()}
      </div>
    </body>
    </html>
  `;
}

// --- EMAIL SENDING ENGINES ---

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

  // Fallback 1: Brevo API (Proven working integration)
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

  // Fallback 2: Internal SMTP Route
  try {
    const fallbackRes = await fetch(`${BASE_URL}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html, type: "transactional" }),
    });
    if (fallbackRes.ok) {
      return { success: true, provider: "smtp" };
    }
  } catch (e) {}

  return { success: false, error: "Email sending failed" };
}

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
