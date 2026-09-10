"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState } from "react";
import { useStore, Product } from "@/lib/store";
import { DollarSign, Percent, Download, Upload, Save, RefreshCw, ArrowUpRight, ArrowDownRight, Layers, CheckCircle2 } from "lucide-react";

export default function AdminBulkPriceUpdatePage() {
  const { products, updateProduct, categories } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [actionType, setActionType] = useState<"percentage_increase" | "percentage_decrease" | "fixed_increase" | "fixed_decrease">("percentage_increase");
  const [amountValue, setAmountValue] = useState<number>(10);
  const [toastMsg, setToastMsg] = useState("");
  const [updating, setUpdating] = useState(false);

  const filteredProducts = products.filter((p: Product) => {
    if (selectedCategory === "all") return true;
    return p.category === selectedCategory || p.categorySlug === selectedCategory;
  });

  const parseNumPrice = (priceStr?: string) => {
    if (!priceStr) return 0;
    const cleaned = String(priceStr).replace(/\./g, "").replace(",", ".").replace(/[^0-9.]/g, "");
    return parseFloat(cleaned) || 0;
  };

  const calculateNewPrice = (currentPriceStr: string) => {
    const basePrice = parseNumPrice(currentPriceStr);
    if (basePrice === 0) return 0;

    let newP = basePrice;
    if (actionType === "percentage_increase") {
      newP = basePrice * (1 + amountValue / 100);
    } else if (actionType === "percentage_decrease") {
      newP = basePrice * (1 - amountValue / 100);
    } else if (actionType === "fixed_increase") {
      newP = basePrice + amountValue;
    } else if (actionType === "fixed_decrease") {
      newP = Math.max(0, basePrice - amountValue);
    }

    return Math.round(newP);
  };

  const handleApplyBulkUpdate = async () => {
    if (!confirm(`Seçili ${filteredProducts.length} adet ürünün fiyatı toplu olarak güncellenecektir. Onaylıyor musunuz?`)) return;

    setUpdating(true);
    let count = 0;
    for (const p of filteredProducts) {
      const newPriceNum = calculateNewPrice(p.price);
      const newPriceStr = `${newPriceNum.toLocaleString("tr-TR")} ₺`;
      await updateProduct(p.id, { price: newPriceStr });
      count++;
    }

    setUpdating(false);
    setToastMsg(`✅ ${count} adet ürünün fiyatı başarıyla toplu olarak güncellendi!`);
    setTimeout(() => setToastMsg(""), 4000);
  };

  const handleExportCsv = () => {
    const headers = ["ID", "Ürün Adı", "Kategori", "Mevcut Fiyat"];
    const rows = filteredProducts.map((p: Product) => [p.id, `"${p.title.replace(/"/g, '""')}"`, `"${p.category}"`, `"${p.price}"`]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e: string[]) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cicekce_fiyat_listesi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans">
        {/* HEADER */}
        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="text-xs font-black uppercase text-amber-900 tracking-wider mb-1 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-[#2b2623]" /> TOPLU FİYAT & İNDİRİM YÖNETİMİ
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900">Toplu Ürün Fiyatı Güncelleme Paneli</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Sevgililer Günü, Öğretmenler Günü gibi yoğun dönemler öncesinde tüm ürünlerin fiyatlarını tek tıkla % oranlı veya sabit TL zam/indirim ile güncelleyin.
            </p>
          </div>
          <button
            onClick={handleExportCsv}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-2xl font-extrabold text-xs shadow-sm transition flex items-center gap-2 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Excel / CSV İndir</span>
          </button>
        </div>

        {toastMsg && (
          <div className="p-4 bg-emerald-50 text-emerald-950 border border-emerald-300 text-xs rounded-2xl font-black flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* BULK ACTION CONTROLS BOX */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b pb-3">
            <Layers className="w-4 h-4 text-[#2b2623]" /> Toplu İşlem Kriterleri
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hedef Kategori:</label>
              <select
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 outline-none focus:ring-2 focus:ring-[#2b2623]"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">Tüm Kategoriler ({products.length} Ürün)</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Action Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">İşlem Türü:</label>
              <select
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 outline-none focus:ring-2 focus:ring-[#2b2623]"
                value={actionType}
                onChange={(e) => setActionType(e.target.value as any)}
              >
                <option value="percentage_increase">📈 Yüzde Zam Yap (%)</option>
                <option value="percentage_decrease">📉 Yüzde İndirim Yap (%)</option>
                <option value="fixed_increase">➕ Sabit Fiyat Artır (TL)</option>
                <option value="fixed_decrease">➖ Sabit Fiyat İndir (TL)</option>
              </select>
            </div>

            {/* Amount Value */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Miktar / Oran:</label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-[#2b2623]"
                value={amountValue}
                onChange={(e) => setAmountValue(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end border-t">
            <button
              type="button"
              onClick={handleApplyBulkUpdate}
              disabled={updating}
              style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
              className="hover:opacity-95 px-6 py-3 rounded-2xl font-black text-xs shadow-md transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{updating ? "Fiyatlar Güncelleniyor..." : `Seçili ${filteredProducts.length} Ürünün Fiyatını Güncelle`}</span>
            </button>
          </div>
        </div>

        {/* PRODUCTS PREVIEW TABLE */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-slate-50 text-[11px] font-black text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4">Ürün</th>
                  <th className="px-4 py-4">Kategori</th>
                  <th className="px-4 py-4 text-center">Mevcut Fiyat</th>
                  <th className="px-4 py-4 text-center">Hesaplanan Yeni Fiyat</th>
                  <th className="px-5 py-4 text-right">Fark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredProducts.map((p: Product) => {
                  const currentP = parseNumPrice(p.price);
                  const newP = calculateNewPrice(p.price);
                  const diff = newP - currentP;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-4 font-extrabold text-slate-900 flex items-center gap-3">
                        <img src={p.image} alt={p.title} className="w-10 h-10 rounded-xl object-cover border shrink-0" />
                        <div>
                          <div>{p.title}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Kod: {p.code || `DM${p.id}`}</div>
                        </div>
                      </td>

                      <td className="px-4 py-4 font-bold text-slate-600">
                        {p.category}
                      </td>

                      <td className="px-4 py-4 text-center font-black text-slate-800">
                        {p.price}
                      </td>

                      <td className="px-4 py-4 text-center font-black text-emerald-800 text-sm">
                        {newP.toLocaleString("tr-TR")} ₺
                      </td>

                      <td className="px-5 py-4 text-right font-black">
                        {diff > 0 ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-flex items-center gap-0.5">
                            <ArrowUpRight className="w-3.5 h-3.5" /> +{diff.toLocaleString("tr-TR")} ₺
                          </span>
                        ) : diff < 0 ? (
                          <span className="text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 inline-flex items-center gap-0.5">
                            <ArrowDownRight className="w-3.5 h-3.5" /> {diff.toLocaleString("tr-TR")} ₺
                          </span>
                        ) : (
                          <span className="text-slate-400">Değişim Yok</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
