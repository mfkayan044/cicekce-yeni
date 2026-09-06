import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isRequestAuthorized, verifyTrackingToken, generateTrackingToken } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeObject, sanitizeString } from "@/lib/sanitize";

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
      const extra = courierMap[order.id] || {};

      const preparedPhoto = extra.preparedPhoto || order.prepared_photo || order.preparedPhoto || "";
      const customerApprovalStatus = extra.customerApprovalStatus || order.customer_approval_status || "Bekliyor";
      const deliveredPhoto = extra.deliveredPhoto || order.delivered_photo || "";
      const deliveryNote = extra.deliveryNote || order.delivery_note || "";

      return NextResponse.json({
        id: order.id,
        date: order.date,
        status: extra.status || order.status || "Yeni Sipariş",
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
        preparedPhoto,
        preparedPhotoTime: extra.preparedPhotoTime || order.prepared_photo_time || "",
        customerApprovalStatus,
        courierId: extra.courierId || order.courier_id || "",
        courierName: extra.courierName || order.courier_name || "",
        deliveredAt: extra.deliveredAt || order.delivered_at || "",
        deliveredPhoto,
        deliveryNote,
        updateRequest: extra.updateRequest || order.update_request || null
      });
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

      const preparedPhoto = extra.preparedPhoto || o.prepared_photo || o.preparedPhoto || "";
      let customerApprovalStatus = extra.customerApprovalStatus || o.customer_approval_status || o.customerApprovalStatus || "Bekliyor";
      const preparedPhotoTime = extra.preparedPhotoTime || o.prepared_photo_time;

      // 15-Minute Auto-Approval Check Engine:
      let currentStatus = extra.status || o.status || "Yeni Sipariş";
      const photoTime = preparedPhotoTime || o.prepared_photo_time || extra.photoTime || o.created_at;

      if ((currentStatus === "Fotoğraflı Onay Bekliyor" || preparedPhoto) && (customerApprovalStatus === "Bekliyor" || !customerApprovalStatus)) {
        const photoTimeMs = photoTime ? new Date(photoTime).getTime() : 0;
        if (photoTimeMs > 0) {
          const photoAgeMs = nowMs - photoTimeMs;
          if (photoAgeMs >= 15 * 60 * 1000) {
            customerApprovalStatus = "Sistem Tarafından Onaylandı (15 dk Süre Doldu)";
            if (currentStatus === "Fotoğraflı Onay Bekliyor") {
              currentStatus = "Hazırlanıyor / Onaylandı";
            }
            // Auto persist to memory/courierMap
            courierMap[o.id] = {
              ...(courierMap[o.id] || {}),
              customerApprovalStatus,
              status: currentStatus
            };
          }
        }
      }

      // If approved by customer or system, update status
      if ((customerApprovalStatus.includes("Onaylandı") || customerApprovalStatus === "Onaylandı") && currentStatus === "Fotoğraflı Onay Bekliyor") {
        currentStatus = "Hazırlanıyor / Onaylandı";
      }

      const status = (extra.status === "Teslim Edildi" || extra.status === "Kuryede / Dağıtımda")
        ? extra.status
        : currentStatus;

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
        rejectionCount: extra.rejectionCount !== undefined ? extra.rejectionCount : (o.rejection_count || 0),
        rejectionReason: extra.rejectionReason || o.rejection_reason || "",
        courierId: extra.courierId || o.courier_id || "",
        courierName: extra.courierName || o.courier_name || "",
        deliveredAt: extra.deliveredAt || o.delivered_at || "",
        deliveredPhoto: extra.deliveredPhoto || o.delivered_photo || "",
        deliveryNote: extra.deliveryNote || o.delivery_note || "",
        updateRequest: extra.updateRequest || o.update_request || null
      };
    });

    return NextResponse.json(formatted);
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
      rejectionCount,
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

    const updatePayload: any = {};
    const nowIso = new Date().toISOString();
    let finalPreparedPhotoTime = preparedPhotoTime;
    if ((status === "Fotoğraflı Onay Bekliyor" || preparedPhoto) && !finalPreparedPhotoTime) {
      finalPreparedPhotoTime = nowIso;
    }

    if (status !== undefined) updatePayload.status = status;
    if (preparedPhoto !== undefined) updatePayload.prepared_photo = preparedPhoto;
    if (customerApprovalStatus !== undefined) updatePayload.customer_approval_status = customerApprovalStatus;
    if (finalPreparedPhotoTime) updatePayload.prepared_photo_time = finalPreparedPhotoTime;
    if (courierId !== undefined) updatePayload.courier_id = courierId;
    if (courierName !== undefined) updatePayload.courier_name = courierName;
    if (deliveredAt !== undefined) updatePayload.delivered_at = deliveredAt;
    if (deliveredPhoto !== undefined) updatePayload.delivered_photo = deliveredPhoto;
    if (deliveryNote !== undefined) updatePayload.delivery_note = deliveryNote;
    if (recipientName !== undefined) updatePayload.recipient_name = recipientName;
    if (recipientPhone !== undefined) updatePayload.recipient_phone = recipientPhone;
    if (address !== undefined) updatePayload.address = address;
    if (deliveryDate !== undefined) updatePayload.delivery_date = deliveryDate;
    if (deliveryTime !== undefined) updatePayload.delivery_time = deliveryTime;

    if (Object.keys(updatePayload).length > 0) {
      try {
        await supabase.from("orders").update(updatePayload).eq("id", id);
      } catch (dbErr) {
        console.error("Orders table update error:", dbErr);
      }
    }

    const courierMap = await getOrderCouriersMap();
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
      ...(rejectionCount !== undefined ? { rejectionCount } : {}),
      ...(rejectionReason !== undefined ? { rejectionReason } : {}),
      ...(updateRequest !== undefined ? { updateRequest } : {}),
      ...(recipientName !== undefined ? { recipientName } : {}),
      ...(recipientPhone !== undefined ? { recipientPhone } : {}),
      ...(address !== undefined ? { address } : {}),
      ...(deliveryDate !== undefined ? { deliveryDate } : {}),
      ...(deliveryTime !== undefined ? { deliveryTime } : {}),
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
