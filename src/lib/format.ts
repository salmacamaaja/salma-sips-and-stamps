import type { Database } from "@/integrations/supabase/types";

export type MenuCategory = Database["public"]["Enums"]["menu_category"];
export type OrderType = Database["public"]["Enums"]["order_type"];
export type PaymentMethod = Database["public"]["Enums"]["payment_method"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];

export type Topping = { name: string; price: number };

export function formatRupiah(value: number) {
  return "Rp" + Math.round(value).toLocaleString("id-ID");
}

export const CATEGORY_LABEL: Record<MenuCategory, string> = {
  minuman: "Minuman",
  dessert: "Dessert",
  makanan: "Makanan Berat",
};

export const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  dine_in: "Dine-in",
  takeaway: "Takeaway",
  delivery: "Delivery",
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  qris: "QRIS",
  cash: "Cash",
  transfer: "Transfer Bank",
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  menunggu: "Menunggu",
  diproses: "Diproses",
  siap: "Siap",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

export const STATUS_ORDER: OrderStatus[] = ["menunggu", "diproses", "siap", "selesai", "dibatalkan"];

export const DELIVERY_FEE = 10000;

/** Points are awarded when an order is completed: 1 point per Rp10.000 of the order total. */
export function pointsForTotal(total: number) {
  return Math.floor(total / 10000);
}

export function parseToppings(value: unknown): Topping[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((t): t is { name: unknown; price: unknown } => typeof t === "object" && t !== null)
    .map((t) => ({ name: String(t.name ?? ""), price: Number(t.price ?? 0) || 0 }))
    .filter((t) => t.name.length > 0);
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
