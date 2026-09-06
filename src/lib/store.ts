"use client";

import { useState, useEffect } from "react";

export interface Product {
  id: string;
  slug: string;
  title: string;
  category: string;
  categorySlug: string;
  price: string;
  oldPrice?: string;
  discount?: string;
  image: string;
  code?: string;
  stock: boolean;
  featured: boolean;
  description?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  image: string;
  order: number;
}

export interface ExtraGift {
  id: string;
  name: string;
  price: number;
  image: string;
  icon?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedExtras: ExtraGift[];
}

export const extraGiftsList: ExtraGift[] = [
  { id: "e1", name: "Premium Kalp Çikolata Kutusu", price: 350, image: "🍫" },
  { id: "e2", name: "Sevimli Peluş Ayı (30 cm)", price: 450, image: "🧸" },
  { id: "e3", name: "Kişiye Özel Doğum Günü Balonu", price: 150, image: "🎈" },
];

import { getInitialDbData } from "./server-settings";

const _initialDb = getInitialDbData();
export const initialCategories: CategoryItem[] = _initialDb.categories || [];
export const initialProducts: Product[] = _initialDb.products || [];

let globalProducts: Product[] = initialProducts;
let globalCategories: CategoryItem[] = initialCategories;
let globalCart: CartItem[] = [];
let globalFavorites: Product[] = [];
if (typeof window !== "undefined") {
  try {
    const savedCart = localStorage.getItem("pro_flower_cart");
    if (savedCart) globalCart = JSON.parse(savedCart);
    const savedFavs = localStorage.getItem("pro_flower_favorites");
    if (savedFavs) globalFavorites = JSON.parse(savedFavs);
  } catch (e) {}
}
let globalCoupon: string | null = null;
let globalDiscountAmount = 0;
const listeners: Array<() => void> = [];

async function fetchFromApi() {
  try {
    const [pRes, cRes] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/categories"),
    ]);
    if (pRes.ok) globalProducts = await pRes.json();
    if (cRes.ok) globalCategories = await cRes.json();
    listeners.forEach((l) => l());
  } catch (e) {
    console.error("API Fetch Error:", e);
  }
}

// Global Store Hook
export function useStore<T>(selector?: (state: any) => T): any {
  const [, setTick] = useState(0);

  useEffect(() => {
    fetchFromApi();
    const handler = () => setTick((t) => t + 1);
    listeners.push(handler);
    return () => {
      const idx = listeners.indexOf(handler);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  const notify = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("pro_flower_cart", JSON.stringify(globalCart));
        localStorage.setItem("pro_flower_favorites", JSON.stringify(globalFavorites));
      } catch (e) {}
    }
    listeners.forEach((l) => l());
  };

  const state = {
    products: globalProducts,
    categories: globalCategories,
    cart: globalCart,
    favorites: globalFavorites,
    coupon: globalCoupon,
    discountAmount: globalDiscountAmount,

    // Product CRUD Operations via API
    addProduct: async (newProd: Partial<Product>) => {
      try {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newProd),
        });
        if (res.ok) {
          await fetchFromApi();
        }
      } catch (e) {
        console.error(e);
      }
    },

    updateProduct: async (id: string, updatedFields: Partial<Product>) => {
      try {
        const res = await fetch("/api/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...updatedFields }),
        });
        if (res.ok) {
          await fetchFromApi();
        }
      } catch (e) {
        console.error(e);
      }
    },

    deleteProduct: async (id: string) => {
      try {
        const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
        if (res.ok) {
          await fetchFromApi();
        }
      } catch (e) {
        console.error(e);
      }
    },

    // Category CRUD Operations via API
    updateCategory: async (id: string, updatedFields: Partial<CategoryItem>) => {
      try {
        const res = await fetch("/api/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...updatedFields }),
        });
        if (res.ok) {
          await fetchFromApi();
        }
      } catch (e) {
        console.error(e);
      }
    },

    addCategory: async (newCat: Partial<CategoryItem>) => {
      try {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newCat),
        });
        if (res.ok) {
          await fetchFromApi();
        }
      } catch (e) {
        console.error(e);
      }
    },

    deleteCategory: async (id: string) => {
      try {
        const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
        if (res.ok) {
          await fetchFromApi();
        }
      } catch (e) {
        console.error(e);
      }
    },

        // Hard-lock cart to a single item with EXACTLY 1 quantity
    setSingleCartItem: (product: Product, quantity = 1, selectedExtras: ExtraGift[] = []) => {
      globalCart = [{ product, quantity: 1, selectedExtras }];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("pro_flower_cart", JSON.stringify(globalCart));
        } catch (e) {}
      }
      notify();
    },

    // Cart Operations
    addToCart: (product: Product, quantity = 1, selectedExtras: ExtraGift[] = []) => {
      const existing = globalCart.find((item) => item.product.id === product.id);
      if (existing) {
        globalCart = globalCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        globalCart = [...globalCart, { product, quantity, selectedExtras }];
      }
      notify();
    },

    removeFromCart: (productId: string) => {
      globalCart = globalCart.filter((item) => item.product.id !== productId);
      notify();
    },

    addExtraToCart: (extra: ExtraGift) => {
      if (globalCart.length === 0) return;
      globalCart = globalCart.map((item, idx) => {
        if (idx === 0) {
          const extras = item.selectedExtras || [];
          const exists = extras.some((e) => e.id === extra.id);
          if (!exists) {
            return { ...item, selectedExtras: [...extras, extra] };
          }
        }
        return item;
      });
      notify();
    },

    removeExtraFromCart: (extraId: string) => {
      globalCart = globalCart.map((item) => ({
        ...item,
        selectedExtras: (item.selectedExtras || []).filter((e) => e.id !== extraId),
      }));
      notify();
    },

    updateQuantity: (productId: string, quantity: number) => {
      if (quantity <= 0) {
        globalCart = globalCart.filter((item) => item.product.id !== productId);
      } else {
        globalCart = globalCart.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        );
      }
      notify();
    },

    applyCoupon: (code: string) => {
      if (code.toUpperCase() === "HOSGELDIN100") {
        globalCoupon = "HOSGELDIN100";
        globalDiscountAmount = 100;
        notify();
        return true;
      }
      return false;
    },

    clearCart: () => {
      globalCart = [];
      globalCoupon = null;
      globalDiscountAmount = 0;
      notify();
    },

    toggleFavorite: (product: Product) => {
      const exists = globalFavorites.some((p) => String(p.id) === String(product.id));
      if (exists) {
        globalFavorites = globalFavorites.filter((p) => String(p.id) !== String(product.id));
      } else {
        globalFavorites = [...globalFavorites, product];
      }
      notify();
    },

    isFavorite: (productId: string | number) => {
      return globalFavorites.some((p) => String(p.id) === String(productId));
    },

    clearFavorites: () => {
      globalFavorites = [];
      notify();
    },
  };

  if (selector) {
    return selector(state);
  }
  return state;
}
