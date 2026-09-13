"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect } from "react";

export interface Product {
  id: string;
  slug: string;
  title: string;
  category: string;
  categorySlug: string;
  selectedCategorySlugs?: string[];
  designType?: string;
  designTypes?: string[];
  recipient?: string;
  recipients?: string[];
  purpose?: string;
  purposes?: string[];
  color?: string;
  colors?: string[];
  price: string;
  oldPrice?: string;
  discount?: string;
  image: string;
  code?: string;
  stock: boolean;
  featured: boolean;
  description?: string;
  seoTitle?: string;
  seoDesc?: string;
  seoKeywords?: string;
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

export const initialCategories: CategoryItem[] = [];
export const initialProducts: Product[] = [];

let lastFetchTimestamp = 0;
let isFetchingInProgress = false;
const FETCH_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes client cache cooldown

interface StoreState {
  products: Product[];
  categories: CategoryItem[];
  cart: CartItem[];
  favorites: Product[];
  coupon: string | null;
  discountAmount: number;

  fetchFromApi: (force?: boolean) => Promise<void>;
  addProduct: (newProd: Partial<Product>) => Promise<void>;
  updateProduct: (id: string, updatedFields: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCategory: (newCat: Partial<CategoryItem>) => Promise<void>;
  updateCategory: (id: string, updatedFields: Partial<CategoryItem>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  setSingleCartItem: (product: Product, quantity?: number, selectedExtras?: ExtraGift[]) => void;
  addToCart: (product: Product, quantity?: number, selectedExtras?: ExtraGift[]) => void;
  removeFromCart: (productId: string) => void;
  addExtraToCart: (extra: ExtraGift) => void;
  removeExtraFromCart: (extraId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  applyCoupon: (code: string, customAmount?: number) => boolean;
  clearCart: () => void;
  toggleFavorite: (product: Product) => void;
  isFavorite: (productId: string | number) => boolean;
  clearFavorites: () => void;
}

export const useZustandStore = create<StoreState>()(
  persist(
    (set, get) => ({
      products: [],
      categories: [],
      cart: [],
      favorites: [],
      coupon: null,
      discountAmount: 0,

      fetchFromApi: async (force = false) => {
        const now = Date.now();
        if (isFetchingInProgress) return;
        const currentProducts = get().products;
        if (!force && currentProducts.length > 0 && now - lastFetchTimestamp < FETCH_COOLDOWN_MS) {
          return;
        }

        isFetchingInProgress = true;
        try {
          const [pRes, cRes] = await Promise.all([
            fetch("/api/products", { cache: force ? "no-store" : "default" }),
            fetch("/api/categories", { cache: force ? "no-store" : "default" }),
          ]);

          if (pRes.ok) {
            const productsData = await pRes.json();
            if (Array.isArray(productsData)) {
              set({ products: productsData });
            }
          }

          if (cRes.ok) {
            const categoriesData = await cRes.json();
            if (Array.isArray(categoriesData)) {
              set({ categories: categoriesData });
            }
          }

          lastFetchTimestamp = Date.now();
        } catch (e) {
          console.error("Zustand fetchFromApi error:", e);
        } finally {
          isFetchingInProgress = false;
        }
      },

      addProduct: async (newProd: Partial<Product>) => {
        try {
          const res = await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newProd),
          });
          if (res.ok) {
            await get().fetchFromApi(true);
          }
        } catch (e) {
          console.error(e);
        }
      },

      updateProduct: async (id: string, updatedFields: Partial<Product>) => {
        set((state) => ({
          products: state.products.map((p) =>
            String(p.id) === String(id) ? { ...p, ...updatedFields } : p
          ),
        }));
        try {
          const res = await fetch("/api/products", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, ...updatedFields }),
          });
          if (res.ok) {
            await get().fetchFromApi(true);
          }
        } catch (e) {
          console.error(e);
        }
      },

      deleteProduct: async (id: string) => {
        set((state) => ({
          products: state.products.filter((p) => String(p.id) !== String(id)),
        }));
        try {
          const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
          if (res.ok) {
            await get().fetchFromApi(true);
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
            await get().fetchFromApi(true);
          }
        } catch (e) {
          console.error(e);
        }
      },

      updateCategory: async (id: string, updatedFields: Partial<CategoryItem>) => {
        set((state) => ({
          categories: state.categories.map((c) =>
            String(c.id) === String(id) ? { ...c, ...updatedFields } : c
          ),
        }));
        try {
          const res = await fetch("/api/categories", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, ...updatedFields }),
          });
          if (res.ok) {
            await get().fetchFromApi(true);
          }
        } catch (e) {
          console.error(e);
        }
      },

      deleteCategory: async (id: string) => {
        set((state) => ({
          categories: state.categories.filter((c) => String(c.id) !== String(id)),
        }));
        try {
          const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
          if (res.ok) {
            await get().fetchFromApi(true);
          }
        } catch (e) {
          console.error(e);
        }
      },

      setSingleCartItem: (product: Product, quantity = 1, selectedExtras: ExtraGift[] = []) => {
        set({
          cart: [{ product, quantity: 1, selectedExtras }],
        });
      },

      addToCart: (product: Product, quantity = 1, selectedExtras: ExtraGift[] = []) => {
        set((state) => {
          const existing = state.cart.find((item) => String(item.product.id) === String(product.id));
          if (existing) {
            return {
              cart: state.cart.map((item) =>
                String(item.product.id) === String(product.id)
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return {
            cart: [...state.cart, { product, quantity, selectedExtras }],
          };
        });
      },

      removeFromCart: (productId: string) => {
        set((state) => ({
          cart: state.cart.filter((item) => String(item.product.id) !== String(productId)),
        }));
      },

      addExtraToCart: (extra: ExtraGift) => {
        set((state) => {
          if (state.cart.length === 0) return state;
          return {
            cart: state.cart.map((item, idx) => {
              if (idx === 0) {
                const extras = item.selectedExtras || [];
                const exists = extras.some((e) => e.id === extra.id);
                if (!exists) {
                  return { ...item, selectedExtras: [...extras, extra] };
                }
              }
              return item;
            }),
          };
        });
      },

      removeExtraFromCart: (extraId: string) => {
        set((state) => ({
          cart: state.cart.map((item) => ({
            ...item,
            selectedExtras: (item.selectedExtras || []).filter((e) => e.id !== extraId),
          })),
        }));
      },

      updateQuantity: (productId: string, quantity: number) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              cart: state.cart.filter((item) => String(item.product.id) !== String(productId)),
            };
          }
          return {
            cart: state.cart.map((item) =>
              String(item.product.id) === String(productId) ? { ...item, quantity } : item
            ),
          };
        });
      },

      applyCoupon: (code: string, customAmount?: number) => {
        const codeClean = code.toUpperCase().trim();
        if (customAmount !== undefined && customAmount > 0) {
          set({
            coupon: codeClean,
            discountAmount: customAmount,
          });
          return true;
        }
        if (codeClean === "HOSGELDIN100" || codeClean === "HOSGELDIN") {
          set({
            coupon: "HOSGELDIN100",
            discountAmount: 100,
          });
          return true;
        }
        return false;
      },

      clearCart: () => {
        set({
          cart: [],
          coupon: null,
          discountAmount: 0,
        });
      },

      toggleFavorite: (product: Product) => {
        set((state) => {
          const exists = state.favorites.some((p) => String(p.id) === String(product.id));
          if (exists) {
            return {
              favorites: state.favorites.filter((p) => String(p.id) !== String(product.id)),
            };
          }
          return {
            favorites: [...state.favorites, product],
          };
        });
      },

      isFavorite: (productId: string | number) => {
        return get().favorites.some((p) => String(p.id) === String(productId));
      },

      clearFavorites: () => {
        set({ favorites: [] });
      },
    }),
    {
      name: "cicekce_store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cart: state.cart,
        favorites: state.favorites,
        products: state.products,
        categories: state.categories,
        coupon: state.coupon,
        discountAmount: state.discountAmount,
      }),
      onRehydrateStorage: () => (state) => {
        if (typeof window !== "undefined" && state) {
          try {
            if (!state.cart || state.cart.length === 0) {
              const oldCart = localStorage.getItem("pro_flower_cart");
              if (oldCart) state.cart = JSON.parse(oldCart);
            }
            if (!state.favorites || state.favorites.length === 0) {
              const oldFavs = localStorage.getItem("pro_flower_favorites");
              if (oldFavs) state.favorites = JSON.parse(oldFavs);
            }
            if (!state.products || state.products.length === 0) {
              const oldProds = localStorage.getItem("pro_flower_products");
              if (oldProds) state.products = JSON.parse(oldProds);
            }
            if (!state.categories || state.categories.length === 0) {
              const oldCats = localStorage.getItem("pro_flower_categories");
              if (oldCats) state.categories = JSON.parse(oldCats);
            }
          } catch (e) {}
        }
      },
    }
  )
);

export function useStore<T>(selector?: (state: StoreState) => T): any {
  const store = useZustandStore();

  useEffect(() => {
    store.fetchFromApi();
  }, []);

  if (selector) {
    return selector(store);
  }
  return store;
}

export function generateSeoDetails(data: {
  title: string;
  category?: string;
  designTypes?: string[];
  recipients?: string[];
  purposes?: string[];
  colors?: string[];
  price?: string;
}) {
  const title = data.title.trim() || "Özel Çiçek Aranjmanı";
  const category = data.category || "Çiçekler";
  const recipients = data.recipients && data.recipients.length > 0 ? data.recipients.join(", ") : "sevdikleriniz";
  const designTypes = data.designTypes && data.designTypes.length > 0 ? data.designTypes.join(", ") : "özel tasarım";
  const purposes = data.purposes && data.purposes.length > 0 ? data.purposes.join(", ") : "özel gün ve kutlamalar";
  const colors = data.colors && data.colors.length > 0 ? data.colors.join(", ") : "canlı renkli";

  const description = `${title}, ${recipients} için özel olarak hazırlanmış taze ve göz alıcı bir ${category.toLowerCase()} tasarımıdır. ${colors} renkli taze çiçeklerin en zarif kombinasyonuyla oluşturulan bu ${designTypes} aranjmanı; ${purposes} gibi anlarda unutulmaz bir jest yapmanız için floristlerimiz tarafından özenle hazırlanmıştır.\n\nAynı gün adrese teslimat garantisi ve tazelik güvencesiyle ${title} siparişinizi hemen verin, sevdiklerinize anlamlı ve büyüleyici bir sürpriz yapın.\n\n• %100 Taze Canlı Çiçek Garantisi\n• Özel Tasarım Sunum ve Hediye Kart Notu\n• Hızlı Kurye İle Aynı Gün Teslimat`;

  const seoTitle = `${title} Siparişi - Aynı Gün Teslimat | Çiçekçiniz`;
  const seoDesc = `${title} taze çiçek aranjmanı. ${recipients} için en güzel ${category.toLowerCase()} çeşitlerini aynı gün hızlı kurye teslimatıyla sipariş edin.`;
  const seoKeywords = `${title.toLowerCase()}, ${category.toLowerCase()}, çiçek siparişi, taze çiçek, buket, online çiçek gönder`;

  return { description, seoTitle, seoDesc, seoKeywords };
}
