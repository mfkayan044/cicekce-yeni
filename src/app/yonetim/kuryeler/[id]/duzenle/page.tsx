"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

export default function EditCourierPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const courierId = resolvedParams.id;
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCourier();
  }, [courierId]);

  const fetchCourier = async () => {
    try {
      const res = await fetch(`/api/couriers?id=${courierId}`);
      const data = await res.json();
      if (data) {
        setName(data.name || "");
        setPhone(data.phone || "");
        setPlate(data.plate || "");
        setRegion(data.region || "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/couriers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: courierId, name, phone, plate, region }),
      });

      if (res.ok) {
        alert("Kurye bilgileri başarıyla güncellendi!");
        router.push("/yonetim/kuryeler");
      } else {
        alert("Güncelleme hatası.");
      }
    } catch (e) {
      alert("Hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-5 text-center font-bold text-slate-600">Kurye bilgileri yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">Kurye Bilgilerini Düzenle</h4>
            <p className="text-slate-500 text-sm">Teslimat kuryesinin iletişim ve bölge detaylarını güncelleyin.</p>
          </div>
          <Link href="/yonetim/kuryeler" className="btn btn-outline-secondary">
            ← Geri Dön
          </Link>
        </div>

        <div className="card border-0 shadow-sm rounded-xl p-6 bg-white">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-3">
              <label className="form-label fw-bold">Kurye Adı Soyadı *</label>
              <input
                type="text"
                className="form-control fw-bold"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Telefon Numarası</label>
              <input
                type="text"
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Sorumlu Teslimat Bölgesi</label>
              <input
                type="text"
                className="form-control"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Araç Plakası</label>
              <input
                type="text"
                className="form-control"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
              />
            </div>

            <button type="submit" disabled={saving} className="btn btn-primary px-5 fw-bold shadow-sm">
              {saving ? "Güncelleniyor..." : "💾 Değişiklikleri Kaydet"}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
