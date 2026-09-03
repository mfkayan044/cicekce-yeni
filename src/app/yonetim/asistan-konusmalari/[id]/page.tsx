"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { use, useState, useEffect } from "react";

export default function AsistanKonusmaDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [chat, setChat] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChat() {
      try {
        const res = await fetch("/api/assistant-chats");
        if (res.ok) {
          const list = await res.json();
          const found = list.find((item: any) => item.id === id);
          if (found) setChat(found);
          else if (list.length > 0) setChat(list[0]);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    }
    loadChat();
  }, [id]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-slate-500">Asistan konuşması yükleniyor...</div>
      </AdminLayout>
    );
  }

  const record = chat || {
    visitor: "Ziyaretçi #9021 (Fatma Yılmaz)",
    date: "31.08.2026 15:30",
    status: "Siparişe Dönüştü",
    messages: [
      { sender: "user", text: "Merhaba sevgilim için doğum günü çiçeği ne alabilirim?", time: "15:28" },
      { sender: "bot", text: "Harika bir tercih! Sevgiliniz için özel tasarlanan 35 Beyaz Gerbera Buketi (3.500 ₺) en çok tercih edilen taze aranjmanımızdır.", time: "15:29" },
      { sender: "user", text: "Harika görünüyor, sipariş veriyorum.", time: "15:30" }
    ]
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/yonetim/asistan-konusmalari" className="btn btn-outline-secondary btn-sm rounded-lg text-xs font-bold px-3 py-1.5">
              ← Geri
            </Link>
            <div>
              <h4 className="font-bold text-lg text-slate-800 m-0">
                AI Asistan Sohbet Kaydı — <span className="text-[#2b2623]">{record.visitor}</span>
              </h4>
              <p className="text-xs text-slate-400 m-0">Tarih: {record.date} · Durum: {record.status}</p>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-xs rounded-2xl p-6 bg-white space-y-4">
          <h5 className="font-bold text-slate-800 border-b pb-3 text-sm flex items-center gap-2">
            <span>🎧</span> <span>Müşteri & AI Asistan Diyaloğu</span>
          </h5>

          <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border">
            {record.messages?.map((m: any, idx: number) => (
              <div key={idx} className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}>
                <div className="text-[10px] text-slate-400 font-bold mb-1">
                  {m.sender === "user" ? "Müşteri" : "AI Sipariş Asistanı"} ({m.time || "15:30"})
                </div>
                <div
                  style={
                    m.sender === "user"
                      ? { backgroundColor: "#2b2623", color: "#ffffff" }
                      : { backgroundColor: "#ffffff", color: "#1e293b" }
                  }
                  className="max-w-[80%] p-3 rounded-2xl text-xs font-medium border shadow-xs"
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
