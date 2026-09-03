"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCourierPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [region, setRegion] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/couriers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, plate, region }),
      });

      if (res.ok) {
        alert("Yeni kurye başarıyla tanımlandı!");
        router.push("/yonetim/kuryeler");
      } else {
        alert("Kaydetme hatası.");
      }
    } catch (e) {
      alert("Hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">Yeni Teslimat Kuryesi Ekle</h4>
            <p className="text-slate-500 text-sm">Sipariş dağıtımlarını yapacak kurye iletişim ve bölge bilgilerini girin.</p>
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
                placeholder="Örn: Ahmet Yılmaz"
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
                placeholder="Örn: 0532 111 22 33"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Sorumlu Teslimat Bölgesi</label>
              <input
                type="text"
                className="form-control"
                placeholder="Örn: Sarıyer / Kemerburgaz"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Araç Plakası (İsteğe Bağlı)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Örn: 34 ABC 123"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
              />
            </div>

            <button type="submit" disabled={saving} className="btn btn-primary px-5 fw-bold shadow-sm">
              {saving ? "Kaydediliyor..." : "💾 Kuryeyi Kaydet"}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
