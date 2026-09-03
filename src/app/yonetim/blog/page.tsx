"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/blog");
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" başlıklı blog yazısını silmek istediğinizden emin misiniz?`)) return;

    try {
      const res = await fetch(`/api/blog?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setPosts(posts.filter((p) => p.id !== id));
        alert("Blog yazısı başarıyla silindi.");
      }
    } catch (e) {
      alert("Hata oluştu.");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
              <span className="text-slate-400 fw-light">Vitrin & İçerik /</span> Blog Yönetimi
            </h4>
            <p className="text-slate-500 text-sm">Çiçek bakım yazıları, ipuçları ve Google SEO makaleleri.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/blog" target="_blank" className="btn btn-outline-secondary font-semibold">
              👁️ Canlı Blogu Gör
            </Link>
            <Link href="/yonetim/blog/yeni" className="btn btn-primary shadow-sm flex items-center gap-2 px-4 py-2 rounded-lg font-semibold">
              <span>➕ Yeni Blog Yazısı</span>
            </Link>
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-xl bg-white overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Görsel & Başlık</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Yayın Tarihi</th>
                  <th className="px-4 py-3">Okunma</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3 text-end">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={post.image} alt={post.title} className="w-12 h-10 object-cover rounded-lg border shadow-xs" />
                        <div>
                          <div className="font-bold text-slate-800 line-clamp-1">{post.title}</div>
                          <div className="text-xs text-slate-400">/{post.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-slate-100 text-slate-700">{post.category || "Çiçek Rehberi"}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{post.date}</td>
                    <td className="px-4 py-3 text-xs font-semibold">{post.views || 1} tık</td>
                    <td className="px-4 py-3">
                      <span className="badge bg-emerald-100 text-emerald-800">Yayında</span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="flex justify-end gap-2">
                        <Link href={`/blog/${post.slug}`} target="_blank" className="btn btn-sm btn-outline-secondary text-xs">
                          Görüntüle
                        </Link>
                        <Link href={`/yonetim/blog/${post.id}/duzenle`} className="btn btn-sm btn-outline-primary text-xs">
                          Düzenle
                        </Link>
                        <button onClick={() => handleDelete(post.id, post.title)} className="btn btn-sm btn-outline-danger text-xs">
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
