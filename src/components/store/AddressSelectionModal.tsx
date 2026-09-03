"use client";

import { useState, useEffect } from "react";

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (addressText: string) => void;
  warningBanner?: boolean;
}

export default function AddressSelectionModal({ isOpen, onClose, onSelectAddress, warningBanner }: AddressModalProps) {
  const [activeCities, setActiveCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [selectedNeighId, setSelectedNeighId] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    async function loadActiveRegions() {
      try {
        const res = await fetch("/api/regions?storefront=true");
        if (res.ok) {
          const data = await res.json();
          setActiveCities(data);
          if (data.length > 0) {
            setSelectedCityId(data[0].id);
            if (data[0].districts && data[0].districts.length > 0) {
              setSelectedDistrictId(data[0].districts[0].id);
              if (data[0].districts[0].neighborhoods && data[0].districts[0].neighborhoods.length > 0) {
                setSelectedNeighId(data[0].districts[0].neighborhoods[0].id);
              }
            }
          }
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    }
    loadActiveRegions();
  }, [isOpen]);

  if (!isOpen) return null;

  const currentCity = activeCities.find((c) => String(c.id) === String(selectedCityId));
  const districts = currentCity?.districts || [];
  const currentDistrict = districts.find((d: any) => String(d.id) === String(selectedDistrictId));
  const neighborhoods = currentDistrict?.neighborhoods || [];

  const handleConfirm = () => {
    if (!currentCity) return;
    const distName = currentDistrict?.name || "Merkez";
    const neighName = neighborhoods.find((n: any) => String(n.id) === String(selectedNeighId))?.name || "Merkez Mah.";

    const fullAddress = `${currentCity.name} / ${distName} / ${neighName}`;
    onSelectAddress(fullAddress);
    try {
      localStorage.setItem("pro_flower_delivery_address", fullAddress);
    } catch (e) {}
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📍</span>
            <h5 className="font-extrabold text-base text-slate-800 m-0">Teslimat Bölgesi Seçiniz</h5>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold hover:bg-slate-200 transition"
          >
            ✕
          </button>
        </div>

        {warningBanner && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 font-extrabold flex items-center gap-2 animate-pulse">
            <span className="text-base">⚠️</span>
            <span>Lütfen sipariş işlemine devam edebilmek için önce teslimat şehrinizi, ilçenizi ve mahallenizi seçiniz!</span>
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-sm">Aktif teslimat bölgeleri yükleniyor...</div>
        ) : activeCities.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-sm">
            Şu anda siparişe açık aktif bir teslimat bölgesi bulunmamaktadır.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">İl Seçiniz *</label>
              <select
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#2b2623]"
                value={selectedCityId}
                onChange={(e) => {
                  const cId = e.target.value;
                  setSelectedCityId(cId);
                  const c = activeCities.find((ct) => String(ct.id) === String(cId));
                  if (c && c.districts && c.districts.length > 0) {
                    setSelectedDistrictId(c.districts[0].id);
                    if (c.districts[0].neighborhoods && c.districts[0].neighborhoods.length > 0) {
                      setSelectedNeighId(c.districts[0].neighborhoods[0].id);
                    } else {
                      setSelectedNeighId("");
                    }
                  } else {
                    setSelectedDistrictId("");
                    setSelectedNeighId("");
                  }
                }}
              >
                {activeCities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Siparişe Açık)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">İlçe Seçiniz *</label>
              <select
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#2b2623]"
                value={selectedDistrictId}
                onChange={(e) => {
                  const dId = e.target.value;
                  setSelectedDistrictId(dId);
                  const d = districts.find((dist: any) => String(dist.id) === String(dId));
                  if (d && d.neighborhoods && d.neighborhoods.length > 0) {
                    setSelectedNeighId(d.neighborhoods[0].id);
                  } else {
                    setSelectedNeighId("");
                  }
                }}
              >
                {districts.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {neighborhoods.length > 0 && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Mahalle Seçiniz *</label>
                <select
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#2b2623]"
                  value={selectedNeighId}
                  onChange={(e) => setSelectedNeighId(e.target.value)}
                >
                  {neighborhoods.map((n: any) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="pt-3 flex justify-end gap-2 border-t">
              <button type="button" onClick={onClose} className="btn btn-light px-4 py-2.5 text-xs font-bold rounded-xl">
                İptal
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                className="px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-md hover:opacity-95 transition"
              >
                Adresi Onayla ve Kaydet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
