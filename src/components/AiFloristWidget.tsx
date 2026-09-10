"use client";

import { useState, useRef, useEffect } from "react";
import { Flower2, Sparkles, X, ShoppingBag, ArrowRight, Copy, Check, MessageSquareHeart } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/lib/store";

interface MessageItem {
  sender: "bot" | "user";
  text: string;
  recommendedProduct?: any;
  cardNoteAdvice?: string;
  source?: string;
}

export default function AiFloristWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { products, categories, addToCart } = useStore();
  const [loading, setLoading] = useState(false);
  const [copiedNote, setCopiedNote] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<MessageItem[]>([
    {
      sender: "bot",
      text: "Merhaba! 🌸 Ben Çiçekçe Sanal Florist Asistanıyım (Gemini AI destekli). Kime, hangi özel gün için çiçek arıyorsunuz? Sizin için nokta atışı aranjmanı ve yanına özel kart notunu saniyeler içinde hazırlayabilirim!",
    },
  ]);
  const [inputVal, setInputVal] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, loading, isOpen]);

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    const userMsg: MessageItem = { sender: "user", text: queryText };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: queryText }),
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: MessageItem = {
          sender: "bot",
          text: data.reply || "İsteğiniz doğrultusunda özel tavsiyelerimiz hazırladı:",
          recommendedProduct: data.recommendedProduct,
          cardNoteAdvice: data.cardNoteAdvice,
          source: data.source,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const matching = products.filter((p: any) =>
          (p.title || "").toLowerCase().includes(queryText.toLowerCase()) ||
          (p.category || "").toLowerCase().includes(queryText.toLowerCase())
        );
        const botMsg: MessageItem = {
          sender: "bot",
          text: `"${queryText}" isteğiniz için öne çıkan çiçeklerimiz:`,
          recommendedProduct: matching[0] || products[0],
          cardNoteAdvice: "💡 Kart Notu Tavsiyesi: 'Bu özel günde tüm sevginiz ve neşeniz daim olsun!'",
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (e) {
      const botMsg: MessageItem = {
        sender: "bot",
        text: "Sizin için seçtiğimiz harika ürün önerisi:",
        recommendedProduct: products[0],
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    const query = inputVal.trim();
    setInputVal("");
    sendQuery(query);
  };

  const handleQuickPill = (promptText: string) => {
    sendQuery(promptText);
  };

  const handleUseCardNote = (noteText: string) => {
    try {
      const cleanNote = noteText.replace(/^💡\s*Kart Notu Tavsiyesi:\s*['"]?|['"]?$/g, "").trim();
      localStorage.setItem("pro_flower_card_note", cleanNote);
      setCopiedNote(cleanNote);
      setTimeout(() => setCopiedNote(null), 3000);
    } catch (e) {}
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
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden font-sans flex flex-col max-h-[560px] animate-in fade-in slide-in-from-bottom-4">
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
                <div className="text-[10px] text-amber-200/80 font-medium flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Gemini AI ile 7/24 Canlı Öneri
                </div>
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
                  className={`p-3 rounded-2xl max-w-[88%] leading-relaxed shadow-2xs ${
                    m.sender === "user"
                      ? "bg-[#2b2623] text-white font-semibold rounded-br-none"
                      : "bg-white text-slate-800 border border-slate-200/80 font-medium rounded-bl-none"
                  }`}
                >
                  {m.text}
                </div>

                {/* Recommended Product Card */}
                {m.recommendedProduct && (
                  <div className="w-full mt-2 p-3 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={m.recommendedProduct.image || "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300"}
                        alt={m.recommendedProduct.title}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-slate-900 text-xs truncate">
                          {m.recommendedProduct.title}
                        </div>
                        <div className="text-emerald-700 font-black text-xs">
                          {m.recommendedProduct.price}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          Kategori: {m.recommendedProduct.category || "Çiçek"}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          addToCart(m.recommendedProduct);
                          alert(`"${m.recommendedProduct.title}" sepetinize eklendi!`);
                        }}
                        className="flex-1 bg-[#2b2623] hover:opacity-90 text-white text-[11px] font-black py-1.5 rounded-xl flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Sepete Ekle
                      </button>
                      <Link
                        href={`/urun/${m.recommendedProduct.slug || m.recommendedProduct.id}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl flex items-center justify-center"
                      >
                        İncele ↗
                      </Link>
                    </div>
                  </div>
                )}

                {/* Recommended Card Note */}
                {m.cardNoteAdvice && (
                  <div className="w-full mt-2 p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-[11px] text-amber-950 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-extrabold text-amber-900">
                      <MessageSquareHeart className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>Florist Kart Notu Tavsiyesi:</span>
                    </div>
                    <p className="italic text-amber-900/90 leading-snug">{m.cardNoteAdvice}</p>
                    <button
                      type="button"
                      onClick={() => handleUseCardNote(m.cardNoteAdvice!)}
                      className="w-full py-1 bg-amber-900 text-amber-50 hover:bg-amber-950 text-[10px] font-black rounded-lg transition flex items-center justify-center gap-1"
                    >
                      {copiedNote === m.cardNoteAdvice?.replace(/^💡\s*Kart Notu Tavsiyesi:\s*['"]?|['"]?$/g, "").trim() ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-300" /> Siparişe Kaydedildi!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Sipariş Kart Notuma Ekle
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Typing Animation */}
            {loading && (
              <div className="flex items-center gap-2 text-slate-500 p-2 bg-white rounded-2xl border border-slate-200 w-fit animate-pulse">
                <Flower2 className="w-4 h-4 text-amber-500 animate-spin" />
                <span className="font-bold text-[11px]">Floristiniz önerileri hazırlıyor...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Filter Pill Buttons */}
          <div className="p-2 bg-white border-t border-slate-100 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => handleQuickPill("✍️ Sevgilime romantik bir kart notu önerir misin?")}
              className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-rose-50 text-rose-900 border border-rose-200 hover:bg-rose-100 transition shadow-2xs"
            >
              ✍️ Kart Notu Yaz
            </button>
            <button
              type="button"
              onClick={() => handleQuickPill("❤️ Sevgilimin gönlünü alacak romantik bir buket arıyorum")}
              className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-red-50 text-red-900 border border-red-200 hover:bg-red-100 transition shadow-2xs"
            >
              ❤️ Sevgiliye & Özür
            </button>
            <button
              type="button"
              onClick={() => handleQuickPill("🎂 Doğum günü için neşeli ve renkli bir çiçek önerisi")}
              className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition shadow-2xs"
            >
              🎂 Doğum Günü
            </button>
            <button
              type="button"
              onClick={() => handleQuickPill("💰 Bütçeme en uygun uygun fiyatlı çiçekler hangileri?")}
              className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition shadow-2xs"
            >
              💰 Uygun Fiyatlı
            </button>
            <button
              type="button"
              onClick={() => handleQuickPill("🪴 Ev ve ofis için uzun ömürlü saksı çiçeği veya orkide önerir misin?")}
              className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100 transition shadow-2xs"
            >
              🪴 Saksı & Orkide
            </button>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-2 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              disabled={loading}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-[#2b2623] disabled:opacity-60"
              placeholder="Örn: Anneme neşeli doğum günü çiçeği..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
              className="p-2.5 rounded-xl font-bold hover:opacity-90 transition shrink-0 disabled:opacity-50"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
