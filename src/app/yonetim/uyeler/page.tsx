"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState, useEffect } from "react";

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  date: string;
  status: "Aktif" | "Pasif";
  addresses?: any[];
}

export default function UyelerPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [showModal, setShowModal] = useState(false);

  // New Member Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/members");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setMembers(data);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFilter(query);
  };

  const handleClear = () => {
    setQuery("");
    setSearchFilter("");
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          name,
          email,
          phone: phone || "",
          password: password || "123456",
        }),
      });

      const data = await res.json();
      if (res.ok && data.member) {
        setMembers([data.member, ...members]);
        setName("");
        setEmail("");
        setPhone("");
        setPassword("");
        setShowModal(false);
        alert("✅ Yeni üye başarıyla kaydedildi.");
      } else {
        alert(data.error || "Üye eklenemedi.");
      }
    } catch (e) {
      alert("Hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (m: Member) => {
    const nextStatus = m.status === "Aktif" ? "Pasif" : "Aktif";
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: m.id,
          updatedData: { status: nextStatus },
        }),
      });

      if (res.ok) {
        setMembers(members.map((item) => (item.id === m.id ? { ...item, status: nextStatus } : item)));
      }
    } catch (e) {
      alert("Durum güncellenemedi.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${name} adlı üyeyi ve üyelik geçmişini silmek istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/members?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setMembers(members.filter((m) => m.id !== id));
      } else {
        alert("Üye silinemedi.");
      }
    } catch (e) {
      alert("Hata oluştu.");
    }
  };

  const filtered = members.filter(
    (m) =>
      m.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (m.phone && m.phone.includes(searchFilter))
  );

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="text-[11px] font-black uppercase text-amber-900 tracking-wider mb-1">
              🌸 ÇİÇEKÇE MÜŞTERİ YÖNETİMİ
            </div>
            <h4 className="font-black text-2xl text-slate-900 m-0">Kayıtlı Üyeler & Müşteri Hesapları</h4>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Sitenize kayıt olan müşterilerin profillerini, kayıtlı adreslerini ve durumlarını yönetin.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
            className="px-5 py-2.5 rounded-2xl font-extrabold text-xs shadow-xs hover:opacity-95 transition flex items-center gap-2"
          >
            <span>👤 + Yeni Üye Ekle</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="card border border-slate-200/80 shadow-xs rounded-3xl p-4 bg-white">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto flex-grow max-w-lg">
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-slate-50 border rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#2b2623]"
                placeholder="Ad, E-posta veya Telefon ile arayın..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="submit"
                style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                className="px-4 py-2.5 text-xs font-bold rounded-2xl shrink-0"
              >
                Ara
              </button>
              {searchFilter && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-2xl shrink-0"
                >
                  Temizle
                </button>
              )}
            </div>
            <span className="text-xs text-slate-500 font-extrabold">
              Toplam {filtered.length} Kayıtlı Üye
            </span>
          </form>
        </div>

        {/* Members Table */}
        <div className="card border border-slate-200/80 shadow-xs rounded-3xl bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[11px] border-b">
                <tr>
                  <th className="px-5 py-3.5">Üye Adı</th>
                  <th className="px-4 py-3.5">E-posta</th>
                  <th className="px-4 py-3.5">Telefon</th>
                  <th className="px-4 py-3.5">Kayıtlı Adresler</th>
                  <th className="px-4 py-3.5">Kayıt Tarihi</th>
                  <th className="px-4 py-3.5">Durum</th>
                  <th className="px-5 py-3.5 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 font-bold">
                      Üye listesi yükleniyor...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 font-bold">
                      Kayıtlı üye bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filtered.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition duration-150">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#F5EFE6] text-[#2b2623] font-black flex items-center justify-center text-xs">
                            {m.name ? m.name.substring(0, 2).toUpperCase() : "ÜY"}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{m.name}</div>
                            <div className="text-[10px] text-slate-400">ID: {m.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 font-semibold">{m.email}</td>
                      <td className="px-4 py-3.5 text-slate-600">{m.phone || "—"}</td>
                      <td className="px-4 py-3.5">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[11px] font-bold">
                          {m.addresses?.length || 0} Adres
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">{m.date || "Bugün"}</td>
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(m)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black border transition ${
                            m.status === "Aktif"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-300"
                          }`}
                        >
                          {m.status === "Aktif" ? "🟢 Aktif" : "⚪ Pasif"}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDelete(m.id, m.name)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 font-bold"
                            title="Üyeyi Sil"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE MEMBER MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <h5 className="font-extrabold text-sm text-slate-900">👤 Yeni Üye Ekle</h5>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3 text-left">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Adı Soyadı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ayşe Kaya"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">E-posta Adresi *</label>
                <input
                  type="email"
                  required
                  placeholder="ornek@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Telefon Numarası</label>
                <input
                  type="tel"
                  placeholder="05XX XXX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Başlangıç Şifresi</label>
                <input
                  type="password"
                  placeholder="Varsayılan: 123456"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-light px-4 py-2 text-xs font-bold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                  className="px-5 py-2.5 rounded-xl text-xs font-black shadow-md hover:opacity-95 transition"
                >
                  {submitting ? "Kaydediliyor..." : "Üyeyi Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
