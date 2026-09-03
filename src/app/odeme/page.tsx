"use client";

import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import { useStore } from "@/lib/store";
import { useState, useEffect } from "react";
import Link from "next/link";
import { trackPurchase } from "@/components/analytics/AnalyticsTracker";
import { initialDbData } from "@/lib/initial-db";
import { getStoredMember } from "@/lib/member-auth";

// Robust Turkish Price Parser ("3.510 ₺" -> 3510)
function parseTurkishPrice(priceStr: any): number {
  if (!priceStr) return 0;
  if (typeof priceStr === "number") return priceStr;
  const cleaned = String(priceStr)
    .replace(/\./g, "")      // Remove thousand dots e.g. 3.510 -> 3510
    .replace(",", ".")       // Replace decimal comma with dot
    .replace(/[^0-9.]/g, ""); // Remove TL and non-numeric symbols
  return parseFloat(cleaned) || 0;
}

export default function CheckoutPage() {
  const [isMounted, setIsMounted] = useState(false);
  const { cart, clearCart } = useStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Active Checkout Step: 1 = Alıcı & Teslimat, 2 = Ek Ürünler, 3 = Fatura, 4 = Mesaj Kartı, 5 = Ödeme
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [cartSessionId] = useState<string>(
    () => `TSL-2026-${Math.floor(100000 + Math.random() * 900000)}`
  );

  const initialCities = (initialDbData?.cities || []).filter((c: any) => c.active !== false);
  const defaultCity = initialCities[0] || { id: "34", name: "İstanbul", districts: [] };
  const defaultDistricts = (defaultCity.districts || []).filter((d: any) => d.active !== false);
  const defaultDistrict = defaultDistricts[0] || { id: "d_1", name: "Kadıköy", neighborhoods: [] };
  const defaultNeighborhoods = (defaultDistrict.neighborhoods || []).filter((n: any) => n.active !== false);
  const defaultNeigh = defaultNeighborhoods[0] || { id: "n_1", name: "Moda Mah." };

  // Active Regions from API (Pre-populated from initial DB to prevent any flicker)
  const [activeCities, setActiveCities] = useState<any[]>(initialCities);
  const [loadingRegions, setLoadingRegions] = useState(false);

  // Step 1: Alıcı & Teslimat Adresi State
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [selectedCityId, setSelectedCityId] = useState(String(defaultCity.id));
  const [selectedDistrictId, setSelectedDistrictId] = useState(String(defaultDistrict.id));
  const [selectedNeighId, setSelectedNeighId] = useState(String(defaultNeigh.id));
  const [fullAddressDetails, setFullAddressDetails] = useState("");
  const [companySchool, setCompanySchool] = useState("");

  // Logged-in member saved addresses state
  const [loggedMember, setLoggedMember] = useState<any>(null);
  const [selectedSavedAddrId, setSelectedSavedAddrId] = useState<string>("");
  const [saveNewAddressToProfile, setSaveNewAddressToProfile] = useState<boolean>(false);
  const [newAddressTitle, setNewAddressTitle] = useState<string>("");

  // Step 2: Live Ek Ürünler State (Fetched from /api/extras)
  const [adminExtras, setAdminExtras] = useState<any[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);

  // Step 3: Fatura Bilgileri State
  const [billingType, setBillingType] = useState<"bireysel" | "kurumsal">("bireysel");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [taxOffice, setTaxOffice] = useState("");
  const [taxNo, setTaxNo] = useState("");

  // Step 4: Mesaj Kartı State & Ready Templates
  const [cardNote, setCardNote] = useState("");
  const [cardCategory, setCardCategory] = useState("Aşk & Romantik");
  const [supabaseCardNotes, setSupabaseCardNotes] = useState<any[]>([]);
  const [isAnonymousSender, setIsAnonymousSender] = useState(false);

  useEffect(() => {
    fetch("/api/card-notes")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSupabaseCardNotes(data);
      })
      .catch(() => {});
  }, []);

  // Ready-to-use message card templates per category
  const cardTemplates: Record<string, string[]> = {
    "Aşk & Romantik": [
      "Hayatımın anlamı, varlığınla günlerime güzellik ve huzur katıyorsun. Seni çok seviyorum!",
      "Aşkımız bu güller gibi her geçen gün daha da açsın, hiç solmasın sevgilim.",
      "Gülüşün kalbimi aydınlatan en güzel ışık. İyi ki hayatımdasın, seni çok seviyorum."
    ],
    "Doğum Günü": [
      "İyi ki doğdun hayatımın anlamı! Yeni yaşında tüm dileklerin gerçek, mutluluğun daim olsun.",
      "Nice birlikte mutlu, huzurlu ve kahkaha dolu yıllara. Doğum günün kutlu olsun!",
      "Dünyanın en tatlı insanına... Yeni yaşın sana sağlık ve sonsuz neşe getirsin."
    ],
    "Özür": [
      "Seni üzdüğüm için gerçekten çok üzgünüm. Lütfen beni bağışla, sen benim için çok değerlisin.",
      "Kalbini kırmak istediğim en son şeydi. Özür dilerim sevgilim, bu çiçekler pişmanlığımın simgesidir."
    ],
    "Yeni Bebek": [
      "Minik mucizenizin dünyaya gelişi kutlu olsun! Bebeğinize ve size sağlık, mutluluk ve uzun ömürler dileriz.",
      "Ailenize katılan bu tatlı melek hayatınıza neşe katsın. Tebrik ederiz!"
    ],
    "Geçmiş Olsun": [
      "Çok geçmiş olsun! En kısa sürede sağlığına kavuşup aramıza dönmeni diliyorum.",
      "Dualarımız ve kalbimiz seninle. Acil şifalar dilerim!"
    ],
    "Genel": [
      "Gününüz bu taze çiçekler kadar renkli ve güzel geçsin. Sevgilerimle!",
      "Aklımdasın ve kalbimdesin. Yüzünde küçük bir tebessüm oluşturabilmek dileğiyle..."
    ]
  };

  // Step 5: Ödeme Yöntemi State
  const [paymentMethod, setPaymentMethod] = useState<"card" | "iban" | "cash" | "whatsapp">("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Coupon Discount States
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCouponName, setAppliedCouponName] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    setCouponSuccess("");
    const codeClean = couponCodeInput.trim().toUpperCase();
    if (!codeClean) {
      setCouponError("Lütfen kupon kodu giriniz.");
      return;
    }

    // Calculate 10% or 20% discount based on coupon code
    const totalBefore = (mainCartTotal || 2510) + (addonsTotal || 0);
    if (codeClean === "HOSGELDIN100" || codeClean === "HOSGELDIN") {
      const disc = Math.round(totalBefore * 0.10);
      setDiscountAmount(disc);
      setAppliedCouponName(`${codeClean} (%10 İndirim)`);
      setCouponSuccess(`'${disc} ₺' tutarında indirim uygulandı!`);
    } else if (codeClean === "CICEK20" || codeClean === "SEVGILILER20") {
      const disc = Math.round(totalBefore * 0.20);
      setDiscountAmount(disc);
      setAppliedCouponName(`${codeClean} (%20 İndirim)`);
      setCouponSuccess(`'${disc} ₺' tutarında indirim uygulandı!`);
    } else {
      const disc = Math.round(totalBefore * 0.10);
      setDiscountAmount(disc);
      setAppliedCouponName(`${codeClean} (%10 İndirim)`);
      setCouponSuccess(`'${codeClean}' kuponu aktif edildi!`);
    }
  };

  const handleRemoveCoupon = () => {
    setDiscountAmount(0);
    setAppliedCouponName("");
    setCouponCodeInput("");
    setCouponSuccess("");
    setCouponError("");
  };

  // Fetch active regions and live admin extras, AND match selected user address (POINT 2 FIX)
  useEffect(() => {
    async function loadData() {
      try {
        const [regRes, extRes] = await Promise.all([
          fetch("/api/regions?storefront=true"),
          fetch("/api/extras")
        ]);

        if (regRes.ok) {
          const data = await regRes.json();
          setActiveCities(data);

          // Read saved address from product detail page choice if available
          const savedAddr = typeof window !== "undefined" ? localStorage.getItem("pro_flower_delivery_address") : null;
          if (savedAddr && data && data.length > 0) {
            const parts = savedAddr.split("/");
            const cName = parts[0]?.trim();
            const dName = parts[1]?.trim();
            const nName = parts[2]?.split("-")[0]?.trim();

            const targetCity = data.find((c: any) => c.name.toLowerCase() === cName?.toLowerCase()) || data[0];
            setSelectedCityId(String(targetCity.id));

            const districts = targetCity.districts || [];
            const targetDist = districts.find((d: any) => d.name.toLowerCase() === dName?.toLowerCase()) || districts[0];
            if (targetDist) {
              setSelectedDistrictId(String(targetDist.id));
              const neighs = targetDist.neighborhoods || [];
              const targetNeigh = neighs.find((n: any) => n.name.toLowerCase().includes(nName?.toLowerCase() || "")) || neighs[0];
              if (targetNeigh) setSelectedNeighId(String(targetNeigh.id));
            }
          }
        }

        if (extRes.ok) {
          const extData = await extRes.json();
          setAdminExtras(extData);
        }

        // Prefill sender details from logged-in member
        const mem = getStoredMember();
        if (mem) {
          setLoggedMember(mem);
          if (mem.name) setSenderName(mem.name);
          if (mem.email) setSenderEmail(mem.email);
          if (mem.phone) setSenderPhone(mem.phone);
        }
      } catch (e) {
      } finally {
        setLoadingRegions(false);
      }
    }
    loadData();
  }, []);

  // Apply member's saved address to form
  const applySavedAddress = (addr: any) => {
    setSelectedSavedAddrId(addr.id);
    if (addr.fullAddress) setFullAddressDetails(addr.fullAddress);

    const targetCity = activeCities.find((c) => c.name.toLowerCase() === (addr.city || "").toLowerCase()) || activeCities[0];
    if (targetCity) {
      setSelectedCityId(String(targetCity.id));
      const districts = targetCity.districts || [];
      const targetDist = districts.find((d: any) => d.name.toLowerCase() === (addr.district || "").toLowerCase()) || districts[0];
      if (targetDist) {
        setSelectedDistrictId(String(targetDist.id));
        const neighs = targetDist.neighborhoods || [];
        const targetNeigh = neighs.find((n: any) => n.name.toLowerCase().includes((addr.neighborhood || "").toLowerCase())) || neighs[0];
        if (targetNeigh) setSelectedNeighId(String(targetNeigh.id));
      }
    }
  };

  // Sample or Admin Addon Products
  const displayAddons = adminExtras.length > 0 ? adminExtras.map((ex: any) => ({
    id: ex.id,
    name: ex.names?.tr || ex.name || "Ek Hediye",
    price: parseTurkishPrice(ex.price) || 200,
    image: ex.image || "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300"
  })) : [
    { id: "a1", name: "Kutu Çikolata", price: 1000, image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300" },
    { id: "a2", name: "Sevimli Peluş Ayı (30 cm)", price: 450, image: "https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=300" },
    { id: "a3", name: "Kişiye Özel Doğum Günü Kartı", price: 150, image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=300" },
  ];

  // Multi-item Cart items resolution
  const cartItemsToUse = cart && cart.length > 0 ? cart : [
    {
      product: {
        id: "default_gerbera",
        title: "7 Kırmızı Gül ve Papatyalar",
        price: "2.510 ₺",
        image: "https://demo.procicek.com.tr/urunler/7-kirmizi-gul-ve-beyaz-bicme-179-v2.webp"
      },
      quantity: 1,
      selectedExtras: []
    }
  ];

  const mainCartTotal = cartItemsToUse.reduce((sum: number, item: any) => {
    const prod = item.product || item;
    const priceVal = parseTurkishPrice(prod.price || item.price || "2.510 ₺");
    const qtyVal = item.quantity || 1;
    const extrasVal = (item.selectedExtras || []).reduce(
      (eSum: number, e: any) => eSum + (parseTurkishPrice(e.price) || 0),
      0
    );
    return sum + (priceVal + extrasVal) * qtyVal;
  }, 0);

  // Active City, District & Neighborhood resolution for Step 1
  const currentCityObj = activeCities.find((c) => String(c.id) === String(selectedCityId));
  const currentDistricts = currentCityObj?.districts || [];
  const currentDistrictObj = currentDistricts.find((d: any) => String(d.id) === String(selectedDistrictId));
  const currentNeighborhoods = currentDistrictObj?.neighborhoods || [];
  const currentNeighObj = currentNeighborhoods.find((n: any) => String(n.id) === String(selectedNeighId));

  const deliveryFee = Number(currentDistrictObj?.deliveryFee || currentDistrictObj?.extraFee || currentCityObj?.deliveryFee || 0);
  const addonsTotal = selectedAddons.reduce((sum: number, item: any) => sum + (item.price || 0), 0);
  const grandTotal = Math.max(0, mainCartTotal + addonsTotal + deliveryFee - discountAmount);

  const constructedDeliveryAddress = currentCityObj && currentDistrictObj && currentNeighObj
    ? `${currentCityObj.name} / ${currentDistrictObj.name} / ${currentNeighObj.name}${fullAddressDetails ? " - " + fullAddressDetails : ""}`
    : "Lütfen Teslimat Adresinizi Seçiniz";

  // Handle City Change
  const handleCityChange = (cId: string) => {
    setSelectedCityId(cId);
    const c = activeCities.find((ct) => String(ct.id) === String(cId));
    if (c && c.districts && c.districts.length > 0) {
      setSelectedDistrictId(c.districts[0].id);
      if (c.districts[0].neighborhoods && c.districts[0].neighborhoods.length > 0) {
        setSelectedNeighId(c.districts[0].neighborhoods[0].id);
      } else {
        setSelectedNeighId("");
      }
    } else {
      setSelectedDistrictId("");
      setSelectedNeighId("");
    }
  };

  // POINT 2 FIX: Handle District Change (Cleanly updates district & first neighborhood)
  const handleDistrictChange = (dId: string) => {
    setSelectedDistrictId(dId);
    const d = currentDistricts.find((dist: any) => String(dist.id) === String(dId));
    if (d && d.neighborhoods && d.neighborhoods.length > 0) {
      setSelectedNeighId(d.neighborhoods[0].id);
    } else {
      setSelectedNeighId("");
    }
  };

  const stepNames: Record<number, string> = {
    1: "Adım 1: Alıcı & Teslimat",
    2: "Adım 2: Ek Ürünler",
    3: "Adım 3: Fatura Bilgileri",
    4: "Adım 4: Mesaj Kartı",
    5: "Adım 5: Ödeme Yöntemi"
  };

  const syncAbandonedCart = (targetStep: number) => {
    try {
      const mainProd = cartItemsToUse[0]?.product || cartItemsToUse[0] || {};
      const payload = {
        cartNo: cartSessionId,
        customerName: senderName || recipientName || "Misafir Müşteri",
        phone: senderPhone || recipientPhone || "",
        recipientName: recipientName || "",
        recipientPhone: recipientPhone || "",
        address: constructedDeliveryAddress,
        product: mainProd.title || "Çiçek Buketi",
        step: stepNames[targetStep] || `Adım ${targetStep}`,
        total: `${grandTotal.toLocaleString("tr-TR")} ₺`,
        items: cartItemsToUse.map((it: any) => ({
          title: (it.product || it).title || "Çiçek",
          price: (it.product || it).price || "0 ₺",
          quantity: it.quantity || 1,
        })),
        addons: selectedAddons.map((a: any) => ({
          name: a.name,
          price: typeof a.price === "number" ? `${a.price} ₺` : a.price,
          image: a.image
        })),
      };

      fetch("/api/abandoned-carts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch (e) {}
  };

  useEffect(() => {
    if (isMounted) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      syncAbandonedCart(step);
    }
  }, [step, isMounted, recipientName, recipientPhone, senderName, senderPhone, selectedAddons]);

  // Step 1 Validation & Proceed
  const handleStep1Proceed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !recipientPhone.trim()) {
      alert("Lütfen alıcı adı soyadı ve telefon numarasını doldurunuz.");
      return;
    }
    if (!selectedCityId || !selectedDistrictId || !selectedNeighId) {
      alert("Lütfen teslimat şehir, ilçe ve mahalle seçiminizi yapınız.");
      return;
    }

    // If user checked "Save address to profile", update member in database
    if (saveNewAddressToProfile && newAddressTitle.trim() && loggedMember) {
      const newAddr = {
        id: `addr_${Date.now()}`,
        title: newAddressTitle.trim(),
        city: currentCityObj?.name || "İstanbul",
        district: currentDistrictObj?.name || "",
        neighborhood: currentNeighObj?.name || "",
        fullAddress: fullAddressDetails,
      };
      const updatedAddresses = [...(loggedMember.addresses || []), newAddr];
      fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: loggedMember.id,
          updatedData: { addresses: updatedAddresses },
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.member) {
            setLoggedMember(data.member);
          }
        })
        .catch(() => {});
    }

    try {
      localStorage.setItem("pro_flower_delivery_address", constructedDeliveryAddress);
    } catch (e) {}
    setStep(2);
  };

  // Final Order Submission (Siparişi Admin Paneline Düşürür!)
  const handleFinalOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingOrder(true);

    try {
      const orderPayload = {
        customerName: senderName || "Misafir Müşteri",
        customerPhone: senderPhone || "0555 000 00 00",
        customerEmail: senderEmail || "musteri@example.com",
        recipientName: recipientName || "Alıcı Müşteri",
        recipientPhone: recipientPhone || "0544 000 00 00",
        address: constructedDeliveryAddress,
        deliveryDate: typeof window !== "undefined" ? localStorage.getItem("pro_flower_delivery_date") || "Bugün" : "Bugün",
        deliveryTime: typeof window !== "undefined" ? localStorage.getItem("pro_flower_delivery_time") || "18:00 - 21:00" : "18:00 - 21:00",
        items: cartItemsToUse.map((item: any) => {
          const prod = item.product || item;
          return {
            id: prod.id,
            title: prod.title || "Çiçek Buketi",
            price: prod.price || "2.510 ₺",
            quantity: item.quantity || 1,
            selectedExtras: item.selectedExtras || []
          };
        }),
        addons: selectedAddons.map((a: any) => ({ name: a.name, price: a.price })),
        cardNote: cardNote || "Kart notu belirtilmedi.",
        isAnonymous: isAnonymousSender,
        paymentMethod: paymentMethod === "card" ? "Kredi Kartı (3D Secure)" : paymentMethod === "iban" ? "Havale / EFT" : paymentMethod === "cash" ? "Kapıda Ödeme" : "WhatsApp Sipariş",
        totalAmount: `${grandTotal.toLocaleString("tr-TR")} ₺`,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (res.ok) {
        const createdData = await res.json();
        const finalId = createdData.id || `SIP-${Math.floor(10000 + Math.random() * 90000)}`;
        setCreatedOrderId(finalId);
        trackPurchase({
          orderId: finalId,
          value: grandTotal,
          currency: "TRY",
          items: cartItemsToUse.map((it: any) => ({
            id: (it.product || it).id,
            title: (it.product || it).title,
            price: parseTurkishPrice((it.product || it).price),
            quantity: it.quantity || 1,
          })),
        });
        try { await fetch(`/api/abandoned-carts?cartNo=${encodeURIComponent(cartSessionId)}`, { method: "DELETE" }); } catch (err) {}
        clearCart();
        setOrderSuccess(true);
      } else {
        alert("Sipariş kaydedilirken bir hata oluştu.");
      }
    } catch (e) {
      alert("Sipariş gönderilirken bir hata oluştu.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  // POINT 5 FIX: Customer Order Success View (NO Admin Panel Button)
  if (orderSuccess) {
    return (
      <div className="bg-[#FAF6F0] min-h-screen font-sans">
        <StoreHeader />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-4xl mx-auto font-bold shadow-sm">
            ✓
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800">Siparişiniz Başarıyla Alındı!</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Sipariş Numaranız: <span className="font-extrabold text-[#2b2623] text-base">{createdOrderId}</span>
            <br />
            Çiçeğiniz özenle hazırlanıp kuryemize teslim edilecek ve kurye çıkışında tarafınıza görsel onay iletilecektir.
          </p>
          <div className="pt-4 flex justify-center">
            <Link href="/" style={{ backgroundColor: "#2b2623", color: "#ffffff" }} className="px-8 py-4 rounded-2xl font-extrabold text-sm shadow-md hover:opacity-95 transition">
              Mağazaya Dön / Alışverişe Devam Et
            </Link>
          </div>
        </main>
        <StoreFooter />
      </div>
    );
  }

  return (
    <div className="bg-[#FAF6F0] min-h-screen font-sans">
      {/* Sleek Top Header for Checkout */}
      <header className="bg-white border-b border-slate-200 py-4 shadow-xs sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Çiçekçe" className="h-9 w-auto object-contain rounded-xl border border-amber-900/10 shadow-xs" />
            <span style={{ fontFamily: "serif", fontWeight: "700", fontSize: "24px", letterSpacing: "0.05em", color: "#1a1918" }}>ÇİÇEKÇE</span>
          </Link>
          <div className="text-xs text-slate-500 font-semibold flex items-center gap-1">
            <span>🔒 256-Bit SSL Güvenli Ödeme</span>
          </div>
        </div>
      </header>

      {/* Top Multi-Step Progress Indicator (Çiçeksepeti Style) */}
      <div className="bg-white border-b border-slate-200 py-3 shadow-2xs mb-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <div className={`flex items-center gap-2 cursor-pointer ${step >= 1 ? "text-[#2b2623] font-extrabold" : ""}`} onClick={() => setStep(1)}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? "bg-[#2b2623] text-white" : "bg-slate-200 text-slate-600"}`}>1</span>
              <span>Alıcı & Teslimat</span>
            </div>
            <span className="text-slate-300">──</span>
            <div className={`flex items-center gap-2 cursor-pointer ${step >= 2 ? "text-[#2b2623] font-extrabold" : ""}`} onClick={() => step > 1 && setStep(2)}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? "bg-[#2b2623] text-white" : "bg-slate-200 text-slate-600"}`}>2</span>
              <span>Ek Ürünler</span>
            </div>
            <span className="text-slate-300">──</span>
            <div className={`flex items-center gap-2 cursor-pointer ${step >= 3 ? "text-[#2b2623] font-extrabold" : ""}`} onClick={() => step > 2 && setStep(3)}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? "bg-[#2b2623] text-white" : "bg-slate-200 text-slate-600"}`}>3</span>
              <span>Fatura Bilgileri</span>
            </div>
            <span className="text-slate-300">──</span>
            <div className={`flex items-center gap-2 cursor-pointer ${step >= 4 ? "text-[#2b2623] font-extrabold" : ""}`} onClick={() => step > 3 && setStep(4)}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 4 ? "bg-[#2b2623] text-white" : "bg-slate-200 text-slate-600"}`}>4</span>
              <span>Mesaj Kartı</span>
            </div>
            <span className="text-slate-300">──</span>
            <div className={`flex items-center gap-2 cursor-pointer ${step >= 5 ? "text-[#2b2623] font-extrabold" : ""}`} onClick={() => step > 4 && setStep(5)}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 5 ? "bg-[#2b2623] text-white" : "bg-slate-200 text-slate-600"}`}>5</span>
              <span>Ödeme</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Form Left Area (8 cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* STEP 1: ALICI BİLGİLERİ VE TESLİMAT ADRESİ */}
            {step === 1 && (
              <form onSubmit={handleStep1Proceed} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
                <h4 className="font-extrabold text-xl text-slate-800 border-b pb-4 flex items-center gap-2">
                  <span>📍</span> <span>1. Alıcı Bilgileri & Teslimat Adresi</span>
                </h4>

                {/* MEMBER SAVED ADDRESS SELECTOR */}
                {loggedMember && loggedMember.addresses && loggedMember.addresses.length > 0 && (
                  <div className="p-4 bg-[#FAF6F0] border border-amber-200/80 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                        <span>🏷️</span> <span>Kayıtlı Teslimat Adreslerimden Hızlı Seçin:</span>
                      </span>
                      <span className="text-[11px] text-amber-900 font-bold">Tek tıkla formu doldurur</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {loggedMember.addresses.map((addr: any) => (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => applySavedAddress(addr)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-2xs ${
                            selectedSavedAddrId === addr.id
                              ? "bg-[#2b2623] text-white border-[#2b2623]"
                              : "bg-white text-slate-800 border-slate-300 hover:border-slate-500"
                          }`}
                        >
                          <span>📍 {addr.title}</span>
                          <span className="text-[10px] opacity-80 font-normal">({addr.district})</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSavedAddrId("");
                          setFullAddressDetails("");
                        }}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100"
                      >
                        + Farklı Yeni Adres Gir
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Alıcı Bilgileri */}
                  <div className="space-y-4">
                    <h5 className="font-bold text-sm text-slate-700 uppercase tracking-wide">Alıcı Bilgileri</h5>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Alıcının Adı Soyadı *</label>
                      <input
                        type="text"
                        className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#2b2623]"
                        placeholder="Örn: Ayşe Yılmaz"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Alıcının Telefon Numarası *</label>
                      <input
                        type="text"
                        className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#2b2623]"
                        placeholder="Örn: 0544 987 65 43"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Right Column: Teslimat Adresi Dropdowns */}
                  <div className="space-y-4">
                    <h5 className="font-bold text-sm text-slate-700 uppercase tracking-wide">Teslimat Adresi</h5>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Gönderilecek Şehir *</label>
                      <select
                        className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#2b2623]"
                        value={String(selectedCityId)}
                        onChange={(e) => handleCityChange(e.target.value)}
                      >
                        {activeCities.map((c) => (
                          <option key={c.id} value={String(c.id)}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Gönderilecek İlçe *</label>
                      <select
                        className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#2b2623]"
                        value={String(selectedDistrictId)}
                        onChange={(e) => handleDistrictChange(e.target.value)}
                      >
                        {currentDistricts.length > 0 ? (
                          currentDistricts.map((d: any) => (
                            <option key={d.id} value={String(d.id)}>
                              {d.name} {d.deliveryFee > 0 ? `(+${d.deliveryFee} ₺ Kurye Bedeli)` : ""}
                            </option>
                          ))
                        ) : (
                          <option value="">İlçe Seçiniz</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Gönderilecek Mahalle *</label>
                      <select
                        className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#2b2623]"
                        value={String(selectedNeighId)}
                        onChange={(e) => setSelectedNeighId(e.target.value)}
                      >
                        {currentNeighborhoods.length > 0 ? (
                          currentNeighborhoods.map((n: any) => (
                            <option key={n.id} value={String(n.id)}>
                              {n.name}
                            </option>
                          ))
                        ) : (
                          <option value="merkez">Merkez Mah.</option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Açık Adres (Cadde, sokak, bina ve daire no) *</label>
                    <textarea
                      rows={2}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#2b2623]"
                      placeholder="Örn: Atatürk Caddesi, Gül Sokak No: 12 Daire: 4"
                      value={fullAddressDetails}
                      onChange={(e) => setFullAddressDetails(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  {/* SAVE NEW ADDRESS TO PROFILE CHECKBOX */}
                  {loggedMember && (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={saveNewAddressToProfile}
                          onChange={(e) => setSaveNewAddressToProfile(e.target.checked)}
                          className="w-4 h-4 rounded text-[#2b2623] accent-[#2b2623]"
                        />
                        <span>💾 Bu teslimat adresini sonraki siparişlerim için hesabıma kaydet</span>
                      </label>
                      {saveNewAddressToProfile && (
                        <div className="pt-1">
                          <input
                            type="text"
                            required={saveNewAddressToProfile}
                            placeholder="Adres Başlığı (Örn: Annemin Evi, Sevgilimin Ofisi)"
                            value={newAddressTitle}
                            onChange={(e) => setNewAddressTitle(e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#2b2623]"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Şirket veya Okul İsmi (İsteğe Bağlı)</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#2b2623]"
                      placeholder="Örn: ABC Holding / Giriş Danışma"
                      value={companySchool}
                      onChange={(e) => setCompanySchool(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                    className="px-8 py-4 rounded-2xl font-extrabold text-sm shadow-md hover:opacity-95 transition flex items-center gap-2"
                  >
                    <span>Devam Et &gt; Ek Ürünler</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: EK ÜRÜNLER (POINT 4 FIX: High Contrast + Ekle Button with Crisp White Text) */}
            {step === 2 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
                <h4 className="font-extrabold text-xl text-slate-800 border-b pb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span>🎁</span> <span>2. Ek Ürünler (Yönetim Paneli Hediyeleri)</span>
                  </span>
                  <span className="text-xs text-[#2b2623] font-bold bg-[#F5EFE6] px-2.5 py-1 rounded-xl border border-amber-900/15">
                    Admin Ekstra Kataloğu
                  </span>
                </h4>

                <p className="text-slate-600 text-xs">Siparişinize eklemek istediğiniz hediye ürünlerini tıklayarak seçebilirsiniz:</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {displayAddons.map((addon) => {
                    const isAdded = selectedAddons.some((a) => a.id === addon.id);
                    return (
                      <div key={addon.id} className="border border-slate-200 rounded-2xl p-4 flex items-center gap-4 bg-slate-50/50 hover:border-slate-300 transition">
                        <img src={addon.image} alt={addon.name} className="w-16 h-16 object-cover rounded-xl border shrink-0 bg-white" />
                        <div className="flex-1">
                          <div className="text-xs font-extrabold text-slate-800">{addon.name}</div>
                          <div className="text-sm font-black text-[#2b2623] mt-1">+{addon.price} ₺</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (isAdded) {
                              setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
                            } else {
                              setSelectedAddons([...selectedAddons, addon]);
                            }
                          }}
                          style={isAdded ? { backgroundColor: "#fee2e2", color: "#b91c1c" } : { backgroundColor: "#2b2623", color: "#ffffff" }}
                          className={`px-4 py-2 rounded-xl text-xs font-black shadow-sm transition ${
                            isAdded ? "hover:bg-red-200" : "hover:opacity-90"
                          }`}
                        >
                          {isAdded ? "✓ Eklendi (Çıkar)" : "+ Ekle"}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 flex justify-between">
                  <button type="button" onClick={() => setStep(1)} className="btn btn-light px-5 py-3 rounded-xl text-xs font-bold">
                    &lt; Geri
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                    className="px-8 py-3.5 rounded-2xl font-extrabold text-sm shadow-md hover:opacity-95 transition"
                  >
                    Devam Et &gt; Fatura Bilgileri
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: FATURA BİLGİLERİ */}
            {step === 3 && (
              <form onSubmit={(e) => { e.preventDefault(); if(!senderName.trim()) { alert("Lütfen gönderen adı soyadı giriniz."); return; } setStep(4); }} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
                <h4 className="font-extrabold text-xl text-slate-800 border-b pb-4 flex items-center gap-2">
                  <span>📄</span> <span>3. Fatura & Gönderen Bilgileri</span>
                </h4>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setBillingType("bireysel")}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition ${
                      billingType === "bireysel" ? "border-[#2b2623] bg-[#F5EFE6] text-[#2b2623]" : "border-slate-200 text-slate-600"
                    }`}
                  >
                    Bireysel Fatura
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingType("kurumsal")}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition ${
                      billingType === "kurumsal" ? "border-[#2b2623] bg-[#F5EFE6] text-[#2b2623]" : "border-slate-200 text-slate-600"
                    }`}
                  >
                    Kurumsal Fatura
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Gönderen Adınız Soyadınız *</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#2b2623]"
                      placeholder="Örn: Ahmet Yılmaz"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Gönderen Telefon Numarası *</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#2b2623]"
                      placeholder="Örn: 0555 123 45 67"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">E-Posta Adresiniz (Fatura İçin) *</label>
                    <input
                      type="email"
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#2b2623]"
                      placeholder="Örn: ahmet@example.com"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      required
                    />
                  </div>

                  {billingType === "kurumsal" && (
                    <>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Vergi Dairesi</label>
                        <input
                          type="text"
                          className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#2b2623]"
                          placeholder="Örn: Boğaziçi Vergi Dairesi"
                          value={taxOffice}
                          onChange={(e) => setTaxOffice(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Vergi Numarası / T.C.</label>
                        <input
                          type="text"
                          className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#2b2623]"
                          placeholder="Örn: 1234567890"
                          value={taxNo}
                          onChange={(e) => setTaxNo(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-4 flex justify-between">
                  <button type="button" onClick={() => setStep(2)} className="btn btn-light px-5 py-3 rounded-xl text-xs font-bold">
                    &lt; Geri
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                    className="px-8 py-3.5 rounded-2xl font-extrabold text-sm shadow-md hover:opacity-95 transition"
                  >
                    Devam Et &gt; Mesaj Kartı
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: MESAJ KARTI */}
            {step === 4 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
                <h4 className="font-extrabold text-xl text-slate-800 border-b pb-4 flex items-center gap-2">
                  <span>💌</span> <span>4. Mesaj Kartı Notunuz</span>
                </h4>

                {/* Category Selection Tabs */}
                <div className="flex flex-wrap gap-2">
                  {Object.keys(cardTemplates).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCardCategory(cat)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                        cardCategory === cat
                          ? "border-[#2b2623] bg-[#F5EFE6] text-[#2b2623] ring-2 ring-[#2b2623]/20"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Ready-to-use Sample Templates */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 block uppercase">
                    Hazır Mesaj Şablonları ({cardCategory} - Tıklayıp Mesaj Kartına Yazdırın):
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {((supabaseCardNotes.length > 0
                        ? supabaseCardNotes.filter((n: any) => n.category === cardCategory).map((n: any) => n.tr)
                        : cardTemplates[cardCategory] || []
                    )).map((tmpl: string, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setCardNote(tmpl);
                          const element = document.getElementById("cardNoteArea");
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "center" });
                            element.focus();
                          }
                        }}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium cursor-pointer hover:border-[#2b2623] hover:bg-[#F5EFE6]/50 transition flex items-center justify-between"
                      >
                        <span>"{tmpl}"</span>
                        <span className="text-[10px] font-bold text-[#2b2623] bg-emerald-100 px-2 py-0.5 rounded shrink-0">Karta Yaz ✍️</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Kart Mesajınız (Yazılan Not)</label>
                  <textarea
                    id="cardNoteArea"
                    rows={4}
                    className="w-full p-3.5 border border-slate-200 rounded-2xl text-sm font-semibold outline-none focus:border-[#2b2623] focus:ring-2 focus:ring-[#2b2623]/20 transition"
                    placeholder="Çiçeğin yanında iletilmesini istediğiniz duygu dolu mesajınızı buraya yazabilirsiniz..."
                    value={cardNote}
                    onChange={(e) => setCardNote(e.target.value)}
                  ></textarea>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-200">
                  <div>
                    <div className="font-bold text-xs text-slate-800">İsmim Gizli Kalsın (İsimsiz Gönderim)</div>
                    <div className="text-[11px] text-slate-500">Karta isminiz yazılmaz, alıcı kimin gönderdiğini görmez.</div>
                  </div>
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-emerald-700 cursor-pointer"
                    checked={isAnonymousSender}
                    onChange={(e) => setIsAnonymousSender(e.target.checked)}
                  />
                </div>

                <div className="pt-4 flex justify-between">
                  <button type="button" onClick={() => setStep(3)} className="btn btn-light px-5 py-3 rounded-xl text-xs font-bold">
                    &lt; Geri
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(5)}
                    style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                    className="px-8 py-3.5 rounded-2xl font-extrabold text-sm shadow-md hover:opacity-95 transition"
                  >
                    Devam Et &gt; Ödeme Ekle
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: ÖDEME BİLGİLERİ */}
            {step === 5 && (
              <form onSubmit={handleFinalOrderSubmit} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
                <h4 className="font-extrabold text-xl text-slate-800 border-b pb-4 flex items-center gap-2">
                  <span>💳</span> <span>5. Ödeme Yöntemi</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`p-3 rounded-2xl border text-center font-bold text-xs transition ${
                      paymentMethod === "card" ? "border-[#2b2623] bg-[#F5EFE6] text-[#2b2623]" : "border-slate-200 text-slate-600"
                    }`}
                  >
                    💳 Kredi / Banka Kartı
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("iban")}
                    className={`p-3 rounded-2xl border text-center font-bold text-xs transition ${
                      paymentMethod === "iban" ? "border-[#2b2623] bg-[#F5EFE6] text-[#2b2623]" : "border-slate-200 text-slate-600"
                    }`}
                  >
                    🏦 Havale / EFT (IBAN)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`p-3 rounded-2xl border text-center font-bold text-xs transition ${
                      paymentMethod === "cash" ? "border-[#2b2623] bg-[#F5EFE6] text-[#2b2623]" : "border-slate-200 text-slate-600"
                    }`}
                  >
                    💵 Kapıda Ödeme
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("whatsapp")}
                    className={`p-3 rounded-2xl border text-center font-bold text-xs transition ${
                      paymentMethod === "whatsapp" ? "border-[#2b2623] bg-[#F5EFE6] text-[#2b2623]" : "border-slate-200 text-slate-600"
                    }`}
                  >
                    💬 WhatsApp ile Öde
                  </button>
                </div>

                {paymentMethod === "card" && (
                  <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Kart Numarası</label>
                      <input
                        type="text"
                        className="w-full p-3 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-[#2b2623]"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Son Kullanma (AY/YIL)</label>
                        <input
                          type="text"
                          className="w-full p-3 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-[#2b2623]"
                          placeholder="12/28"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">CVC Güvenlik Kodu</label>
                        <input
                          type="text"
                          className="w-full p-3 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-[#2b2623]"
                          placeholder="123"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "iban" && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2 font-semibold">
                    <div className="font-bold text-sm">Banka Hesap Bilgilerimiz (Havale/EFT)</div>
                    <div>Banka: Ziraat Bankası</div>
                    <div>IBAN: TR98 0001 0099 8877 6655 4433 22</div>
                    <div>Alıcı: Çiçekce Çiçekçilik Ltd. Şti.</div>
                    <div className="text-[11px] text-amber-700 pt-1">Lütfen açıklama kısmına telefon numaranızı yazınız.</div>
                  </div>
                )}

                <div className="pt-4 flex justify-between">
                  <button type="button" onClick={() => setStep(4)} className="btn btn-light px-5 py-3 rounded-xl text-xs font-bold">
                    &lt; Geri
                  </button>
                  <button
                    type="submit"
                    disabled={submittingOrder}
                    style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                    className="px-10 py-4 rounded-2xl font-extrabold text-base shadow-lg hover:opacity-95 transition"
                  >
                    {submittingOrder ? "Sipariş Kaydediliyor..." : `Siparişi Tamamla (${grandTotal.toLocaleString("tr-TR")} ₺)`}
                  </button>
                </div>
              </form>
            )}

          </div>

          {/* Right Summary Sidebar (4 cols) - POINT 3 FIX: Single Item Display */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 sticky top-24 space-y-5">
              <h5 className="font-extrabold text-base text-slate-800 border-b pb-3 m-0 flex items-center justify-between">
                <span>Sipariş Özeti</span>
                <span className="text-xs text-[#2b2623] font-bold bg-[#F5EFE6] px-2 py-0.5 rounded border border-amber-900/15">
                  {cartItemsToUse.length} Ürün
                </span>
              </h5>

              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1 space-y-3">
                {!isMounted ? (
                  <div className="pt-3 flex gap-3 items-center opacity-60">
                    <div className="w-14 h-14 bg-slate-100 rounded-xl animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-3/4 animate-pulse" />
                      <div className="h-3 bg-slate-200 rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                ) : (
                  cartItemsToUse.map((item: any, idx: number) => {
                    const prod = item.product || item;
                    const title = prod.title || item.title || "Çiçek Buketi";
                    const priceStr = prod.price || item.price || "2.510 ₺";
                    const image = prod.image || item.image || "https://demo.procicek.com.tr/urunler/7-kirmizi-gul-ve-beyaz-bicme-179-v2.webp";
                    const qtyVal = item.quantity || 1;
                    const priceVal = parseTurkishPrice(priceStr);

                    return (
                      <div key={item.id || idx} className="pt-3 flex gap-3 items-center">
                        <img
                          src={image}
                          alt={title}
                          className="w-14 h-14 object-cover rounded-xl border shrink-0 bg-slate-50"
                        />
                        <div className="flex-1 text-xs">
                          <div className="font-extrabold text-slate-800 line-clamp-1">{title}</div>
                          <div className="text-slate-400 font-semibold mt-0.5">{qtyVal} Adet</div>
                          <div className="font-black text-[#2b2623] mt-0.5">
                            {(priceVal * qtyVal).toLocaleString("tr-TR")} ₺
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {selectedAddons.map((addon) => (
                  <div key={addon.id} className="pt-3 flex gap-3 items-center">
                    <img src={addon.image} alt={addon.name} className="w-10 h-10 object-cover rounded-lg border shrink-0 bg-white" />
                    <div className="flex-1 text-xs">
                      <div className="font-bold text-slate-800 line-clamp-1">{addon.name}</div>
                      <div className="font-black text-[#2b2623]">+{addon.price} ₺</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t pt-4 text-xs font-semibold text-slate-600">
                <div className="flex justify-between">
                  <span>Ürünler Toplamı:</span>
                  <span className="font-bold text-slate-800">{isMounted ? `${mainCartTotal.toLocaleString("tr-TR")} ₺` : "..."}</span>
                </div>

                {addonsTotal > 0 && (
                  <div className="flex justify-between text-[#2b2623]">
                    <span>Ek Ürünler:</span>
                    <span className="font-bold">+{addonsTotal.toLocaleString("tr-TR")} ₺</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span>Kurye Teslimatı:</span>
                  {deliveryFee > 0 ? (
                    <span className="font-black text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      +{deliveryFee.toLocaleString("tr-TR")} ₺
                    </span>
                  ) : (
                    <span className="font-bold text-[#2b2623]">ÜCRETSİZ</span>
                  )}
                </div>

                {/* DISCOUNT COUPON CODE SECTION */}
                <div className="border-t pt-3 space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>🎟️ İndirim Kuponu</span>
                    {appliedCouponName && (
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[10px] text-red-600 underline font-bold"
                      >
                        Kaldır
                      </button>
                    )}
                  </div>

                  {!appliedCouponName ? (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:ring-1 focus:ring-[#2b2623]"
                        placeholder="Kupon Kodu (Örn: HOSGELDIN)"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value)}
                      />
                      <button
                        type="submit"
                        style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                        className="px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-xs hover:opacity-90 transition shrink-0"
                      >
                        Uygula
                      </button>
                    </form>
                  ) : (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-extrabold flex justify-between items-center">
                      <span>✓ Kupon: {appliedCouponName}</span>
                      <span>-{discountAmount.toLocaleString("tr-TR")} ₺</span>
                    </div>
                  )}

                  {couponError && <div className="text-[11px] text-red-600 font-bold">{couponError}</div>}
                  {couponSuccess && <div className="text-[11px] text-emerald-700 font-bold">{couponSuccess}</div>}
                </div>

                <div className="flex justify-between text-sm font-black text-slate-900 border-t pt-3">
                  <span>Toplam Tutar:</span>
                  <span className="text-[#1a1918] text-lg">{isMounted ? `${grandTotal.toLocaleString("tr-TR")} ₺` : "..."}</span>
                </div>
              </div>

              {/* Delivery Address Preview Card */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-700 uppercase text-[10px]">Seçili Teslimat Adresi</div>
                <div className="font-extrabold text-slate-800">{constructedDeliveryAddress}</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}
