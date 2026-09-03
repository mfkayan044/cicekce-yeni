"use client";

import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getInitialDbData } from "@/lib/server-settings";

const _pageDb = getInitialDbData();
const _initialBlogs = _pageDb.blogs || [];

export default function BlogHubPage() {
  const [blogs, setBlogs] = useState<any[]>(_initialBlogs);

  useEffect(() => {
    fetch("/api/blog")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setBlogs(data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between font-sans">
      <div>
        <StoreHeader />

        {/* Blog Hero Banner */}
        <div className="bg-white border-b py-10 shadow-xs">
          <div className="max-w-[1400px] mx-auto px-4 lg:px-6 text-center space-y-3">
            <nav className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
              <Link href="/" className="hover:text-[#2b2623] transition">Anasayfa</Link>
              <span>›</span>
              <span className="font-bold text-slate-800">Çiçek Rehberi & Blog</span>
            </nav>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900">Çiçek Rehberi & Bakım İpuçları</h1>
            <p className="text-sm text-slate-500 max-w-2xl mx-auto">
              Evde canlı çiçek bakımı, güllerin anlamları, aranjman tazeleme tüyoları ve sevdiklerinize en uygun çiçek seçimi rehberi.
            </p>
          </div>
        </div>

        {/* Blog Cards Grid */}
        <main className="max-w-[1400px] mx-auto px-4 lg:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <span style={{ backgroundColor: "#2b2623", color: "#ffffff" }} className="absolute top-3 left-3 text-[11px] font-extrabold px-3 py-1 rounded-full shadow-xs">
                      {post.category || "Çiçek Rehberi"}
                    </span>
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="text-xs text-slate-400 font-semibold">{post.date} • {post.views || 1} Okunma</div>
                    <h2 className="text-lg font-extrabold text-slate-900 group-hover:text-[#2b2623] transition line-clamp-2">
                      <Link href={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                      {post.summary || post.content}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-0">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-black text-[#2b2623] hover:underline"
                  >
                    <span>Devamını Oku</span>
                    <span>→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </main>
      </div>

      <StoreFooter />
    </div>
  );
}
