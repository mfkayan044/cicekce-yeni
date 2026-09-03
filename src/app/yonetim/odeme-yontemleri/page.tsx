"use client";
import AdminLayout from "@/components/layout/AdminLayout";
import { useState } from "react";

export default function OdemeYontemleriPage() {
  const [banks, setBanks] = useState([
    { id: "1", bank: "Garanti BBVA IBAN", owner: "Demo Çiçekçilik Ltd.", iban: "TR92 0006 2000 0000 1234 5678 90", active: true },
    { id: "2", bank: "Ziraat Bankası IBAN", owner: "Demo Çiçekçilik Ltd.", iban: "TR11 0001 0000 0000 9876 5432 10", active: true },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [bankName, setBankName] = useState("");
  const [ibanVal, setIbanVal] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !ibanVal) return;
    setBanks([...banks, { id: Date.now().toString(), bank: bankName, owner: "Demo Çiçekçilik Ltd.", iban: ibanVal, active: true }]);
    setBankName("");
    setIbanVal("");
    setShowModal(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
              <span className="text-slate-400 fw-light">Teslimat & Kasa /</span> Ödeme Yöntemleri
            </h4>
            <p className="text-slate-500 text-sm">Sanal POS, Havale/EFT ve kapıda ödeme seçeneklerini yönetin.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary shadow-sm flex items-center gap-2 px-4 py-2 rounded-lg font-semibold">
            <i className="bx bx-plus text-lg"></i>
            <span>Yeni Banka Hesabı Ekle</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card border-0 shadow-sm rounded-xl p-5 bg-white space-y-3">
            <h5 className="font-bold text-slate-800 text-lg border-b pb-3 flex items-center justify-between">
              <span>Sanal POS (iyzico / PayTR)</span>
              <span className="badge bg-emerald-100 text-[#1a1918]">Aktif</span>
            </h5>
            <p className="text-xs text-slate-500">Tüm kredi ve banka kartlarından 3D Secure ile anında güvenli ödeme alma altyapısı.</p>
          </div>

          <div className="card border-0 shadow-sm rounded-xl p-5 bg-white space-y-3">
            <h5 className="font-bold text-slate-800 text-lg border-b pb-3 flex items-center justify-between">
              <span>Kapıda Ödeme (Kuryede)</span>
              <span className="badge bg-emerald-100 text-[#1a1918]">Aktif (+20 ₺)</span>
            </h5>
            <p className="text-xs text-slate-500">Teslimat anında nakit veya kurye POS cihazı ile tahsilat yöntemi.</p>
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-xl bg-white overflow-hidden">
          <div className="p-4 border-b">
            <h5 className="font-bold text-slate-800 text-base m-0">Havale / EFT Banka Hesapları</h5>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Banka</th>
                  <th className="px-4 py-3">Hesap Sahibi</th>
                  <th className="px-4 py-3">IBAN Numarası</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3 text-end">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {banks.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 font-bold text-slate-800">{b.bank}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{b.owner}</td>
                    <td className="px-4 py-3 font-mono text-xs text-primary">{b.iban}</td>
                    <td className="px-4 py-3"><span className="badge bg-[#F5EFE6] text-[#2b2623]">Aktif</span></td>
                    <td className="px-4 py-3 text-end">
                      <button onClick={() => setBanks(banks.filter(x => x.id !== b.id))} className="btn btn-sm btn-light text-danger rounded-circle">
                        <i className="bx bx-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h5 className="font-bold text-lg text-slate-800">Yeni Banka Hesabı</h5>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"><i className="bx bx-x text-xl"></i></button>
              </div>
              <form onSubmit={handleAdd} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Banka Adı</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Örn: İş Bankası" required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">IBAN Numarası</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={ibanVal} onChange={(e) => setIbanVal(e.target.value)} placeholder="TRXX XXXX..." required />
                </div>
                <div className="pt-3 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-light px-4 py-2 text-sm">İptal</button>
                  <button type="submit" className="btn btn-primary px-5 py-2 text-sm font-semibold">Kaydet</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
