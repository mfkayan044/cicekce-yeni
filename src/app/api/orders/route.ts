import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
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
      const cleanPhone = phone ? phone.replace(/[^0-9]/g, "") : "";

      const { data: order, error } = await supabase.from("orders").select("*").eq("id", cleanInputId).single();
      if (error || !order) {
        return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
      }

      // SECURITY ENFORCEMENT:
      // Single order public lookup MUST require matching customer_phone/recipient_phone OR valid HMAC tracking token!
      const custPhoneClean = String(order.customer_phone || order.customerPhone || "").replace(/[^0-9]/g, "");
      const recipPhoneClean = String(order.recipient_phone || order.recipientPhone || "").replace(/[^0-9]/g, "");

      const matchesCustomer = cleanPhone && cleanPhone.length >= 4 && custPhoneClean && (custPhoneClean.endsWith(cleanPhone) || cleanPhone.endsWith(custPhoneClean));
      const matchesRecipient = cleanPhone && cleanPhone.length >= 4 && recipPhoneClean && (recipPhoneClean.endsWith(cleanPhone) || cleanPhone.endsWith(recipPhoneClean));

      const isTokenValidCust = token && (await verifyTrackingToken(order.id, custPhoneClean, token));
      const isTokenValidRecip = token && (await verifyTrackingToken(order.id, recipPhoneClean, token));

      if (!isTokenValidCust && !isTokenValidRecip && (!cleanPhone || (!matchesCustomer && !matchesRecipient))) {
        return NextResponse.json(
          { error: "Güvenlik Uyarısı: Sipariş takibi yapabilmek için Sipariş Kodu ile birlikte siparişte kayıtlı Telefon Numarasını girmelisiniz veya güvenli takip bağlantısını kullanmalısınız." },
          { status: 403 }
        );
      }

      const courierMap = await getOrderCouriersMap();
      const extra = courierMap[order.id] || memoryCourierMap[order.id] || {};
      const meta = parseOrderMeta(order, extra);

      return NextResponse.json({
        id: order.id,
        date: order.date,
        status: order.status || extra.status || "Yeni Sipariş",
        customerName: order.customer_name || order.customerName,
        customerPhone: order.customer_phone || order.customerPhone,
        recipientName: order.recipient_name || order.recipientName,
        recipientPhone: order.recipient_phone || order.recipientPhone,
        address: order.address,
        deliveryDate: order.delivery_date || order.deliveryDate,
        deliveryTime: order.delivery_time || order.deliveryTime,
        items: order.items || [],
        addons: order.addons || [],
        cardNote: order.card_note || order.cardNote,
        isAnonymous: order.is_anonymous === true,
        paymentMethod: order.payment_method || order.paymentMethod,
        totalAmount: order.total_amount || order.totalAmount,
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
    const [{ data: orders, error }, courierMap] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      getOrderCouriersMap()
    ]);

    if (error) throw error;

    const nowMs = Date.now();
    const formatted = (orders || []).map((o: any) => {
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

      return {
        id: o.id,
        date: o.date,
        status,
        customerName: o.customer_name || o.customerName,
        customerPhone: o.customer_phone || o.customerPhone,
        customerEmail: o.customer_email || o.customerEmail,
        recipientName: o.recipient_name || o.recipientName,
        recipientPhone: o.recipient_phone || o.recipientPhone,
        address: o.address,
        deliveryDate: o.delivery_date || o.deliveryDate,
        deliveryTime: o.delivery_time || o.deliveryTime,
        items: o.items || [],
        addons: o.addons || [],
        cardNote: o.card_note || o.cardNote,
        isAnonymous: o.is_anonymous === true,
        paymentMethod: o.payment_method || o.paymentMethod,
        totalPrice: o.total_amount || o.totalPrice,
        totalAmount: o.total_amount || o.totalAmount,
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
      addons: orderData.addons || [],
      card_note: orderData.cardNote || orderData.card_note || "",
      is_anonymous: orderData.isAnonymous === true,
      payment_method: orderData.paymentMethod || orderData.payment_method || "Kredi Kartı",
      total_amount: orderData.totalAmount || orderData.totalPrice || "0 ₺",
      prepared_photo: orderData.preparedPhoto || null,
      customer_approval_status: orderData.customerApprovalStatus || "Bekliyor"
    };

    const { data, error } = await supabase.from("orders").upsert(newOrder, { onConflict: "id" }).select().single();
    if (error) throw error;

    if (orderData.courierId || orderData.courierName || orderData.deliveredAt) {
      const courierMap = await getOrderCouriersMap();
      courierMap[newId] = {
        courierId: orderData.courierId,
        courierName: orderData.courierName,
        deliveredAt: orderData.deliveredAt,
        status: orderData.status
      };
      await saveOrderCouriersMap(courierMap);
    }

    return NextResponse.json(data, { status: 201 });
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
      deliveryTime
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

    // DIRECT SUPABASE ORDERS TABLE UPDATE (Only using valid columns)
    const { error: dbError } = await supabase.from("orders").update(updatePayload).eq("id", id);
    if (dbError) {
      console.error("Supabase orders table update error:", dbError);
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
      await supabase.from("orders").delete().eq("id", id);
      const courierMap = await getOrderCouriersMap();
      delete courierMap[id];
      await saveOrderCouriersMap(courierMap);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete order from Supabase" }, { status: 500 });
  }
}
