"use client";

import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredMember, setStoredMember, clearStoredMember, MemberUser, MemberAddress } from "@/lib/member-auth";
import Link from "next/link";
import OrderUpdateRequestModal from "@/components/orders/OrderUpdateRequestModal";

export default function MemberAccountPage() {
  const router = useRouter();
  const [member, setMember] = useState<MemberUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "profile" | "special_dates">("orders");

  // Orders State
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [editingOrderForUpdate, setEditingOrderForUpdate] = useState<any | null>(null);

  // Profile Edit Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // New Address State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addrTitle, setAddrTitle] = useState("");
  const [addrCity, setAddrCity] = useState("İstanbul");
  const [addrDistrict, setAddrDistrict] = useState("Kadıköy");
  const [addrFull, setAddrFull] = useState("");

  // Special Dates State
  const [showSpecialDateModal, setShowSpecialDateModal] = useState(false);
  const [spTitle, setSpTitle] = useState("");
  const [spDate, setSpDate] = useState("");
  const [spRecipient, setSpRecipient] = useState("");
  const [spRelationship, setSpRelationship] = useState("Eş / Sevgili");
  const [spNote, setSpNote] = useState("");

  useEffect(() => {
    const current = getStoredMember();
    if (!current) {
      router.push("/giris-yap");
      return;
    }
    setMember(current);
    setName(current.name || "");
    setPhone(current.phone || "");
    setLoading(false);

    // Fetch user's orders matching email or phone
    fetchOrders(current.email, current.phone);
  }, []);

  const fetchOrders = async (email?: string, phone?: string) => {
    setLoadingOrders(true);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const all = await res.json();
        const filtered = (all || []).filter((o: any) => {
          const emailMatch = email && o.customerEmail && o.customerEmail.toLowerCase() === email.toLowerCase();
          const phoneMatch = phone && o.customerPhone && o.customerPhone.replace(/\D/g, "") === phone.replace(/\D/g, "");
          return emailMatch || phoneMatch;
        });
        setMyOrders(filtered);
      }
    } catch (e) {
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    setSavingProfile(true);
    setProfileMsg("");

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: member.id,
          updatedData: {
            name,
            phone,
            ...(password ? { password } : {}),
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.member) {
        setStoredMember(data.member);
        setMember(data.member);
        setProfileMsg("✅ Profil bilgileriniz başarıyla güncellendi.");
        setPassword("");
      } else {
        setProfileMsg("⚠️ Güncelleme başarısız.");
      }
    } catch (e) {
      setProfileMsg("⚠️ Bağlantı hatası.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    const newAddr: MemberAddress = {
      id: `addr_${Date.now()}`,
      title: addrTitle || "Ev Adresim",
      city: addrCity,
      district: addrDistrict,
      fullAddress: addrFull,
    };

    const updatedAddresses = [...(member.addresses || []), newAddr];

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: member.id,
          updatedData: { addresses: updatedAddresses },
        }),
      });

      const data = await res.json();
      if (res.ok && data.member) {
        setStoredMember(data.member);
        setMember(data.member);
        setShowAddressModal(false);
        setAddrTitle("");
        setAddrFull("");
      }
    } catch (e) {
      alert("Adres kaydedilemedi.");
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
    if (!member) return;
    const updatedAddresses = (member.addresses || []).filter((a) => a.id !== addrId);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: member.id,
          updatedData: { addresses: updatedAddresses },
        }),
      });

      const data = await res.json();
      if (res.ok && data.member) {
        setStoredMember(data.member);
        setMember(data.member);
      }
    } catch (e) {}
  };

  const handleAddSpecialDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !spTitle || !spDate || !spRecipient) return;

    const newDate = {
      id: `SP-${Date.now()}`,
      title: spTitle,
      date: spDate,
      recipientName: spRecipient,
      relationship: spRelationship || "Yakını",
      note: spNote || "",
    };

    const updatedDates = [...(member.specialDates || []), newDate];
    const updatedMember = { ...member, specialDates: updatedDates };

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: member.id,
          updatedData: { specialDates: updatedDates },
        }),
      });

      if (res.ok) {
        setStoredMember(updatedMember);
        setMember(updatedMember);
        setShowSpecialDateModal(false);
        setSpTitle("");
        setSpDate("");
        setSpRecipient("");
        setSpRelationship("Eş / Sevgili");
        setSpNote("");
      } else {
        alert("Özel gün kaydedilirken bir hata oluştu.");
      }
    } catch (err) {
      alert("Bağlantı hatası.");
    }
  };

  const handleDeleteSpecialDate = async (id: string) => {
    if (!member) return;
    const updatedDates = (member.specialDates || []).filter((d) => d.id !== id);
    const updatedMember = { ...member, specialDates: updatedDates };

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: member.id,
          updatedData: { specialDates: updatedDates },
        }),
      });

      if (res.ok) {
        setStoredMember(updatedMember);
        setMember(updatedMember);
      }
    } catch (err) {}
  };

  const handleLogout = () => {
    clearStoredMember();
    router.push("/");
  };

  if (loading || !member) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between">
        <StoreHeader />
        <div className="text-center py-24 font-bold text-slate-500">Hesap bilgileri yükleniyor...</div>
        <StoreFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between font-sans">
      <div>
        <StoreHeader />

        <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          {/* USER HEADER BANNER */}
          <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-[#F5EFE6] text-[#2b2623] font-black text-2xl flex items-center justify-center shadow-xs">
                {member.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-black text-slate-900 m-0">{member.name}</h1>
                <p className="text-xs text-slate-500 m-0 mt-0.5">
                  {member.email} · {member.phone || "Telefon Belirtilmedi"}
                </p>
                <div className="text-[11px] font-bold text-emerald-700 mt-1">✓ Çiçekçe Üyesi</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition"
            >
              🚪 Çıkış Yap
            </button>
          </div>

          {/* NAVIGATION TABS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-200/70 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`py-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 ${
                activeTab === "orders" ? "bg-white text-[#2b2623] shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>📦 Siparişlerim</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 font-bold">
                {myOrders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("special_dates")}
              className={`py-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 ${
                activeTab === "special_dates" ? "bg-white text-[#2b2623] shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>📅 Özel Günler</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-900 font-bold">
                {member.specialDates?.length || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("addresses")}
              className={`py-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 ${
                activeTab === "addresses" ? "bg-white text-[#2b2623] shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>📍 Adreslerim</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-bold">
                {member.addresses?.length || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`py-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 ${
                activeTab === "profile" ? "bg-white text-[#2b2623] shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>👤 Profilim</span>
            </button>
          </div>

          {/* TAB 1: SİPARİŞLERİM */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              {loadingOrders ? (
                <div className="bg-white rounded-3xl p-8 text-center text-slate-400 font-bold border">
                  Siparişleriniz kontrol ediliyor...
                </div>
              ) : myOrders.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center space-y-3 border border-slate-200 shadow-xs">
                  <div className="text-4xl">🌸</div>
                  <h3 className="font-bold text-slate-800 text-base">Henüz Verilmiş Bir Siparişiniz Yok</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Özel anlarınızı güzelleştirmek için en taze çiçek koleksiyonlarımızı hemen keşfedin.
                  </p>
                  <Link
                    href="/"
                    style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                    className="inline-block py-3 px-6 rounded-2xl font-bold text-xs shadow-md mt-2"
                  >
                    Çiçekleri İncele
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myOrders.map((o) => (
                    <div
                      key={o.id}
                      className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Sipariş Numarası</div>
                          <div className="font-black text-sm text-slate-900 font-mono">#{o.id}</div>
                        </div>

                        <div className="text-right">
                          <span
                            style={{
                              backgroundColor:
                                o.status === "Teslim Edildi" ? "#dcfce7" :
                                o.status === "Kuryede / Dağıtımda" ? "#e0e7ff" :
                                o.status === "Hazırlanıyor" || o.status === "Fotoğraflı Onay Bekliyor" ? "#ffedd5" :
                                o.status === "Yeni Sipariş" ? "#fee2e2" : "#f1f5f9",
                              color:
                                o.status === "Teslim Edildi" ? "#166534" :
                                o.status === "Kuryede / Dağıtımda" ? "#3730a3" :
                                o.status === "Hazırlanıyor" || o.status === "Fotoğraflı Onay Bekliyor" ? "#9a3412" :
                                o.status === "Yeni Sipariş" ? "#991b1b" : "#475569",
                            }}
                            className="px-3 py-1 rounded-full text-xs font-black border inline-block"
                          >
                            {o.status || "Yeni Sipariş"}
                          </span>
                          <div className="text-[11px] text-slate-500 font-bold mt-0.5">
                            📅 {o.deliveryDate || o.date} ({o.deliveryTime || "Tüm Gün"})
                          </div>
                        </div>
                      </div>

                      {/* Update Request Status Alert if exists */}
                      {o.updateRequest && (
                        <div className="text-xs space-y-2">
                          {o.updateRequest.status === "PENDING" && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-950">
                              <div className="font-extrabold text-xs text-amber-900 flex items-center gap-1.5">
                                <span>⏳</span>
                                <span>Bilgi Güncelleme Talebiniz İnceleniyor</span>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-0.5">
                                Teslimat adresi veya zamanı değişikliği talebiniz atölyemiz ve temsilcimiz tarafından inceleniyor.
                              </p>
                            </div>
                          )}

                          {o.updateRequest.status === "APPROVED" && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950">
                              <div className="font-extrabold text-xs text-emerald-900 flex items-center gap-1.5">
                                <span>✅</span>
                                <span>Bilgi Güncelleme Talebiniz Onaylandı</span>
                              </div>
                            </div>
                          )}

                          {o.updateRequest.status === "REJECTED" && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-950">
                              <div className="font-extrabold text-xs text-red-900 flex items-center gap-1.5">
                                <span>❌</span>
                                <span>Güncelleme Talebiniz Kabul Edilemedi</span>
                              </div>
                              {o.updateRequest.adminNote && (
                                <p className="text-[11px] text-red-800 font-semibold mt-0.5">
                                  Gerekçe: {o.updateRequest.adminNote}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Items and Recipient */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Alıcı & Adres</span>
                          <div className="font-bold text-slate-900">{o.recipientName}</div>
                          <div className="text-slate-600 leading-snug">{o.address}</div>
                        </div>

                        <div className="space-y-1 sm:text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Toplam Tutar</span>
                          <div className="text-base font-black text-[#2b2623]">
                            {o.totalAmount || o.totalPrice}
                          </div>
                          <div className="text-[11px] text-slate-500">Ödeme: {o.paymentMethod || "Kredi Kartı"}</div>
                        </div>
                      </div>

                      {/* Action Links (Live Photo Approval / Tracking / Update Request) */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                        {o.preparedPhoto ? (
                          <Link
                            href={`/siparis-onay/${o.id}`}
                            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                            className="py-2 px-4 rounded-xl text-xs font-bold shadow-2xs hover:opacity-95 transition"
                          >
                            🌸 Hazırlanan Çiçek Fotoğrafını İncele
                          </Link>
                        ) : null}

                        {o.status !== "Teslim Edildi" && o.updateRequest?.status !== "PENDING" && (
                          <button
                            type="button"
                            onClick={() => setEditingOrderForUpdate(o)}
                            className="py-2 px-4 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition"
                          >
                            ✏️ Bilgileri Güncelle
                          </button>
                        )}

                        <Link
                          href={`/siparis-takip?id=${o.id}`}
                          className="py-2 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
                        >
                          🔍 Siparişi Takip Et
                        </Link>
                      </div>
                    </div>
                  ))}

                  {/* Order Update Request Modal */}
                  <OrderUpdateRequestModal
                    order={editingOrderForUpdate}
                    isOpen={!!editingOrderForUpdate}
                    onClose={() => setEditingOrderForUpdate(null)}
                    onSuccess={(updatedOrder) => {
                      setMyOrders((prev) =>
                        prev.map((ord) => (ord.id === updatedOrder.id ? updatedOrder : ord))
                      );
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: KAYITLI ADRESLERİM */}
          {activeTab === "addresses" && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Kayıtlı Teslimat Adreslerim</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sipariş verirken hızlıca seçebileceğiniz favori adresleriniz.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(true)}
                  style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                  className="py-2 px-4 rounded-xl text-xs font-bold shadow-xs hover:opacity-95 transition"
                >
                  + Yeni Adres Ekle
                </button>
              </div>

              {(!member.addresses || member.addresses.length === 0) ? (
                <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                  Henüz kayıtlı adresiniz bulunmuyor. "+ Yeni Adres Ekle" butonuna basarak ekleyebilirsiniz.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {member.addresses.map((a) => (
                    <div key={a.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 relative">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-xs text-slate-900">🏷️ {a.title}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(a.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold"
                        >
                          Sil
                        </button>
                      </div>
                      <div className="text-xs font-bold text-slate-700">
                        {a.city} / {a.district}
                      </div>
                      <div className="text-xs text-slate-500 leading-snug">{a.fullAddress}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ÖZEL GÜN TAKVİMİM */}
          {activeTab === "special_dates" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 m-0 flex items-center gap-2">
                    <span>📅</span> <span>Özel Gün Takvimim & Hatırlatıcı</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 m-0">
                    Sevdiklerinizin doğum günü, evlilik yıldönümü gibi özel günlerini ekleyin; zamanı geldiğinde indirimli çiçek fırsatlarını kaçırmayın!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSpecialDateModal(true)}
                  style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                  className="py-2.5 px-4 rounded-2xl text-xs font-extrabold shadow-md hover:opacity-95 transition flex items-center gap-1.5 shrink-0"
                >
                  <span>✨ Yeni Özel Gün Ekle</span>
                </button>
              </div>

              {(!member.specialDates || member.specialDates.length === 0) ? (
                <div className="text-center py-10 space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="text-4xl">🎂</div>
                  <div className="font-bold text-slate-800 text-sm">Henüz Kayıtlı Bir Özel Gününüz Yok</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Sevdiklerinizin doğum gününü veya yıldönümünü kaydedin, günü geldiğinde çiçek hediyenizi ilk siz hazırlayın.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {member.specialDates.map((sp) => (
                    <div
                      key={sp.id}
                      className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 text-purple-950 space-y-2 relative"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🎉</span>
                          <div>
                            <div className="font-black text-sm text-purple-950">{sp.title}</div>
                            <div className="text-[11px] font-bold text-purple-700">
                              Kişi: <strong>{sp.recipientName}</strong> ({sp.relationship || "Yakını"})
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSpecialDate(sp.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold p-1"
                          title="Özel Günü Sil"
                        >
                          🗑️
                        </button>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-purple-200 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-500">Tarih:</span>
                        <span className="font-black text-purple-900 font-mono">📅 {sp.date}</span>
                      </div>

                      {sp.note && (
                        <div className="text-[11px] text-purple-800 italic bg-purple-100/50 p-2 rounded-lg">
                          "{sp.note}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PROFİL BİLGİLERİM */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div>
                <h3 className="font-bold text-base text-slate-900">Profil & Hesap Bilgileri</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kişisel bilgilerinizi ve şifrenizi güncelleyebilirsiniz.
                </p>
              </div>

              {profileMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl">
                  {profileMsg}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Adınız Soyadınız *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-[#2b2623]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">E-posta Adresiniz (Değiştirilemez)</label>
                  <input
                    type="email"
                    disabled
                    value={member.email}
                    className="w-full p-3 border border-slate-200 bg-slate-100 rounded-xl text-xs font-semibold text-slate-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Telefon Numaranız</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-[#2b2623]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Yeni Şifre (Boş bırakırsanız değişmez)</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-[#2b2623]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                  className="py-3 px-6 rounded-xl font-bold text-xs shadow-xs hover:opacity-95 transition"
                >
                  {savingProfile ? "Kaydediliyor..." : "Bilgilerimi Güncelle"}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* NEW ADDRESS MODAL */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <h5 className="font-extrabold text-sm text-slate-900">📍 Yeni Teslimat Adresi Ekle</h5>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAddress} className="space-y-3 text-left">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Adres Başlığı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Evim, İşyeri, Sevgilimin Evi"
                  value={addrTitle}
                  onChange={(e) => setAddrTitle(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Şehir</label>
                  <input
                    type="text"
                    required
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    className="w-full p-2.5 border rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">İlçe</label>
                  <input
                    type="text"
                    required
                    value={addrDistrict}
                    onChange={(e) => setAddrDistrict(e.target.value)}
                    className="w-full p-2.5 border rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Açık Adres (Cadde, Sokak, Kapı No, Kat) *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Cadde, Sokak, No, Daire bilgilerini yazınız..."
                  value={addrFull}
                  onChange={(e) => setAddrFull(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="btn btn-light px-4 py-2 text-xs font-bold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                  className="px-5 py-2.5 rounded-xl text-xs font-black shadow-md hover:opacity-95 transition"
                >
                  Adresi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW SPECIAL DATE MODAL */}
      {showSpecialDateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <h5 className="font-extrabold text-sm text-slate-900">🎂 Yeni Özel Gün Ekle</h5>
              <button
                type="button"
                onClick={() => setShowSpecialDateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSpecialDate} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Özel Gün Adı / Başlığı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Eşimin Doğum Günü, Evlilik Yıldönümümüz"
                  value={spTitle}
                  onChange={(e) => setSpTitle(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kendi/Alıcı Adı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Ayşe Yılmaz"
                    value={spRecipient}
                    onChange={(e) => setSpRecipient(e.target.value)}
                    className="w-full p-2.5 border rounded-xl text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Yakınlık Derecesi</label>
                  <select
                    value={spRelationship}
                    onChange={(e) => setSpRelationship(e.target.value)}
                    className="w-full p-2.5 border rounded-xl text-xs font-semibold bg-slate-50"
                  >
                    <option value="Eş / Sevgili">Eş / Sevgili</option>
                    <option value="Anne / Baba">Anne / Baba</option>
                    <option value="Kardeş / Aile">Kardeş / Aile</option>
                    <option value="Arkadaş / Dost">Arkadaş / Dost</option>
                    <option value="İş Arkadaşı / Ortak">İş Arkadaşı / Ortak</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tarih *</label>
                <input
                  type="date"
                  required
                  value={spDate}
                  onChange={(e) => setSpDate(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Özel Not (Opsiyonel)</label>
                <input
                  type="text"
                  placeholder="Örn: Kırmızı gül seviyor"
                  value={spNote}
                  onChange={(e) => setSpNote(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowSpecialDateModal(false)}
                  className="btn btn-light px-4 py-2 text-xs font-bold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                  className="px-5 py-2.5 rounded-xl text-xs font-black shadow-md hover:opacity-95 transition"
                >
                  Özel Günü Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StoreFooter />
    </div>
  );
}
