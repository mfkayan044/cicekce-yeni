"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function HeroDuzenlePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [badge, setBadge] = useState("");
  const [btnText, setBtnText] = useState("");
  const [link, setLink] = useState("");
  const [image, setImage] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/hero?id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setTitle(data.title || "");
          setSubtitle(data.subtitle || "");
          setBadge(data.badge || "");
          setBtnText(data.btn_text || data.btnText || "");
          setLink(data.link || "");
          setImage(data.image || "");
          setDisplayOrder(data.display_order || data.displayOrder || 0);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !image) return;

    try {
      setSaving(true);
      const res = await fetch("/api/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          title,
          subtitle,
          badge,
          btn_text: btnText,
          link,
          image,
          display_order: Number(displayOrder),
        }),
      });

      if (res.ok) {
        router.push("/yonetim/hero");
      }
    } catch (e) {
      alert("Güncelleme hatası oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/yonetim/hero" className="btn btn-outline-secondary btn-sm flex items-center gap-1 rounded-xl font-bold">
              ← Geri
            </Link>
            <h4 className="font-extrabold text-xl text-slate-800 m-0">Hero Slayt Düzenle (Supabase Canlı)</h4>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border">Slayt yükleniyor...</div>
        ) : (
          <form onSubmit={handleSubmit} className="card border-0 shadow-sm rounded-2xl p-6 bg-white space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Slayt Başlığı *</label>
              <input
                type="text"
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#2b2623]"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Alt Başlık / Açıklama</label>
              <input
                type="text"
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#2b2623]"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Rozet / İndirim Etiketi</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#2b2623]"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Buton Yazısı</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#2b2623]"
                  value={btnText}
                  onChange={(e) => setBtnText(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Hedef Link / URL *</label>
              <input
                type="text"
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#2b2623]"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Görsel URL *</label>
              <input
                type="text"
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#2b2623]"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Görüntülenme Sırası</label>
              <input
                type="number"
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#2b2623]"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Link href="/yonetim/hero" className="btn btn-light px-5 py-3 rounded-xl text-xs font-bold">
                İptal
              </Link>
              <button
                type="submit"
                disabled={saving}
                style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                className="px-8 py-3.5 rounded-xl font-extrabold text-sm shadow-md hover:opacity-95 transition"
              >
                {saving ? "Kaydediliyor..." : "Supabase'de Güncelle"}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
