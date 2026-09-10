"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Award, Save, CheckCircle2, Coins, Percent, Search, Plus, UserCheck, Gift, Sparkles, RefreshCw } from "lucide-react";

export default function AdminSadakatPage() {
  const [enabled, setEnabled] = useState(true);
  const [earnRate, setEarnRate] = useState(5);
  const [maxRedeemRate, setMaxRedeemRate] = useState(25);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Members Management State
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchMemberQuery, setSearchMemberQuery] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [pointsAmount, setPointsAmount] = useState<number | "">(100);
  const [pointsOperation, setPointsOperation] = useState<"add" | "set">("add");
  const [assigningPoints, setAssigningPoints] = useState(false);
  const [memberToast, setMemberToast] = useState("");

  const fetchLoyaltySettings = async () => {
    try {
      const res = await fetch("/api/settings/loyalty");
      if (res.ok) {
        const data = await res.json();
        if (typeof data.enabled === "boolean") setEnabled(data.enabled);
        if (data.earnRate !== undefined) setEarnRate(data.earnRate);
        if (data.maxRedeemRate !== undefined) setMaxRedeemRate(data.maxRedeemRate);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await fetch("/api/members");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setMembers(data);
          if (data.length > 0 && !selectedMemberId) {
            setSelectedMemberId(String(data[0].id));
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchLoyaltySettings(), fetchMembers()]).finally(() => setLoading(false));
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, earnRate, maxRedeemRate }),
      });
      if (res.ok) {
        setToastMsg("✅ ÇiçekPuan sadakat programı kuralları kaydedildi!");
        setTimeout(() => setToastMsg(""), 3500);
      }
    } catch (e) {
      alert("Kaydetme hatası.");
    } finally {
      setSaving(false);
    }
  };

  const handleAssignPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      alert("Lütfen bir üye seçiniz.");
      return;
    }
    const val = Number(pointsAmount);
    if (isNaN(val) || val <= 0) {
      alert("Lütfen geçerli bir puan miktarı giriniz.");
      return;
    }

    const targetMember = members.find((m) => String(m.id) === String(selectedMemberId));
    if (!targetMember) return;

    const currentPoints = Number(targetMember.points || 0);
    const newPoints = pointsOperation === "add" ? currentPoints + val : val;

    setAssigningPoints(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: targetMember.id,
          updatedData: { points: newPoints },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.member) {
          setMembers((prev) =>
            prev.map((m) => (String(m.id) === String(targetMember.id) ? { ...m, points: newPoints } : m))
          );
          const diffText = pointsOperation === "add" ? `+${val}` : `${val}`;
          setMemberToast(`🎉 ${targetMember.name} (${targetMember.email}) kullanıcısına ${diffText} ÇiçekPuan tanımlandı! (Yeni Bakiye: ${newPoints} Puan)`);
          setPointsAmount(100);
          setTimeout(() => setMemberToast(""), 5000);
        }
      } else {
        alert("Puan eklenirken bir hata oluştu.");
      }
    } catch (e) {
      alert("Sunucu hatası.");
    } finally {
      setAssigningPoints(false);
    }
  };

  const selectedMemberObj = members.find((m) => String(m.id) === String(selectedMemberId));

  const filteredMembers = members.filter((m) => {
    const q = searchMemberQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q)) ||
      (m.phone && m.phone.includes(q))
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans pb-12">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center font-black">
              <Award className="w-6 h-6 text-amber-900" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900">ÇiçekPuan Sadakat & İndirim Sistemi</h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Sistem sadakat kurallarını yönetin ve kayıtlı üyelere manuel ÇiçekPuan bakiyesi tanımlayın
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={saving}
            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
            className="px-5 py-2.5 rounded-2xl text-xs font-black hover:opacity-90 transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Kaydediliyor..." : "Kuralları Kaydet"}</span>
          </button>
        </div>

        {toastMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-black flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-xs font-extrabold text-slate-400">Yükleniyor...</div>
        ) : (
          <>
            {/* Top Grid: Rules & Matrix Example */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Rules Form */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                  <div className="flex justify-between items-center border-b pb-4">
                    <h2 className="font-black text-slate-900 text-sm m-0">Sadakat Programı Otomatik Kuralları</h2>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="w-5 h-5 cursor-pointer"
                        checked={enabled}
                        onChange={(e) => setEnabled(e.target.checked)}
                      />
                      <span className={`text-xs font-extrabold ${enabled ? "text-emerald-700" : "text-slate-400"}`}>
                        {enabled ? "🟢 Aktif (ÇiçekPuan Sistemi Çalışıyor)" : "⚪ Pasif"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700 block">Siparişten Puan Kazanım Oranı (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                          value={earnRate}
                          onChange={(e) => setEarnRate(Number(e.target.value))}
                        />
                        <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Müşterinin tamamladığı her sipariş tutarının belirlenen yüzdesi kadar ÇiçekPuan bakiyesine eklenir. (1 Puan = 1 ₺)
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700 block">
                        Tek Siparişte Kullanılabilecek Maksimum Puan İndirimi Üst Sınırı (%) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-amber-900"
                          value={maxRedeemRate}
                          onChange={(e) => setMaxRedeemRate(Number(e.target.value))}
                        />
                        <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                      </div>
                      <p className="text-[11px] text-amber-900 font-extrabold">
                        KURAL: Müşterinin hesabında ne kadar puan olursa olsun, bir siparişte en fazla sepet tutarının bu yüzdesi kadar indirim yapılabilir. Müşteri ürünün %100'ünü bedava alamaz.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Summary Info */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 font-sans">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-wider">💡 HESAPLAMA MATRİSİ</div>

                  <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/80 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-black text-amber-950">
                      <Coins className="w-4 h-4 text-amber-600" />
                      <span>Müşterinin 1.500 ÇiçekPuanı Var</span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700 font-medium">
                      <div className="flex justify-between">
                        <span>Sipariş Sepet Tutarı:</span>
                        <span className="font-bold text-slate-900">1.000 ₺</span>
                      </div>
                      <div className="flex justify-between text-amber-900 font-bold">
                        <span>Maksimum İndirim Sınırı (%{maxRedeemRate}):</span>
                        <span>250 ₺</span>
                      </div>
                      <div className="flex justify-between text-emerald-800 font-black border-t border-amber-200/60 pt-1.5">
                        <span>Müşterinin Ödeyeceği Net Tutar:</span>
                        <span>750 ₺</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 italic">
                      * Kalan 1.250 Puan müşterinin hesabında kalır ve sonraki siparişlerinde kullanılabilir.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION: MANUAL MEMBER POINTS ASSIGNMENT */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                    <Gift className="w-5 h-5 text-amber-900" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900 text-lg m-0 flex items-center gap-2">
                      <span>🌸 Üyelere Manuel ÇiçekPuan Tanımlama</span>
                      <span className="text-xs font-extrabold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
                        {members.length} Kayıtlı Üye
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Müşteri sadakatini artırmak veya telafi hediyesi vermek için üyelere doğrudan ÇiçekPuan yükleyin
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fetchMembers}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingMembers ? "animate-spin" : ""}`} />
                  <span>Listeyi Yenile</span>
                </button>
              </div>

              {memberToast && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-black flex items-center gap-2 animate-in fade-in">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{memberToast}</span>
                </div>
              )}

              {/* Form Section: Select Member & Assign Points */}
              <form onSubmit={handleAssignPoints} className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  {/* Member Selector */}
                  <div className="md:col-span-5 space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 block">Puan Eklenecek Üye Seçin *</label>
                    <select
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#2b2623]"
                      value={selectedMemberId}
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                      required
                    >
                      {members.length === 0 ? (
                        <option value="">Kayıtlı Üye Bulunamadı</option>
                      ) : (
                        members.map((mem) => (
                          <option key={mem.id} value={String(mem.id)}>
                            {mem.name} — {mem.email} ({Number(mem.points || 0)} Puan)
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Operation Type: Add or Set */}
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 block">İşlem Türü</label>
                    <div className="flex bg-white p-1 border border-slate-300 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setPointsOperation("add")}
                        className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition ${
                          pointsOperation === "add" ? "bg-[#2b2623] text-white" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        + Puan Ekleyin
                      </button>
                      <button
                        type="button"
                        onClick={() => setPointsOperation("set")}
                        className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition ${
                          pointsOperation === "set" ? "bg-[#2b2623] text-white" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        = Bakiyeyi Eşitle
                      </button>
                    </div>
                  </div>

                  {/* Points Amount Input */}
                  <div className="md:col-span-4 space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      {pointsOperation === "add" ? "Eklenecek Puan Miktarı" : "Yeni Net Puan Bakiyesi"} (TL Karşılığı)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 outline-none focus:border-[#2b2623]"
                        placeholder="Örn: 250"
                        value={pointsAmount}
                        onChange={(e) => setPointsAmount(e.target.value === "" ? "" : Number(e.target.value))}
                        required
                      />
                      <span className="absolute right-3 top-3 text-xs font-extrabold text-amber-900">ÇiçekPuan</span>
                    </div>
                  </div>
                </div>

                {/* Quick Presets & Action Button */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-slate-200/80">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-extrabold text-slate-500 mr-1">Hızlı Seçim:</span>
                    {[50, 100, 250, 500, 1000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setPointsOperation("add");
                          setPointsAmount(preset);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-amber-50 border border-slate-300 text-slate-800 rounded-lg text-xs font-extrabold transition shadow-2xs cursor-pointer"
                      >
                        +{preset} Puan
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={assigningPoints || !selectedMemberId}
                    style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                    className="px-6 py-3 rounded-xl text-xs font-black shadow-md hover:opacity-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>{assigningPoints ? "Tanımlanıyor..." : "ÇiçekPuan'ı Yükle"}</span>
                  </button>
                </div>

                {selectedMemberObj && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs font-semibold text-amber-950 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>
                        Seçili Üye: <strong>{selectedMemberObj.name}</strong> ({selectedMemberObj.email})
                      </span>
                    </div>
                    <div className="font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg">
                      Mevcut Bakiye: {Number(selectedMemberObj.points || 0)} ÇiçekPuan ({Number(selectedMemberObj.points || 0)} ₺)
                    </div>
                  </div>
                )}
              </form>

              {/* Registered Members Table with Quick Action */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h3 className="font-black text-slate-800 text-sm m-0">Tüm Kayıtlı Üyeler ve Puan Durumları</h3>

                  {/* Search Bar */}
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#2b2623]"
                      placeholder="Üye ara (Ad, E-posta, Tel)..."
                      value={searchMemberQuery}
                      onChange={(e) => setSearchMemberQuery(e.target.value)}
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-extrabold text-[10px]">
                      <tr>
                        <th className="p-3.5">Müşteri Adı</th>
                        <th className="p-3.5">E-Posta / Telefon</th>
                        <th className="p-3.5">Kayıt Tarihi</th>
                        <th className="p-3.5 text-center">ÇiçekPuan Bakiyesi</th>
                        <th className="p-3.5 text-right">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredMembers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                            Aramanıza uygun üye bulunamadı.
                          </td>
                        </tr>
                      ) : (
                        filteredMembers.map((mem) => (
                          <tr key={mem.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-3.5 font-extrabold text-slate-900">{mem.name || "İsimsiz Üye"}</td>
                            <td className="p-3.5 text-slate-600">
                              <div>{mem.email}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{mem.phone || "Telefon Belirtilmedi"}</div>
                            </td>
                            <td className="p-3.5 text-slate-500 font-mono text-[11px]">{mem.date || "Kayıtlı"}</td>
                            <td className="p-3.5 text-center">
                              <span className="inline-flex items-center gap-1 font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl text-xs">
                                🌸 {Number(mem.points || 0)} Puan
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMemberId(String(mem.id));
                                  setPointsOperation("add");
                                  setPointsAmount(250);
                                  window.scrollTo({ top: 450, behavior: "smooth" });
                                }}
                                className="px-3 py-1.5 bg-[#2b2623] hover:opacity-90 text-white rounded-lg text-xs font-bold transition shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                              >
                                <span>+ Puan Ekle</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
