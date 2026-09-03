"use client";

import React from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";

export interface ProductCardProps {
  id: string | number;
  slug: string;
  title: string;
  price: string;
  oldPrice?: string;
  discount?: string;
  image: string;
  code?: string;
  isInCart?: boolean;
  onQuickOrder?: (product: any) => void;
  onRemoveFromCart?: (id: string | number) => void;
}

export default function ProductCard({
  id,
  slug,
  title,
  price,
  oldPrice,
  discount,
  image,
  code,
  onQuickOrder,
}: ProductCardProps) {
  const { setSingleCartItem } = useStore();

  const handleDirectBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const prodObj = {
      id: String(id),
      slug,
      title,
      price,
      oldPrice,
      image,
      code: code || `DM${id}`,
      category: "Çiçek",
      categorySlug: "cicekler",
      stock: true,
      featured: true,
    };

    // Synchronously overwrite localStorage cart with Product Y
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("pro_flower_cart", JSON.stringify([{ product: prodObj, quantity: 1 }]));
      } catch (err) {}
    }

    setSingleCartItem(prodObj, 1);

    if (onQuickOrder) {
      onQuickOrder(prodObj);
    } else {
      window.location.href = "/odeme";
    }
  };

  return (
    <div className="group bg-white rounded-3xl p-3 border border-slate-200/80 shadow-xs hover:shadow-md transition duration-300 flex flex-col justify-between relative overflow-hidden">
      {/* Image & Badges Container */}
      <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 bg-slate-100">
        <Link href={`/urun/${slug}`} className="block w-full h-full">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        </Link>

        {code && (
          <span style={{ backgroundColor: "#2b2623", color: "#ffffff" }} className="absolute top-2.5 left-2.5 z-10 text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
            {code}
          </span>
        )}

        {discount && (
          <span className="absolute top-2.5 right-2.5 z-10 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
            {discount}
          </span>
        )}
      </div>

      {/* Product Content */}
      <div className="flex flex-col flex-grow justify-between">
        <div>
          <Link href={`/urun/${slug}`} className="block group-hover:text-[#2b2623] transition">
            <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm line-clamp-2 leading-snug mb-1">
              {title}
            </h3>
          </Link>
        </div>

        {/* Price & Action Buttons */}
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            {oldPrice && (
              <div className="text-[10px] line-through text-slate-400 font-semibold leading-none mb-0.5">
                {oldPrice}
              </div>
            )}
            <div style={{ color: "#2b2623" }} className="font-black text-sm sm:text-base leading-none">
              {price}
            </div>
          </div>

          <Link
            href={`/urun/${slug}`}
            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
            className="px-3 py-2 rounded-xl text-xs font-extrabold shadow-xs hover:opacity-95 transition whitespace-nowrap flex items-center gap-1"
          >
            <span>🛒 Sipariş Ver</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
