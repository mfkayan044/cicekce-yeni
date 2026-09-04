"use client";
import AdminLayout from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";

export default function OdemeYontemleriPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [settings, setSettings] = useState<any>({
    card: { active: true, name: "Kredi / Banka Kartı" },
    iban: { active: true, name: "Havale / EFT (IBAN)" },
    cash: { active: true, name: "Kapıda Ödeme", fee: 20 },
    whatsapp: { active: true, name: "WhatsApp ile Öde" },
    banks: [
      { id: "1", bank: "Garanti BBVA", owner: "Çiçekçe Çiçekçilik Ltd. Şti.", iban: "TR92 0006 2000 0000 1234 5678 90", active: true },
      { id: "2", bank: "Ziraat Bankası", owner: "Çiçekçe Çiçekçilik Ltd. Şti.", iban: "TR11 0001 0000 0000 9876 5432 10", active: true }
    ]
  });

  const [showModal, setShowModal] = useState(false);
  const [bankName, setBankName] = useState("");
  const [ownerName, setOwnerName] = useState("Çiçekçe Çiçekçilik Ltd. Şti.");
  const [ibanVal, setIbanVal] = useState("");

  useEffect(() => {
    fetch("/api/payment-methods")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === "object") {
          setSettings((prev: any) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveSettings = async (newSettings: any) => {
    setSaving(true);
    try {
      const res = await fetch("/api/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        setMsg("Ödeme yöntemleri ve ayarlar başarıyla kaydedildi!");
        setTimeout(() => setMsg(""), 4000);
      }
    } catch (e) {
      alert("Kaydedilirken hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const toggleMethod = (key: string) => {
    const updated = {
      ...settings,
      [key]: {
        ...settings[key],
        active: !settings[key]?.active
      }
    };
    setSettings(updated);
    saveSettings(updated);
  };

  const handleCashFeeChange = (val: number) => {
    const updated = {
      ...settings,
      cash: {
        ...settings.cash,
        fee: val
      }
    };
    setSettings(updated);
    saveSettings(updated);
  };

  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !ibanVal) return;
    const newBank = {
      id: Date.now().toString(),
      bank: bankName,
      owner: ownerName,
      iban: ibanVal,
      active: true
    };
    const updated = {
      ...settings,
      banks: [...(settings.banks || []), newBank]
    };
    setSettings(updated);
    saveSettings(updated);
    setBankName("");
    setIbanVal("");
    setShowModal(false);
  };

  const handleDeleteBank = (id: string) => {
    const updated = {
      ...settings,
      banks: (settings.banks || []).filter((b: any) => b.id !== id)
    };
    setSettings(updated);
    saveSettings(updated);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
              <span className="text-slate-400 fw-light">Teslimat & Kasa /</span> Ödeme Yöntemleri Yönetimi
            </h4>
            <p className="text-slate-500 text-sm">
              Müşterilerin ödeme sayfasında (`/odeme`) göreceği ödeme yöntemlerini aktife veya pasife alın.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
            className="px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 hover:opacity-95 transition"
          >
            <span>➕ Yeni IBAN / Banka Ekle</span>
          </button>
        </div>

        {msg && (
          <div className="alert alert-success text-sm flex items-center gap-2 p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold">
            <span>✓</span>
            <span>{msg}</span>
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-slate-500 font-semibold">Yükleniyor...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. KREDI KART / SANAL POS */}
            <div className="card border-0 shadow-sm rounded-2xl p-6 bg-white space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center text-xl font-bold">
                    💳
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-800 text-base m-0">Kredi & Banka Kartı (Sanal POS)</h5>
                    <span className="text-xs text-slate-400">iyzico / PayTR / 3D Secure</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleMethod("card")}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition ${
                    settings.card?.active
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  {settings.card?.active ? "● AKTİF" : "○ PASİF"}
                </button>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Aktif edildiğinde müşteriler ödeme sayfasında kart ile ödeme yapabilir. Entegrasyon anahtarlarını daha sonra girebilirsiniz.
              </p>
            </div>

            {/* 2. KAPIDA ÖDEME */}
            <div className="card border-0 shadow-sm rounded-2xl p-6 bg-white space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-xl font-bold">
                    💵
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-800 text-base m-0">Kapıda Ödeme (Nakit / Kurye POS)</h5>
                    <span className="text-xs text-slate-400">Teslimat Anında Tahsilat</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleMethod("cash")}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition ${
                    settings.cash?.active
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  {settings.cash?.active ? "● AKTİF" : "○ PASİF"}
                </button>
              </div>
              <div className="flex items-center justify-between gap-4 pt-1">
                <label className="text-xs font-bold text-slate-700">Kapıda Ödeme Hizmet Hizmet Bedeli (₺):</label>
                <input
                  type="number"
                  className="w-24 p-2 border border-slate-200 rounded-xl text-sm font-bold text-center outline-none focus:border-[#2b2623]"
                  value={settings.cash?.fee || 0}
                  onChange={(e) => handleCashFeeChange(Number(e.target.value))}
                />
              </div>
            </div>

            {/* 3. HAVALE / EFT (IBAN) */}
            <div className="card border-0 shadow-sm rounded-2xl p-6 bg-white space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center text-xl font-bold">
                    🏦
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-800 text-base m-0">Havale / EFT (Banka IBAN)</h5>
                    <span className="text-xs text-slate-400">Banka Hesabına Transfer</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleMethod("iban")}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition ${
                    settings.iban?.active
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  {settings.iban?.active ? "● AKTİF" : "○ PASİF"}
                </button>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Aktif olduğunda müşteriye banka hesap ve IBAN numaralarınız sipariş onay sayfasında gösterilir.
              </p>
            </div>

            {/* 4. WHATSAPP İLE ÖDE */}
            <div className="card border-0 shadow-sm rounded-2xl p-6 bg-white space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 text-green-800 flex items-center justify-center text-xl font-bold">
                    💬
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-800 text-base m-0">WhatsApp ile Hızlı Ödeme</h5>
                    <span className="text-xs text-slate-400">Sipariş Bilgisini WhatsApp'a Gönderir</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleMethod("whatsapp")}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition ${
                    settings.whatsapp?.active
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  {settings.whatsapp?.active ? "● AKTİF" : "○ PASİF"}
                </button>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Müşteri ödemeyi WhatsApp üzerinden temsilci ile tamamlamak istediğinde bu seçeneği kullanır.
              </p>
            </div>
          </div>
        )}

        {/* BANK ACCOUNTS TABLE */}
        <div className="card border-0 shadow-sm rounded-2xl bg-white overflow-hidden space-y-3">
          <div className="p-5 border-b flex justify-between items-center">
            <h5 className="font-extrabold text-slate-800 text-base m-0">Havale / EFT İçin Kayıtlı Banka Hesapları</h5>
            <button
              onClick={() => setShowModal(true)}
              className="text-xs font-extrabold text-[#2b2623] hover:underline"
            >
              + Yeni Banka Ekle
            </button>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold">
                <tr>
                  <th className="px-5 py-3">Banka</th>
                  <th className="px-5 py-3">Hesap Sahibi</th>
                  <th className="px-5 py-3">IBAN Numarası</th>
                  <th className="px-5 py-3 text-end">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(settings.banks || []).map((b: any) => (
                  <tr key={b.id}>
                    <td className="px-5 py-3.5 font-bold text-slate-800">{b.bank}</td>
                    <td className="px-5 py-3.5 text-slate-700">{b.owner}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-[#2b2623] font-bold">{b.iban}</td>
                    <td className="px-5 py-3.5 text-end">
                      <button
                        onClick={() => handleDeleteBank(b.id)}
                        className="px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold transition"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
                {(!settings.banks || settings.banks.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center text-xs text-slate-400 font-semibold">
                      Henüz kayıtlı banka hesabı eklenmemiş.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h5 className="font-extrabold text-lg text-slate-800">Yeni Banka Hesabı Ekle</h5>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold">✕</button>
              </div>
              <form onSubmit={handleAddBank} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Banka Adı</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#2b2623]"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Örn: Garanti BBVA"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Hesap Sahibi (Unvan)</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#2b2623]"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">IBAN Numarası</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-mono font-bold outline-none focus:border-[#2b2623]"
                    value={ibanVal}
                    onChange={(e) => setIbanVal(e.target.value)}
                    placeholder="TRXX XXXX XXXX XXXX XXXX XXXX XX"
                    required
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-light px-4 py-2.5 text-xs font-bold rounded-xl">İptal</button>
                  <button
                    type="submit"
                    style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                    className="px-6 py-2.5 rounded-xl font-extrabold text-xs shadow-md hover:opacity-95 transition"
                  >
                    Kaydet & Ekles
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
