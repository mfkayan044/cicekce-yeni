"use client";
import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function KuryelerPage() {
  const [couriers, setCouriers] = useState<any[]>([]);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [pin, setPin] = useState("1234");
  const [toastMsg, setToastMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCouriers();
  }, []);

  const fetchCouriers = async () => {
    try {
      const res = await fetch("/api/couriers");
      const data = await res.json();
      setTrackingEnabled(data.trackingEnabled !== false);
      setCouriers(Array.isArray(data.list) ? data.list : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTracking = async (enabled: boolean) => {
    setTrackingEnabled(enabled);
    try {
      await fetch("/api/couriers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingEnabled: enabled }),
      });
      setToastMsg("Canlı Kurye Harita Takip ayarı güncellendi!");
      setTimeout(() => setToastMsg(""), 3000);
    } catch (e) {}
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/couriers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, region, pin: pin.trim() || "1234" }),
      });

      if (res.ok) {
        const data = await res.json();
        setCouriers(Array.isArray(data.couriersData?.list) ? data.couriersData.list : []);
        setName("");
        setPhone("");
        setRegion("");
        setPin("1234");
        setToastMsg("Yeni kurye ve özel PIN kodu başarıyla tanımlandı!");
        setTimeout(() => setToastMsg(""), 3000);
      }
    } catch (e) {
      alert("Hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, courierName: string) => {
    if (!confirm(`"${courierName}" kuryesini silmek istediğinizden emin misiniz?`)) return;

    try {
      const res = await fetch(`/api/couriers?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setCouriers(couriers.filter((c) => c.id !== id));
        setToastMsg("Kurye silindi.");
        setTimeout(() => setToastMsg(""), 3000);
      }
    } catch (e) {
      alert("Hata oluştu.");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-5 text-center font-bold text-slate-600">Kuryeler yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
              <span className="text-slate-400 fw-light">Teslimat & Kasa /</span> Kurye Takip Yönetimi
            </h4>
            <p className="text-slate-500 text-sm">Saha teslimat kuryelerinin tanımları ve canlı harita takip ayarları.</p>
          </div>
          <Link href="/yonetim/kuryeler/yeni" className="btn btn-primary shadow-sm flex items-center gap-2 px-4 py-2 rounded-lg font-semibold">
            <span>➕ Yeni Kurye Ekle</span>
          </Link>
        </div>

        {toastMsg && (
          <div className="alert alert-success p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 text-sm rounded-lg font-bold">
            ✅ {toastMsg}
          </div>
        )}

        <div className="card border-0 shadow-sm rounded-xl p-5 bg-white space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h5 className="font-bold text-slate-800 text-base m-0">Canlı Kurye Konum Takibi (courier_tracking_enabled)</h5>
              <p className="text-xs text-slate-500 m-0">Müşterilerin sipariş takip ekranında kuryeyi canlı haritada izlemesi.</p>
            </div>
            <input
              type="checkbox"
              className="form-check-input w-6 h-6 cursor-pointer"
              checked={trackingEnabled}
              onChange={(e) => handleToggleTracking(e.target.checked)}
            />
          </div>

          <form onSubmit={handleAdd} className="space-y-3 pt-2">
            <h6 className="font-bold text-slate-700 text-sm">Hızlı Kurye Tanımla</h6>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input
                type="text"
                className="px-3 py-2 border rounded-lg text-sm"
                placeholder="Kurye Ad Soyad *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="text"
                className="px-3 py-2 border rounded-lg text-sm"
                placeholder="Telefon Numarası"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <input
                type="text"
                className="px-3 py-2 border rounded-lg text-sm"
                placeholder="Teslimat Bölgesi"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
              <input
                type="text"
                className="px-3 py-2 border rounded-lg text-sm font-mono font-bold"
                placeholder="PIN Kodu (Örn: 1453)"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
              <button type="submit" disabled={saving} className="btn btn-primary px-4 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-1">
                <span>{saving ? "Kaydediliyor..." : "👤 Hızlı Kaydet"}</span>
              </button>
            </div>
          </form>
        </div>

        <div className="card border-0 shadow-sm rounded-xl bg-white overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Kurye Ad Soyad</th>
                  <th className="px-4 py-3">Telefon</th>
                  <th className="px-4 py-3">Bölge / Araç</th>
                  <th className="px-4 py-3">Giriş PIN Kodu</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3 text-end">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {couriers.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-bold text-slate-800">{c.name}</td>
                    <td className="px-4 py-3 text-slate-600">{c.phone || "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{c.region || "Genel Kurye"}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 font-mono font-bold text-xs rounded-lg">
                        🔑 {c.pin || "1234"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-emerald-100 text-emerald-800 font-bold">Aktif Sahada</span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="flex justify-end gap-2">
                        <Link href={`/yonetim/kuryeler/${c.id}/duzenle`} className="btn btn-sm btn-outline-primary rounded-lg text-xs px-2.5 py-1">
                          Düzenle
                        </Link>
                        <button onClick={() => handleDelete(c.id, c.name)} className="btn btn-sm btn-outline-danger rounded-lg text-xs px-2.5 py-1">
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
