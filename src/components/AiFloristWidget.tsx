"use client";

import { useState } from "react";
import { Flower2, Sparkles, MessageCircle, X, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/lib/store";

export default function AiFloristWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { products, addToCart } = useStore();
  const [messages, setMessages] = useState<Array<{ sender: "bot" | "user"; text: string; prods?: any[] }>>([
    {
      sender: "bot",
      text: "Merhaba! 🌸 Ben Çiçekçe Sanal Florist Asistanıyım. Kime, hangi özel gün için çiçek arıyorsunuz? Size en uygun aranjmanı 3 saniyede bulabilirim!",
    },
  ]);
  const [inputVal, setInputVal] = useState("");

  const handleOptionClick = (promptText: string, filterCategory: string) => {
    const userMsg = { sender: "user" as const, text: promptText };
    const matchingProds = products
      .filter((p: any) => {
        if (!filterCategory) return true;
        const catName = (p.category || "").toLowerCase();
        const titleName = (p.title || "").toLowerCase();
        const term = filterCategory.toLowerCase();
        return catName.includes(term) || titleName.includes(term);
      })
      .slice(0, 3);

    const botMsg = {
      sender: "bot" as const,
      text: `Aradığınız kriterlere en uygun taze çiçek seçeneklerimiz:`,
      prods: matchingProds.length > 0 ? matchingProds : products.slice(0, 3),
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const query = inputVal.trim();
    setInputVal("");

    const userMsg = { sender: "user" as const, text: query };
    const matching = products
      .filter((p: any) => {
        const q = query.toLowerCase();
        return (
          (p.title || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q)
        );
      })
      .slice(0, 3);

    const botMsg = {
      sender: "bot" as const,
      text: `"${query}" isteğiniz doğrultusunda floristlerimizin sizin için özenle seçtiği tavsiyeler:`,
      prods: matching.length > 0 ? matching : products.slice(0, 3),
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
          className="hover:opacity-95 p-4 rounded-full shadow-2xl transition flex items-center gap-2 group ring-4 ring-amber-500/20"
        >
          <div className="relative">
            <Flower2 className="w-6 h-6 text-amber-300 animate-spin-slow" />
            <Sparkles className="w-3 h-3 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <span className="font-extrabold text-xs tracking-wide hidden sm:inline-block pr-1">
            Yapay Zeka Florist
          </span>
        </button>
      </div>

      {/* Interactive Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden font-sans flex flex-col max-h-[540px] animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div style={{ backgroundColor: "#2b2623", color: "#ffffff" }} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-400/30">
                <Flower2 className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="font-extrabold text-sm flex items-center gap-1.5">
                  <span>Sanal Florist Asistanı</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                </div>
                <div className="text-[10px] text-amber-200/80 font-medium">7/24 Akıllı Hediye Öneri Servisi</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-white transition text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-[#FAF6F0]/60 text-xs">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed shadow-2xs ${
                    m.sender === "user"
                      ? "bg-[#2b2623] text-white font-semibold rounded-br-none"
                      : "bg-white text-slate-800 border border-slate-200/80 font-medium rounded-bl-none"
                  }`}
                >
                  {m.text}
                </div>

                {/* Product Cards Attachment */}
                {m.prods && m.prods.length > 0 && (
                  <div className="w-full space-y-2 mt-2">
                    {m.prods.map((p: any) => (
                      <div key={p.id} className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
                        <img src={p.image} alt={p.title} className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-slate-900 text-xs truncate">{p.title}</div>
                          <div className="text-emerald-700 font-black text-xs">{p.price}</div>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              addToCart(p);
                              alert(`"${p.title}" sepetinize eklendi!`);
                            }}
                            className="bg-[#2b2623] hover:opacity-90 text-white text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs"
                          >
                            <ShoppingBag className="w-3 h-3" /> Ekle
                          </button>
                          <Link
                            href={`/urun/${p.slug || p.id}`}
                            className="text-[10px] font-bold text-slate-600 hover:underline text-center"
                          >
                            İncele ↗
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Filter Pill Buttons */}
          <div className="p-2 bg-white border-t border-slate-100 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleOptionClick("❤️ Sevgiliye Kırmızı Gül Buketleri", "gül")}
              className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-red-50 text-red-900 border border-red-200 hover:bg-red-100 transition"
            >
              ❤️ Sevgiliye Gül Buketleri
            </button>
            <button
              type="button"
              onClick={() => handleOptionClick("🪴 Anneye Saksı & Orkide Çiçekleri", "orkide")}
              className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100 transition"
            >
              🪴 Orkide & Saksı
            </button>
            <button
              type="button"
              onClick={() => handleOptionClick("🎉 Doğum Günü Aranjmanları", "buket")}
              className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition"
            >
              🎉 Doğum Günü Buketleri
            </button>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-2 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-[#2b2623]"
              placeholder="Örn: 2000 TL bütçem var, ne önerirsin?"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
            <button
              type="submit"
              style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
              className="p-2.5 rounded-xl font-bold hover:opacity-90 transition shrink-0"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
