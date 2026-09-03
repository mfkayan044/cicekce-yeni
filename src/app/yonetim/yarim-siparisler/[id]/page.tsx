"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function YarimSiparisDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCart() {
      try {
        const res = await fetch("/api/abandoned-carts");
        if (res.ok) {
          const list = await res.json();
          const found = list.find((item: any) => item.id === id || item.cartNo === id);
          if (found) {
            setCart(found);
          } else if (list.length > 0) {
            setCart(list[0]);
          }
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    }
    loadCart();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Bu yarım kalan sepet kaydını silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/abandoned-carts?id=${cart?.id || id}`, { method: "DELETE" });
      router.push("/yonetim/yarim-siparisler");
    } catch (e) {
      alert("Silinirken hata oluştu.");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-slate-500">Yarım kalan sipariş detayları yükleniyor...</div>
      </AdminLayout>
    );
  }

  const record = cart || {
    id,
    cartNo: "TSL-2026-314507",
    customer: "deneny",
    phone: "5635",
    product: "7 Kırmızı Gül ve Papatyalar",
    step: "Müşteri Bilgileri (1/3)",
    total: "2.500 ₺",
    date: "31.08.2026 14:48",
    address: "Antalya / Alanya / Akçatı Mahallesi No: 12",
    email: "Belirtilmedi",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border shadow-xs">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/yonetim/yarim-siparisler"
                className="btn btn-outline-secondary btn-sm flex items-center gap-1 rounded-lg"
              >
                <span>← Geri</span>
              </Link>
              <h4 className="font-bold text-xl text-slate-800 m-0">
                Yarım Kalan Sipariş Detayı — <span className="text-[#2b2623]">{record.cartNo}</span>
              </h4>
            </div>
            <p className="text-xs text-slate-500 mt-1">Oluşturma / Son İşlem: {record.date}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="btn btn-outline-danger btn-sm flex items-center gap-1 rounded-lg text-xs px-3 py-1.5 font-bold"
            >
              <span>🗑️ Kaydı Sil</span>
            </button>
          </div>
        </div>

        {/* Steps Progress Bar */}
        <div className="card border-0 shadow-xs rounded-xl p-4 bg-white space-y-3">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
            <span>Kaldığı Adım: <strong style={{ color: "#b45309" }} className="font-extrabold text-sm">{record.step}</strong></span>
            <span style={{ color: "#166534", backgroundColor: "#dcfce7" }} className="px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-200">
              ⚡ Canlı Terk Edilmiş Sepet
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-semibold">
            {[
              { num: "1", title: "1. Alıcı & Teslimat" },
              { num: "2", title: "2. Ek Ürünler" },
              { num: "3", title: "3. Fatura Bilgisi" },
              { num: "4", title: "4. Mesaj Kartı" },
              { num: "5", title: "5. Ödeme Yöntemi" },
            ].map((st) => {
              const isCurrent = record.step?.includes(st.num) || record.step?.includes(st.title.split(".")[1]?.trim());
              return (
                <div
                  key={st.num}
                  style={
                    isCurrent
                      ? { backgroundColor: "#fef3c7", color: "#78350f", borderColor: "#fcd34d" }
                      : { backgroundColor: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }
                  }
                  className={`p-2 rounded-xl border flex items-center justify-center font-bold text-xs ${
                    isCurrent ? "ring-2 ring-amber-400/30" : ""
                  }`}
                >
                  <span>{st.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Product & Delivery Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Products & Extras Card */}
            <div className="card border-0 shadow-xs rounded-xl p-5 bg-white space-y-4">
              <h5 className="font-bold text-slate-800 text-base border-b pb-3 flex items-center gap-2">
                <span>🌸</span>
                <span>Sepetteki Ürünler ve Ekstralar</span>
              </h5>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-2">Ürün / Ekstra</th>
                      <th className="px-4 py-2">Tür</th>
                      <th className="px-4 py-2">Adet</th>
                      <th className="px-4 py-2 text-end">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Main Products */}
                    {record.items && record.items.length > 0 ? (
                      record.items.map((it: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 font-bold text-slate-800">{it.title || "Çiçek Buketi"}</td>
                          <td className="px-4 py-3">
                            <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200">
                              Ana Çiçek
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold">{it.quantity || 1}</td>
                          <td className="px-4 py-3 font-black text-end text-[#2b2623]">{it.price || record.total}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-3 font-bold text-slate-800">{record.product || "Çiçek Buketi"}</td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200">
                            Ana Çiçek
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold">1</td>
                        <td className="px-4 py-3 font-black text-end text-[#2b2623]">{record.total}</td>
                      </tr>
                    )}

                    {/* Extras / Addons */}
                    {record.addons && record.addons.length > 0 && record.addons.map((add: any, idx: number) => (
                      <tr key={`add-${idx}`} className="bg-amber-50/40">
                        <td className="px-4 py-3 font-bold text-slate-800 flex items-center gap-2">
                          <span>🎁</span>
                          <span>{add.name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md border border-amber-300">
                            Ek Ürün / Hediye
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold">1</td>
                        <td className="px-4 py-3 font-black text-end text-amber-900">{add.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm border">
                <div className="flex justify-between text-slate-600">
                  <span>Teslimat Adresi:</span>
                  <span className="font-semibold text-slate-800">{record.address || "Belirtilmedi"}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Müşteri E-Posta:</span>
                  <span className="font-semibold text-slate-800">{record.email || "Belirtilmedi"}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t text-slate-900">
                  <span>Genel Toplam Tutar:</span>
                  <span className="text-[#2b2623] text-xl font-black">{record.total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Customer & Contact Info */}
          <div className="space-y-6">
            {/* Customer Details */}
            <div className="card border-0 shadow-xs rounded-xl p-5 bg-white space-y-3">
              <h5 className="font-bold text-slate-800 text-base border-b pb-3 flex items-center gap-2">
                <span>👤</span>
                <span>Müşteri & İletişim Bilgileri</span>
              </h5>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-slate-500">Müşteri Adı:</span>
                  <span className="font-bold text-slate-800">{record.customer}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-slate-500">Telefon:</span>
                  <span className="font-extrabold text-[#2b2623]">{record.phone}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-slate-500">E-Posta:</span>
                  <span className="font-semibold text-slate-700">{record.email || "Belirtilmedi"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Kaldığı Aşama:</span>
                  <span className="font-bold text-amber-700">{record.step}</span>
                </div>
              </div>

              {/* Direct WhatsApp Call-to-action Button */}
              {record.phone && (
                <a
                  href={`https://wa.me/90${record.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(`Merhaba ${record.customer}, ${record.product} siparişiniz hakkında bilgi vermek için ulaşıyoruz.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ backgroundColor: "#25D366", color: "#ffffff" }}
                  className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs hover:opacity-95 transition mt-2"
                >
                  <span>💬 WhatsApp'tan İletişime Geç</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
