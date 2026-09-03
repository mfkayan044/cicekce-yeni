"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { use } from "react";

export default function SiparisDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/yonetim/siparisler"
                className="btn btn-outline-secondary btn-sm flex items-center gap-1 rounded-lg"
              >
                <i className="bx bx-left-arrow-alt text-lg"></i>
                <span>Geri</span>
              </Link>
              <h4 className="font-bold text-xl text-slate-800 m-0">
                Sipariş Detayı — <span className="text-primary">#DM{id}</span>
              </h4>
            </div>
            <p className="text-xs text-slate-500 mt-1">Sipariş Tarihi: 29.08.2026 21:16 · Ödeme Durumu: Ödendi</p>
          </div>

          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm flex items-center gap-1 rounded-lg">
              <i className="bx bx-printer"></i>
              <span>Yazdır / PDF</span>
            </button>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card border-0 shadow-sm rounded-xl p-5 bg-white space-y-4">
            <h5 className="font-bold text-slate-800 text-base border-b pb-3 flex items-center gap-2">
              <i className="bx bx-cart text-primary"></i>
              <span>Sipariş İçeriği ve Ürünler</span>
            </h5>

            <table className="table align-middle w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-2">Ürün</th>
                  <th className="px-4 py-2">Adet</th>
                  <th className="px-4 py-2 text-end">Tutar</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    101 Karışık Renk Gülden Buket
                  </td>
                  <td className="px-4 py-3">1</td>
                  <td className="px-4 py-3 font-bold text-end">15.000 ₺</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl text-sm font-bold border">
              <span>Toplam Ödenecek Tutar:</span>
              <span className="text-primary text-xl">15.000 ₺</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card border-0 shadow-sm rounded-xl p-5 bg-white space-y-3">
              <h5 className="font-bold text-slate-800 text-base border-b pb-3">Müşteri & Alıcı</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-slate-500">Alıcı:</span>
                  <span className="font-bold">tekekt</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-slate-500">Telefon:</span>
                  <span className="font-semibold text-primary">0554 555 00 00</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Teslimat Adresi:</span>
                  <span className="font-semibold text-slate-700">Istanbul Airport, Terminal Cad. No:1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
