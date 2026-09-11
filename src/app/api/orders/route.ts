import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sql } from "@/lib/db";
import { isRequestAuthorized, verifyTrackingToken, generateTrackingToken } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeObject, sanitizeString } from "@/lib/sanitize";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

// Helper to parse Turkish price string to number
function parsePrice(val: any): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  const cleaned = String(val)
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

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

function getFirstNonEmptyArray(...sources: any[]): any[] {
  for (const src of sources) {
    const arr = parseJsonArray(src);
    if (arr && arr.length > 0) {
      return arr;
    }
  }
  return [];
}

// In-memory cache fallback to guarantee instant persistence across requests
let memoryCourierMap: Record<string, any> = {};

async function getOrderCouriersMap(): Promise<Record<string, any>> {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("id", "order_couriers")
      .single();
    if (data && data.value && typeof data.value === "object") {
      memoryCourierMap = { ...memoryCourierMap, ...data.value };
      return memoryCourierMap;
    }
  } catch (e) {}
  return memoryCourierMap;
}

async function saveOrderCouriersMap(map: Record<string, any>) {
  memoryCourierMap = { ...memoryCourierMap, ...map };
  try {
    await supabase
      .from("site_settings")
      .upsert({ id: "order_couriers", value: memoryCourierMap, updated_at: new Date().toISOString() });
  } catch (e) {}
}

function parseOrderMeta(o: any, extra: any) {
  let customerApprovalStatus = "Bekliyor";
  let preparedPhotoTime = o.created_at || extra.preparedPhotoTime || "";
  let courierId = extra.courierId || "";
  let courierName = extra.courierName || "";
  let deliveredAt = extra.deliveredAt || "";
  let deliveredPhoto = extra.deliveredPhoto || "";
  let deliveryNote = extra.deliveryNote || "";
  let rejectionReason = extra.rejectionReason || "";
  let updateRequest = extra.updateRequest || null;

  const rawStatus = o.customer_approval_status || o.customerApprovalStatus || extra.customerApprovalStatus || "";
  if (rawStatus) {
    if (typeof rawStatus === "string" && rawStatus.trim().startsWith("{")) {
      try {
        const meta = JSON.parse(rawStatus);
        if (meta.status || meta.approval) customerApprovalStatus = meta.status || meta.approval;
        if (meta.photoTime || meta.preparedPhotoTime) preparedPhotoTime = meta.photoTime || meta.preparedPhotoTime;
        if (meta.courierId !== undefined) courierId = meta.courierId;
        if (meta.courierName !== undefined) courierName = meta.courierName;
        if (meta.deliveredAt !== undefined) deliveredAt = meta.deliveredAt;
        if (meta.deliveredPhoto !== undefined) deliveredPhoto = meta.deliveredPhoto;
        if (meta.deliveryNote !== undefined) deliveryNote = meta.deliveryNote;
        if (meta.rejectionReason !== undefined) rejectionReason = meta.rejectionReason;
        if (meta.updateRequest !== undefined) updateRequest = meta.updateRequest;
      } catch (e) {
        customerApprovalStatus = rawStatus;
      }
    } else {
      customerApprovalStatus = rawStatus;
    }
  }

  const preparedPhoto = (o.prepared_photo && String(o.prepared_photo).trim() !== "")
    ? o.prepared_photo
    : ((o.preparedPhoto && String(o.preparedPhoto).trim() !== "") ? o.preparedPhoto : (extra.preparedPhoto || ""));

  return {
    customerApprovalStatus,
    preparedPhotoTime,
    courierId,
    courierName,
    deliveredAt,
    deliveredPhoto,
    deliveryNote,
    rejectionReason,
    updateRequest,
    preparedPhoto
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("id");
    const phone = searchParams.get("phone");
    const token = searchParams.get("token");

    // Fetch Supabase orders to merge extra metadata fields (addons, points, etc.) if available
    let sbMap: Record<string, any> = {};
    try {
      const { data: sbOrders } = await supabase.from("orders").select("*");
      if (sbOrders) {
        for (const sbo of sbOrders) {
          sbMap[sbo.id] = sbo;
        }
      }
    } catch (e) {}

    const courierMap = await getOrderCouriersMap();

    // Public lookup for customer tracking if search query is passed
    if (orderId) {
      // Rate limit single order lookups (15 requests/min per IP)
      const rateCheck = checkRateLimit(request, "order_lookup", 15, 60 * 1000);
      if (!rateCheck.success) {
        return NextResponse.json(
          { error: "Çok fazla sorgulama yapıldı. Lütfen 1 dakika sonra tekrar deneyiniz." },
          { status: 429 }
        );
      }

      const cleanInputId = orderId.trim();
      const formattedInputId = cleanInputId.toUpperCase().startsWith("SIP-") ? cleanInputId.toUpperCase() : `SIP-${cleanInputId.toUpperCase()}`;
      const cleanPhone = phone ? phone.replace(/[^0-9]/g, "") : "";

      let order: any = null;
      const { data: sbOrder } = await supabase
        .from("orders")
        .select("*")
        .or(`id.eq.${cleanInputId},id.ilike.${cleanInputId},id.eq.${formattedInputId}`)
        .maybeSingle();
      order = sbOrder;

      if (!order) {
        try {
          const neonRes = await sql`SELECT * FROM orders WHERE UPPER(id) = ${cleanInputId.toUpperCase()} OR UPPER(id) = ${formattedInputId} LIMIT 1;`;
          if (neonRes && neonRes.length > 0) {
            order = neonRes[0];
          }
        } catch (e) {}
      }

      if (!order) {
        return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
      }

      // SECURITY ENFORCEMENT:
      // Single order public lookup MUST require matching customer_phone/recipient_phone OR valid HMAC tracking token!
      const custPhoneClean = String(order.customer_phone || order.customerPhone || "").replace(/[^0-9]/g, "");
      const recipPhoneClean = String(order.recipient_phone || order.recipientPhone || "").replace(/[^0-9]/g, "");

      const inputDigits = cleanPhone;
      const inputLast7 = inputDigits.length >= 7 ? inputDigits.slice(-7) : inputDigits;

      const matchesCustomer = inputLast7.length >= 4 && custPhoneClean.includes(inputLast7);
      const matchesRecipient = inputLast7.length >= 4 && recipPhoneClean.includes(inputLast7);

      const isTokenValidCust = token && (await verifyTrackingToken(order.id, custPhoneClean, token));
      const isTokenValidRecip = token && (await verifyTrackingToken(order.id, recipPhoneClean, token));

      if (!isTokenValidCust && !isTokenValidRecip && (!cleanPhone || (!matchesCustomer && !matchesRecipient))) {
        return NextResponse.json(
          { error: "Güvenlik Uyarısı: Sipariş takibi yapabilmek için Sipariş Kodu ile birlikte siparişte kayıtlı Telefon Numarasını girmelisiniz veya güvenli takip bağlantısını kullanmalısınız." },
          { status: 403 }
        );
      }

      const extra = courierMap[order.id] || memoryCourierMap[order.id] || {};
      const meta = parseOrderMeta(order, extra);

      const itemsArr = parseJsonArray(order.items);
      const addonsArr = getFirstNonEmptyArray(order.addons, extra.addons, order.selectedExtras, extra.selectedExtras, order.extras, extra.extras);

      return NextResponse.json({
        id: order.id,
        date: order.date,
        status: order.status || extra.status || "Yeni Sipariş",
        customerName: order.customer_name || order.customerName,
        customerPhone: order.customer_phone || order.customerPhone,
        customerEmail: order.customer_email || order.customerEmail,
        recipientName: order.recipient_name || order.recipientName,
        recipientPhone: order.recipient_phone || order.recipientPhone,
        address: order.address,
        deliveryDate: order.delivery_date || order.deliveryDate,
        deliveryTime: order.delivery_time || order.deliveryTime,
        items: itemsArr,
        addons: addonsArr,
        extras: parseJsonArray(order.extras || extra.extras),
        selectedExtras: parseJsonArray(order.selectedExtras || extra.selectedExtras),
        cardNote: order.card_note || order.cardNote,
        isAnonymous: order.is_anonymous === true,
        paymentMethod: order.payment_method || order.paymentMethod,
        totalAmount: order.total_amount || order.totalAmount,
        totalPrice: order.total_amount || order.totalPrice,
        usedPoints: order.used_points || order.usedPoints || extra.usedPoints || null,
        pointsDiscount: order.points_discount || order.pointsDiscount || extra.pointsDiscount || null,
        discountAmount: order.discount_amount || order.discountAmount || extra.discountAmount || null,
        preparedPhoto: meta.preparedPhoto,
        preparedPhotoTime: meta.preparedPhotoTime,
        customerApprovalStatus: meta.customerApprovalStatus,
        rejectionReason: meta.rejectionReason,
        courierId: meta.courierId,
        courierName: meta.courierName,
        deliveredAt: meta.deliveredAt,
        deliveredPhoto: meta.deliveredPhoto,
        deliveryNote: meta.deliveryNote,
        updateRequest: meta.updateRequest
      }, { headers: NO_CACHE_HEADERS });
    }

    // Full orders list
    let orders: any[] = [];
    try {
      orders = await sql`SELECT * FROM orders ORDER BY created_at DESC`;
    } catch (neonErr) {
      try {
        const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
        if (data) orders = data;
      } catch (sbErr) {
        orders = [];
      }
    }

    const nowMs = Date.now();
    const formatted = (orders || []).map((o: any) => {
      const sbOrder = sbMap[o.id] || {};
      const extra = courierMap[o.id] || memoryCourierMap[o.id] || {};
      const meta = parseOrderMeta(o, extra);

      let customerApprovalStatus = meta.customerApprovalStatus;
      const preparedPhoto = meta.preparedPhoto;
      const preparedPhotoTime = meta.preparedPhotoTime;
      let currentStatus = o.status || extra.status || "Yeni Sipariş";

      // 15-Minute Auto-Approval Check Engine (Measured EXCLUSIVELY from photo upload time):
      if (preparedPhoto && preparedPhotoTime && (customerApprovalStatus === "Bekliyor" || !customerApprovalStatus)) {
        const photoTimeMs = new Date(preparedPhotoTime).getTime();
        if (!isNaN(photoTimeMs) && photoTimeMs > 0) {
          const photoAgeMs = nowMs - photoTimeMs;
          if (photoAgeMs >= 15 * 60 * 1000) {
            customerApprovalStatus = "Sistem Tarafından Onaylandı (15 dk Süre Doldu)";
            if (currentStatus === "Fotoğraflı Onay Bekliyor") {
              currentStatus = "Hazırlanıyor / Onaylandı";
            }
          }
        }
      }

      // If approved by customer or system, update status
      if ((customerApprovalStatus.includes("Onaylandı") || customerApprovalStatus === "Onaylandı") && currentStatus === "Fotoğraflı Onay Bekliyor") {
        currentStatus = "Hazırlanıyor / Onaylandı";
      }

      const status = currentStatus;

      const mergedAddons = getFirstNonEmptyArray(o.addons, sbOrder.addons, extra.addons, o.selectedExtras, sbOrder.selectedExtras, extra.selectedExtras, o.extras, extra.extras);

      const mergedUsedPoints = o.used_points || o.usedPoints || sbOrder.used_points || sbOrder.usedPoints || extra.usedPoints || null;
      const mergedPointsDiscount = o.points_discount || o.pointsDiscount || sbOrder.points_discount || sbOrder.pointsDiscount || extra.pointsDiscount || null;
      const mergedDiscountAmount = o.discount_amount || o.discountAmount || sbOrder.discount_amount || sbOrder.discountAmount || extra.discountAmount || null;

      return {
        id: o.id,
        date: o.date,
        status,
        customerName: o.customer_name || o.customerName || sbOrder.customer_name,
        customerPhone: o.customer_phone || o.customerPhone || sbOrder.customer_phone,
        customerEmail: o.customer_email || o.customerEmail || sbOrder.customer_email,
        recipientName: o.recipient_name || o.recipientName || sbOrder.recipient_name,
        recipientPhone: o.recipient_phone || o.recipientPhone || sbOrder.recipient_phone,
        address: o.address || sbOrder.address,
        deliveryDate: o.delivery_date || o.deliveryDate || sbOrder.delivery_date,
        deliveryTime: o.delivery_time || o.deliveryTime || sbOrder.delivery_time,
        items: parseJsonArray(o.items || sbOrder.items),
        addons: mergedAddons,
        extras: parseJsonArray(o.extras || sbOrder.extras || extra.extras),
        selectedExtras: parseJsonArray(o.selectedExtras || sbOrder.selectedExtras || extra.selectedExtras),
        cardNote: o.card_note || o.cardNote || sbOrder.card_note,
        isAnonymous: o.is_anonymous === true || sbOrder.is_anonymous === true,
        paymentMethod: o.payment_method || o.paymentMethod || sbOrder.payment_method,
        totalPrice: o.total_amount || o.totalPrice || sbOrder.total_amount,
        totalAmount: o.total_amount || o.totalAmount || sbOrder.total_amount,
        usedPoints: mergedUsedPoints,
        pointsDiscount: mergedPointsDiscount,
        discountAmount: mergedDiscountAmount,
        preparedPhoto,
        preparedPhotoTime,
        customerApprovalStatus,
        rejectionReason: meta.rejectionReason,
        courierId: meta.courierId,
        courierName: meta.courierName,
        deliveredAt: meta.deliveredAt,
        deliveredPhoto: meta.deliveredPhoto,
        deliveryNote: meta.deliveryNote,
        updateRequest: meta.updateRequest
      };
    });

    return NextResponse.json(formatted, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders from Supabase" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const rawData = await request.json();
    const orderData = sanitizeObject(rawData);

    if (!orderData.recipientName || !orderData.address) {
      return NextResponse.json({ error: "Eksik sipariş bilgisi." }, { status: 400 });
    }

    const newId = orderData.id || `SIP-${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder = {
      id: newId,
      date: orderData.date || new Date().toLocaleString("tr-TR"),
      status: orderData.status || "Yeni Sipariş",
      customer_name: orderData.customerName || orderData.customer_name || "Misafir Müşteri",
      customer_phone: orderData.customerPhone || orderData.customer_phone || "",
      customer_email: orderData.customerEmail || orderData.customer_email || "",
      recipient_name: orderData.recipientName || orderData.recipient_name,
      recipient_phone: orderData.recipientPhone || orderData.recipient_phone,
      address: orderData.address,
      delivery_date: orderData.deliveryDate || orderData.delivery_date || "Bugün",
      delivery_time: orderData.deliveryTime || orderData.delivery_time || "15:00 - 18:00",
      items: orderData.items || [],
      addons: orderData.addons || orderData.selectedExtras || [],
      card_note: orderData.cardNote || orderData.card_note || "",
      is_anonymous: orderData.isAnonymous === true,
      payment_method: orderData.paymentMethod || orderData.payment_method || "Kredi Kartı",
      total_amount: orderData.totalAmount || orderData.totalPrice || "0 ₺",
      used_points: orderData.usedPoints || orderData.used_points || null,
      points_discount: orderData.pointsDiscount || orderData.points_discount || null,
      discount_amount: orderData.discountAmount || orderData.discount_amount || null,
      prepared_photo: orderData.preparedPhoto || null,
      customer_approval_status: orderData.customerApprovalStatus || "Bekliyor"
    };

    try {
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS addons TEXT;`;
      await sql`
        INSERT INTO orders (id, order_no, customer_name, customer_phone, customer_email, recipient_name, recipient_phone, city, district, address, delivery_date, delivery_slot, card_note, total_amount, status, payment_method, payment_status, items, addons)
        VALUES (
          ${String(newOrder.id)},
          ${String(newOrder.id)},
          ${newOrder.customer_name},
          ${newOrder.customer_phone},
          ${newOrder.customer_email},
          ${newOrder.recipient_name},
          ${newOrder.recipient_phone},
          ${"İstanbul"},
          ${"Merkez"},
          ${newOrder.address},
          ${newOrder.delivery_date},
          ${newOrder.delivery_time},
          ${newOrder.card_note},
          ${typeof newOrder.total_amount === "number" ? newOrder.total_amount : (parseFloat(newOrder.total_amount) || 0)},
          ${newOrder.status},
          ${newOrder.payment_method},
          ${"Ödendi"},
          ${JSON.stringify(newOrder.items || [])},
          ${JSON.stringify(newOrder.addons || [])}
        )
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          total_amount = EXCLUDED.total_amount,
          addons = EXCLUDED.addons;
      `;
    } catch (neonErr) {}

    try {
      await supabase.from("orders").upsert(newOrder, { onConflict: "id" });
    } catch (sbErr) {}

    const courierMap = await getOrderCouriersMap();
    courierMap[newId] = {
      ...(courierMap[newId] || {}),
      courierId: orderData.courierId,
      courierName: orderData.courierName,
      deliveredAt: orderData.deliveredAt,
      status: orderData.status,
      addons: orderData.addons || orderData.selectedExtras || [],
      usedPoints: orderData.usedPoints || orderData.used_points || null,
      pointsDiscount: orderData.pointsDiscount || orderData.points_discount || null,
      discountAmount: orderData.discountAmount || orderData.discount_amount || null,
    };
    await saveOrderCouriersMap(courierMap);

    // Send Order Received Email automatically to customer
    if (newOrder.customer_email) {
      try {
        const { sendTransactionalEmail, getOrderReceivedHtml } = await import("@/lib/email-service");
        const mailHtml = getOrderReceivedHtml({
          id: newOrder.id,
          customerName: newOrder.customer_name,
          recipientName: newOrder.recipient_name,
          recipientPhone: newOrder.recipient_phone,
          address: newOrder.address,
          deliveryDate: newOrder.delivery_date,
          deliveryTime: newOrder.delivery_time,
          totalAmount: newOrder.total_amount,
          items: newOrder.items,
          addons: newOrder.addons
        });
        sendTransactionalEmail({
          to: newOrder.customer_email,
          subject: `🌸 Siparişiniz Alındı - #${newOrder.id}`,
          html: mailHtml,
        }).catch(() => {});
      } catch (e) {}
    }

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json({ error: "Sipariş veritabanına kaydedilemedi." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = sanitizeObject(await request.json());
    const {
      id,
      status,
      preparedPhoto,
      preparedPhotoTime,
      customerApprovalStatus,
      rejectionReason,
      courierId,
      courierName,
      deliveredAt,
      deliveredPhoto,
      deliveryNote,
      updateRequest,
      recipientName,
      recipientPhone,
      address,
      deliveryDate,
      deliveryTime,
      customerEmail
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Sipariş ID gereklidir." }, { status: 400 });
    }

    const courierMap = await getOrderCouriersMap();
    const { data: existingOrder } = await supabase.from("orders").select("*").eq("id", id).single();
    const existingMeta = parseOrderMeta(existingOrder || {}, courierMap[id] || {});

    const nowIso = new Date().toISOString();
    let finalPreparedPhotoTime = preparedPhotoTime;
    if ((status === "Fotoğraflı Onay Bekliyor" || preparedPhoto) && !finalPreparedPhotoTime) {
      finalPreparedPhotoTime = existingMeta.preparedPhotoTime || nowIso;
    }

    const updatedMetaObj: any = {
      status: customerApprovalStatus !== undefined ? customerApprovalStatus : existingMeta.customerApprovalStatus,
      photoTime: finalPreparedPhotoTime !== undefined ? finalPreparedPhotoTime : existingMeta.preparedPhotoTime,
      courierId: courierId !== undefined ? courierId : existingMeta.courierId,
      courierName: courierName !== undefined ? courierName : existingMeta.courierName,
      deliveredAt: deliveredAt !== undefined ? deliveredAt : existingMeta.deliveredAt,
      deliveredPhoto: deliveredPhoto !== undefined ? deliveredPhoto : existingMeta.deliveredPhoto,
      deliveryNote: deliveryNote !== undefined ? deliveryNote : existingMeta.deliveryNote,
      rejectionReason: rejectionReason !== undefined ? rejectionReason : existingMeta.rejectionReason,
      updateRequest: updateRequest !== undefined ? updateRequest : existingMeta.updateRequest
    };

    const updatePayload: any = {
      customer_approval_status: JSON.stringify(updatedMetaObj)
    };

    if (status !== undefined) updatePayload.status = status;
    if (preparedPhoto !== undefined) updatePayload.prepared_photo = preparedPhoto;
    if (recipientName !== undefined) updatePayload.recipient_name = recipientName;
    if (recipientPhone !== undefined) updatePayload.recipient_phone = recipientPhone;
    if (address !== undefined) updatePayload.address = address;
    if (deliveryDate !== undefined) updatePayload.delivery_date = deliveryDate;
    if (deliveryTime !== undefined) updatePayload.delivery_time = deliveryTime;

    try {
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS prepared_photo TEXT;`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_approval_status TEXT;`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_id TEXT;`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name TEXT;`;
    } catch (e) {}

    try {
      await sql`
        UPDATE orders SET
          status = COALESCE(${status !== undefined ? status : null}, status),
          prepared_photo = COALESCE(${preparedPhoto !== undefined ? preparedPhoto : null}, prepared_photo),
          customer_approval_status = COALESCE(${JSON.stringify(updatedMetaObj)}, customer_approval_status),
          recipient_name = COALESCE(${recipientName !== undefined ? recipientName : null}, recipient_name),
          recipient_phone = COALESCE(${recipientPhone !== undefined ? recipientPhone : null}, recipient_phone),
          address = COALESCE(${address !== undefined ? address : null}, address),
          delivery_date = COALESCE(${deliveryDate !== undefined ? deliveryDate : null}, delivery_date),
          delivery_slot = COALESCE(${deliveryTime !== undefined ? deliveryTime : null}, delivery_slot),
          courier_name = COALESCE(${courierName !== undefined ? courierName : null}, courier_name)
        WHERE id = ${String(id)};
      `;
    } catch (neonErr) {
      console.error("Neon PUT update error:", neonErr);
    }

    // DIRECT SUPABASE ORDERS TABLE UPDATE (Only using valid columns)
    try {
      await supabase.from("orders").update(updatePayload).eq("id", id);
    } catch (sbErr) {}

    // Trigger NetGSM Automatic SMS Notification if status changed OR prepared photo uploaded
    const targetPhone = existingOrder?.customer_phone || existingOrder?.customerPhone || existingOrder?.recipient_phone;
    const custName = existingOrder?.customer_name || existingOrder?.customerName || "Müşterimiz";

    if (targetPhone) {
      const cleanPhone = String(targetPhone).replace(/[^0-9]/g, "");
      let msg = "";

      if (preparedPhoto && preparedPhoto !== existingOrder?.prepared_photo) {
        const trackingLink = `https://cicekce-yeni-two.vercel.app/siparis-takip?orderId=${id}&phone=${encodeURIComponent(cleanPhone.slice(-7))}`;
        msg = `Sayin ${custName}, ${id} nolu siparisinizin hazirlanan cicek fotografi yuklenmistir. Fotografinizi incelemek ve onaylamak icin tiklayin: ${trackingLink} Cicekce`;
      } else if (status && status !== existingOrder?.status) {
        if (status === "Fotoğraflı Onay Bekliyor") {
          const trackingLink = `https://cicekce-yeni-two.vercel.app/siparis-takip?orderId=${id}&phone=${encodeURIComponent(cleanPhone.slice(-7))}`;
          msg = `Sayin ${custName}, ${id} nolu siparisinizin cicek fotografi yuklenmistir. Onaylamak icin tiklayin: ${trackingLink} Cicekce`;
        } else if (status === "Hazırlanıyor" || status === "Hazırlanıyor / Onaylandı") {
          msg = `Sayin ${custName}, ${id} nolu cicek siparisiniz ozenle hazirlanmaya baslanmistir. Cicekce`;
        } else if (status === "Kuryede / Dağıtımda") {
          msg = `Sayin ${custName}, ${id} nolu siparisiniz kuryemiz tarafindan teslimat adresine yola cikarilmistir. Cicekce`;
        } else if (status === "Teslim Edildi") {
          msg = `Sayin ${custName}, ${id} nolu cicek siparisiniz alicisina basariyla teslim edilmistir. Bizi tercih ettiginiz icin tesekkur ederiz. Cicekce`;
        }
      }

      if (msg) {
        import("@/lib/netgsm-sms").then(({ sendNetgsmSms }) => {
          sendNetgsmSms({ phone: targetPhone, message: msg }).catch(() => {});
        });
      }
    }

    // Trigger Automatic E-Posta Notification based on status / prepared photo
    const targetEmail = customerEmail || body.customer_email || existingOrder?.customer_email || existingOrder?.customerEmail || courierMap[id]?.customerEmail || courierMap[id]?.customer_email;
    if (targetEmail) {
      try {
        const { sendTransactionalEmail, getPhotoApprovalHtml, getCourierNoticeHtml, getDeliveredNoticeHtml, getPreparingNoticeHtml } = await import("@/lib/email-service");
        const mergedObj = {
          id,
          customerName: custName,
          recipientName: existingOrder?.recipient_name || existingOrder?.recipientName || "Alıcı Müşteri",
          recipientPhone: existingOrder?.recipient_phone || existingOrder?.recipientPhone || "",
          address: existingOrder?.address || "",
          deliveryDate: existingOrder?.delivery_date || existingOrder?.deliveryDate || "Bugün",
          deliveryTime: existingOrder?.delivery_time || existingOrder?.deliveryTime || "15:00 - 18:00",
          preparedPhoto: preparedPhoto || existingOrder?.prepared_photo,
          deliveredPhoto: deliveredPhoto || existingOrder?.delivered_photo
        };

        if (preparedPhoto) {
          sendTransactionalEmail({
            to: targetEmail,
            subject: `📸 Çiçeğiniz Hazırlandı! Görsel Onayı Bekliyor - #${id}`,
            html: getPhotoApprovalHtml(mergedObj),
          }).catch(() => {});
        } else if (status) {
          if (status.includes("Hazırlanıyor")) {
            sendTransactionalEmail({
              to: targetEmail,
              subject: `💐 Çiçeğiniz Hazırlanıyor - #${id}`,
              html: getPreparingNoticeHtml(mergedObj),
            }).catch(() => {});
          } else if (status.includes("Kuryede") || status.includes("Dağıtımda")) {
            sendTransactionalEmail({
              to: targetEmail,
              subject: `🛵 Çiçeğiniz Kuryede! Sipariş #${id} Yolda`,
              html: getCourierNoticeHtml(mergedObj),
            }).catch(() => {});
          } else if (status === "Teslim Edildi") {
            sendTransactionalEmail({
              to: targetEmail,
              subject: `✅ Çiçeğiniz Teslim Edildi! 50 ÇiçekPuan Kazanın - #${id}`,
              html: getDeliveredNoticeHtml(mergedObj),
            }).catch(() => {});
          }
        }
      } catch (e) {}
    }

    // Backup update to courierMap memory
    courierMap[id] = {
      ...(courierMap[id] || {}),
      ...(courierId !== undefined ? { courierId } : {}),
      ...(courierName !== undefined ? { courierName } : {}),
      ...(deliveredAt !== undefined ? { deliveredAt } : {}),
      ...(deliveredPhoto !== undefined ? { deliveredPhoto } : {}),
      ...(deliveryNote !== undefined ? { deliveryNote } : {}),
      ...(preparedPhoto !== undefined ? { preparedPhoto } : {}),
      ...(finalPreparedPhotoTime ? { preparedPhotoTime: finalPreparedPhotoTime } : {}),
      ...(customerApprovalStatus !== undefined ? { customerApprovalStatus } : {}),
      ...(rejectionReason !== undefined ? { rejectionReason } : {}),
      ...(updateRequest !== undefined ? { updateRequest } : {}),
      ...(status !== undefined ? { status } : {})
    };
    await saveOrderCouriersMap(courierMap);

    return NextResponse.json({ success: true, id, order: courierMap[id] });
  } catch (error: any) {
    console.error("PUT /api/orders error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authorized = await isRequestAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Bu işlem için admin yetkisi gereklidir." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      try {
        await sql`DELETE FROM orders WHERE id = ${String(id)}`;
      } catch (neonErr) {}
      try {
        await supabase.from("orders").delete().eq("id", id);
      } catch (sbErr) {}
      const courierMap = await getOrderCouriersMap();
      delete courierMap[id];
      await saveOrderCouriersMap(courierMap);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete order from Supabase" }, { status: 500 });
  }
}
