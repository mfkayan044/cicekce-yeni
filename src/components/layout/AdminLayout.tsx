"use client";

import AdminSidebar from "./AdminSidebar";
import AdminNavbar from "./AdminNavbar";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const sneatCssFiles = [
      "/sneat/assets/vendor/fonts/boxicons.css",
      "/sneat/assets/vendor/css/rtl/core.css",
      "/sneat/assets/vendor/css/rtl/theme-default.css",
      "/sneat/assets/css/demo.css",
      "/sneat/assets/vendor/libs/perfect-scrollbar/perfect-scrollbar.css",
    ];

    const addedElements: HTMLLinkElement[] = [];

    sneatCssFiles.forEach((href) => {
      let existing = document.querySelector(`link[href="${href}"]`) as HTMLLinkElement;
      if (!existing) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
        addedElements.push(link);
      }
    });
  }, []);

  return (
    <div className="layout-wrapper layout-content-navbar min-h-screen">
      <div className="layout-container">
        <AdminSidebar />
        <div className="layout-page">
          <AdminNavbar />
          <div className="content-wrapper">
            <div className="container-xxl flex-grow-1 container-p-y px-4 py-3">
              {children}
            </div>
            <footer className="content-footer footer bg-footer-theme py-3 mt-auto border-t bg-white">
              <div className="container-xxl flex flex-wrap justify-between items-center text-xs text-slate-500 px-4">
                <div>
                  © {new Date().getFullYear()} <strong className="text-primary">Çiçekçe</strong> — Tüm Hakları Saklıdır.
                </div>
                <div className="flex gap-3">
                  <a href="/" target="_blank" className="hover:underline">
                    Mağaza Vitrini
                  </a>
                  <span>•</span>
                  <span>v2.4.0-pro</span>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
