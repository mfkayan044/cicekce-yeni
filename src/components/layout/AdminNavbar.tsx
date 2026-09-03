"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

// Synthesize loud beep ringtone into HTML5 Audio Data URI for 100% background playback in Chrome
function generateRingtoneAudioUrl() {
  const sampleRate = 22050;
  const duration = 1.8; // 1.8 seconds loud ringing
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(numSamples);

  // Generate 4 bursts of (880Hz / 1046.5Hz) double chime
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const burstIndex = Math.floor(t / 0.4);
    const burstTime = t % 0.4;
    if (burstTime < 0.25) {
      const freq = burstIndex % 2 === 0 ? 880 : 1046.5;
      buffer[i] = Math.sin(2 * Math.PI * freq * t) * 0.5;
    } else {
      buffer[i] = 0;
    }
  }

  // Convert Float32 to 16-bit PCM WAV WAV Header
  const wavBuffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(wavBuffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + numSamples * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, numSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, buffer[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  const blob = new Blob([wavBuffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export default function AdminNavbar() {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [desktopNotifPermission, setDesktopNotifPermission] = useState<string>("default");
  const [newOrderAlert, setNewOrderAlert] = useState<any | null>(null);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/yonetim/giris");
      router.refresh();
    } catch (e) {
      router.push("/yonetim/giris");
    }
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const originalTitleRef = useRef<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      originalTitleRef.current = document.title || "Çiçekçe Yönetim Paneli";
      if ("Notification" in window) {
        setDesktopNotifPermission(Notification.permission);
      }

      // Initialize HTML5 Audio Element
      const ringtoneUrl = generateRingtoneAudioUrl();
      const audio = new Audio(ringtoneUrl);
      audio.volume = 1.0;
      audioRef.current = audio;

      // Start Web Worker for background polling (Web Workers continue running when tab is hidden!)
      try {
        const worker = new Worker("/order-worker.js");
        workerRef.current = worker;

        worker.onmessage = (e) => {
          if (e.data && e.data.type === "NEW_ORDER") {
            const latestOrder = e.data.order;

            // 1. PLAY HTML5 AUDIO IN BACKGROUND TAB
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(() => {
                // Fallback to Web Audio API
                try {
                  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                  ctx.resume();
                } catch (err) {}
              });
            }

            // 2. TRIGGER WINDOWS DESKTOP NOTIFICATION (Pops up over YouTube, Excel, etc.)
            if ("Notification" in window && Notification.permission === "granted") {
              const notif = new Notification(`🚨 YENİ SİPARİŞ ALINDI! #${latestOrder.id || "YENİ"}`, {
                body: `Tutar: ${latestOrder.totalAmount || latestOrder.totalPrice || ""} ₺ | Alıcı: ${latestOrder.recipientName || "Müşteri"}\nAdres: ${latestOrder.address || ""}`,
                icon: "/logo.jpg",
                requireInteraction: true,
              });

              notif.onclick = () => {
                window.focus();
                router.push("/yonetim/siparisler");
              };
            }

            // 3. FLASH TAB TITLE
            document.title = `(1) 🚨 YENİ SİPARİŞ! - #${latestOrder.id}`;
            setNewOrderAlert(latestOrder);
          }
        };
      } catch (err) {}
    }

    const handleFocus = () => {
      if (typeof window !== "undefined" && originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      if (workerRef.current) workerRef.current.terminate();
      window.removeEventListener("focus", handleFocus);
    };
  }, [router]);

  const requestDesktopNotificationPermission = async () => {
    // Unlock Audio playback on user click gesture
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => {
        audioRef.current?.pause();
      }).catch(() => {});
    }

    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      setDesktopNotifPermission(permission);
      if (permission === "granted") {
        new Notification("🔔 Arka Plan Zırrr Sesli Uarılar Aktif!", {
          body: "Artık YouTube, Excel veya başka sekmedeyken yeni sipariş geldiğinde Windows bildirimi ve zırrr sesi çalacaktır.",
          icon: "/logo.jpg",
        });
      } else {
        alert("Lütfen tarayıcınızın adres çubuğundaki kilit simgesine tıklayıp 'Bildirimler' iznini açın!");
      }
    }
  };

  const handleTestSoundAndPermission = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    requestDesktopNotificationPermission();
  };

  return (
    <nav
      className="layout-navbar container-xxl navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme my-3 px-4 shadow-sm rounded-2xl border border-slate-200/80 font-sans"
      id="layout-navbar"
    >
      <div className="layout-menu-toggle navbar-nav align-items-xl-center me-3 me-xl-0 d-xl-none">
        <a className="nav-item nav-link px-0 me-xl-4" href="#!">
          <i className="bx bx-menu bx-sm"></i>
        </a>
      </div>

      <div className="navbar-nav-right flex items-center justify-between w-full" id="navbar-collapse">
        {/* Search Bar */}
        <div className="navbar-nav align-items-center flex-grow-1">
          <div className="nav-item d-flex align-items-center w-full max-w-md">
            <i className="bx bx-search fs-4 lh-0 text-slate-400 me-2"></i>
            <input
              type="text"
              className="form-control border-0 shadow-none bg-transparent text-xs sm:text-sm font-semibold text-slate-800"
              placeholder="Panelde Ara... (Sipariş #, Müşteri, Ürün)"
              aria-label="Ara..."
            />
          </div>
        </div>

        {/* Floating New Order Sound Banner Alert */}
        {newOrderAlert && (
          <div className="fixed top-5 right-5 z-50 p-4 bg-[#2b2623] text-white rounded-3xl shadow-2xl border border-amber-500/50 flex items-center gap-3 animate-bounce">
            <div className="text-2xl animate-spin">🔔</div>
            <div>
              <div className="text-xs font-black text-amber-400 uppercase">🚨 YENİ SİPARİŞ GELİR GELMEZ UYARI!</div>
              <div className="text-sm font-extrabold">Sipariş #{newOrderAlert.id || "YENİ"} - {newOrderAlert.totalAmount || newOrderAlert.totalPrice || ""} ₺</div>
              <div className="text-[11px] text-slate-300">Alıcı: {newOrderAlert.recipientName || "Müşteri"}</div>
            </div>
            <button
              onClick={() => {
                setNewOrderAlert(null);
                if (typeof window !== "undefined" && originalTitleRef.current) {
                  document.title = originalTitleRef.current;
                }
              }}
              className="ml-2 px-3 py-1 bg-amber-500 text-slate-950 font-black rounded-xl text-xs hover:bg-amber-400 transition"
            >
              Tamam / İncele
            </button>
          </div>
        )}

        {/* Right Menu Icons */}
        <ul className="navbar-nav flex-row align-items-center ms-auto gap-3">
          {/* Desktop Notification & Sound Alarm Toggle */}
          <li className="nav-item">
            <button
              type="button"
              onClick={handleTestSoundAndPermission}
              style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
              className="px-3.5 py-2 rounded-xl text-xs font-black shadow-xs hover:opacity-90 transition flex items-center gap-2"
              title="Arka planda/başka sekmedeyken Windows masaüstü bildirimi ve Zırrr sesini aktifleştir/test et"
            >
              <span>🔔 Arka Plan Zırrr & Bildirim Aç</span>
              {desktopNotifPermission === "granted" && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>
          </li>

          {/* External Site Link */}
          <li className="nav-item">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-primary btn-sm flex items-center gap-1 rounded-xl text-xs font-bold"
            >
              <i className="bx bx-globe"></i>
              <span>Canlı Sitede Gör</span>
            </a>
          </li>

          {/* Notifications Dropdown */}
          <li className="nav-item dropdown-notifications navbar-dropdown dropdown me-1 relative">
            <button
              type="button"
              className="nav-link btn btn-icon rounded-circle relative bg-slate-100 hover:bg-slate-200"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <i className="bx bx-bell bx-sm text-slate-700"></i>
              <span className="badge bg-danger rounded-circle badge-dot absolute top-1 right-1 w-2 h-2"></span>
            </button>
            {showNotifications && (
              <div className="dropdown-menu dropdown-menu-end show absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-2xl p-4 border border-slate-200 z-50 font-sans">
                <div className="flex justify-between items-center pb-2 border-b">
                  <h6 className="font-extrabold text-sm text-slate-900 m-0">Canlı Bildirimler</h6>
                  <span className="badge bg-primary text-xs font-bold">2 Aktif</span>
                </div>
                <div className="py-2 text-xs space-y-2">
                  <div className="p-2.5 bg-amber-50 rounded-xl flex items-start gap-2 border border-amber-200">
                    <i className="bx bx-bell text-amber-700 text-lg"></i>
                    <div>
                      <div className="font-extrabold text-slate-900">Masaüstü & Arka Plan Ses Uarısı</div>
                      <div className="text-slate-500 font-medium">Başka sekmedeyken Windows bildirimi açılır.</div>
                    </div>
                  </div>
                  <div className="p-2.5 bg-blue-50 rounded-xl flex items-start gap-2 border border-blue-200">
                    <i className="bx bx-cart text-blue-700 text-lg"></i>
                    <div>
                      <div className="font-extrabold text-slate-900">Canlı Kurye Takibi</div>
                      <div className="text-slate-500 font-medium">Sipariş durumları anlık senkronize edilir.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </li>

          {/* User Profile */}
          <li className="nav-item navbar-dropdown dropdown-user dropdown relative">
            <button
              type="button"
              className="nav-link dropdown-toggle hide-arrow flex items-center gap-2 bg-transparent border-0"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="avatar avatar-online">
                <div style={{ backgroundColor: "#2b2623" }} className="w-9 h-9 rounded-circle text-white flex items-center justify-center font-black text-sm shadow-xs">
                  Ç
                </div>
              </div>
            </button>
            {showProfileMenu && (
              <div className="dropdown-menu dropdown-menu-end show absolute right-0 mt-2 w-56 bg-white shadow-xl rounded-2xl p-2 border border-slate-200 z-50">
                <div className="px-3 py-2 border-b">
                  <div className="font-black text-slate-900 text-sm">Demo Yöneticisi</div>
                  <div className="text-slate-400 text-xs font-semibold">Süper Admin</div>
                </div>
                <div className="pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition flex items-center gap-2"
                  >
                    <i className="bx bx-power-off text-base"></i>
                    <span>Çıkış Yap</span>
                  </button>
                </div>
              </div>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}
