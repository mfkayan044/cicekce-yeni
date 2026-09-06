"use client";

import React, { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";

interface Message {
  sender: "bot" | "user";
  text: string;
  recommendedProduct?: any;
  cardNoteAdvice?: string;
}

export default function OrderAssistantModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { products, setSingleCartItem } = useStore();
  const [sessionId] = useState(() => `CHAT-${Math.floor(100000 + Math.random() * 900000)}`);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Merhaba! Ben Demo Çiçekçilik Akıllı Sipariş Asistanı. 🌸 Sevdikleriniz için en doğru çiçeği seçmenize ve özel kart notu hazırlamanıza yardımcı olmaktan mutluluk duyarım. Kime veya hangi özel gün için çiçek arıyorsunuz?",
    },
  ]);
  const [input, setInput] = useState("");
  const [usedProductIds, setUsedProductIds] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sync active chat session to backend API on message updates
  const syncChatToBackend = async (currentMessages: Message[], status = "Devam Ediyor") => {
    try {
      const lastUserMsg = [...currentMessages].reverse().find(m => m.sender === "user")?.text || "Sohbet başlatıldı";
      await fetch("/api/assistant-chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sessionId,
          visitor: `Ziyaretçi (#${sessionId.slice(-4)})`,
          msgCount: currentMessages.length,
          lastMsg: lastUserMsg,
          status,
          messages: currentMessages.map(m => ({
            sender: m.sender,
            text: m.text,
            time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
          })),
        }),
      });
    } catch (e) {}
  };

  const [isTyping, setIsTyping] = useState(false);

  const getPriceNum = (str: string | number) => {
    const digits = String(str).replace(/[^\d]/g, "");
    return parseInt(digits, 10) || 0;
  };

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const userText = textToSend || input;
    if (!userText.trim()) return;

    const newMessages: Message[] = [...messages, { sender: "user", text: userText }];
    setMessages(newMessages);
    if (!textToSend) setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: newMessages.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedMsgs: Message[] = [
          ...newMessages,
          {
            sender: "bot",
            text: data.reply || "Sizin için en güzel çiçeğimizi hazırlamaktan mutluluk duyarız!",
            recommendedProduct: data.recommendedProduct,
            cardNoteAdvice: data.cardNoteAdvice,
          },
        ];
        setMessages(updatedMsgs);
        syncChatToBackend(updatedMsgs, "Tamamlandı");
      } else {
        throw new Error("Assistant API error");
      }
    } catch (e) {
      const fallbackMsg: Message = {
        sender: "bot",
        text: "Zarafeti ve tazeliğiyle sevdiklerinizi çok mutlu edecek özel tasarımımızı sizin için seçtik. 🌸",
        recommendedProduct: products[0],
        cardNoteAdvice: "💡 Kart Notu Tavsiyesi: 'Varlığınla hayatımı güzelleştirdiğin için teşekkür ederim. İyi ki varsın! ❤️'",
      };
      const updatedMsgs = [...newMessages, fallbackMsg];
      setMessages(updatedMsgs);
      syncChatToBackend(updatedMsgs, "Tamamlandı");
    } finally {
      setIsTyping(false);
    }
  };

  const handleBuyNow = (prod: any) => {
    setSingleCartItem(prod, 1, []);
    try {
      localStorage.setItem("pro_flower_cart", JSON.stringify([{ product: prod, quantity: 1 }]));
    } catch (e) {}

    syncChatToBackend(messages, "Siparişe Dönüştü");
    window.location.href = "/odeme";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full h-[620px] max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 relative">
        {/* Chat Header */}
        <div style={{ backgroundColor: "#2b2623" }} className="p-4 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
              🎧
            </div>
            <div>
              <h3 className="font-extrabold text-sm leading-tight">Sipariş Asistanı (AI Live Chat)</h3>
              <div className="text-[10px] text-emerald-100 flex items-center gap-1 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span> Canlı ve Çevrimiçi
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-3 bg-slate-50 border-b flex gap-1.5 overflow-x-auto text-[11px] font-bold">
          <button
            onClick={() => handleSend("Anneme Doğum Günü Buketi Arıyorum")}
            className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-[#2b2623] hover:text-[#2b2623] transition whitespace-nowrap"
          >
            🎂 Anneye Doğum Günü Buketi
          </button>
          <button
            onClick={() => handleSend("Sevgilime Kendimi Affettirmek İçin Özür Çiçeği")}
            className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-[#2b2623] hover:text-[#2b2623] transition whitespace-nowrap"
          >
            🌹 Sevgilime Özür Çiçeği
          </button>
          <button
            onClick={() => handleSend("İş Arkadaşıma Yeni Görev Tebrik Çiçeği")}
            className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-[#2b2623] hover:text-[#2b2623] transition whitespace-nowrap"
          >
            💼 İş Arkadaşına Tebrik
          </button>
          <button
            onClick={() => handleSend("Evlilik Yıldönümü Şık Aranjman")}
            className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-[#2b2623] hover:text-[#2b2623] transition whitespace-nowrap"
          >
            💍 Evlilik Yıldönümü
          </button>
          <button
            onClick={() => handleSend("Hastanedeki Yakınıma Geçmiş Olsun Çiçeği")}
            className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-[#2b2623] hover:text-[#2b2623] transition whitespace-nowrap"
          >
            🏥 Geçmiş Olsun
          </button>
        </div>

        {/* Message Trajectory Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#FAF6F0]">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}>
              <div
                style={
                  m.sender === "user"
                    ? { backgroundColor: "#2b2623", color: "#ffffff" }
                    : { backgroundColor: "#ffffff", color: "#1e293b" }
                }
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm font-medium shadow-xs border border-slate-100/80 ${
                  m.sender === "user" ? "rounded-tr-none" : "rounded-tl-none"
                }`}
              >
                {m.text}
              </div>

              {/* Optional Card Note Advice */}
              {m.cardNoteAdvice && (
                <div className="mt-2 text-[11px] font-semibold text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200/80 max-w-[85%]">
                  {m.cardNoteAdvice}
                </div>
              )}

              {/* Interactive Recommended Product Card */}
              {m.recommendedProduct && (
                <div className="mt-3 bg-white p-3 rounded-2xl border border-amber-900/15 shadow-sm max-w-[85%] space-y-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={m.recommendedProduct.image}
                      alt={m.recommendedProduct.title}
                      className="w-16 h-16 object-cover rounded-xl border bg-slate-50"
                    />
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs line-clamp-1">{m.recommendedProduct.title}</h4>
                      <div style={{ color: "#2b2623" }} className="font-black text-sm mt-0.5">{m.recommendedProduct.price}</div>
                      <div className="text-[10px] text-[#2b2623] font-bold">✓ Aynı Gün Taze Kurye Teslimatı</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuyNow(m.recommendedProduct)}
                    style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                    className="w-full py-2.5 rounded-xl font-extrabold text-xs shadow-xs hover:opacity-95 transition flex items-center justify-center gap-1"
                  >
                    <span>🛒 Hemen Sipariş Ver →</span>
                  </button>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-2xl w-fit border border-amber-900/10 shadow-xs">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-amber-800 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-amber-800 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-amber-800 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span className="text-[11px] font-medium text-slate-600">Asistan düşünüyor ve çiçek seçiyor...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Footer Bar */}
        <div className="p-3 bg-white border-t flex items-center gap-2">
          <input
            type="text"
            className="flex-1 p-3 border border-slate-200 rounded-2xl text-xs sm:text-sm outline-none focus:border-[#2b2623]"
            placeholder="Mesajınızı yazın... (Örn: Anneme, Sevgilime, Doğum günü vb.)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={() => handleSend()}
            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
            className="p-3 rounded-2xl font-bold text-xs shadow-xs hover:opacity-95 transition"
          >
            Gönder
          </button>
        </div>
      </div>
    </div>
  );
}
