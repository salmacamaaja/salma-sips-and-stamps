import type { OrderStatus } from "@/lib/format";

type ReportOrder = {
  created_at: string;
  status: OrderStatus;
  total: number;
  order_items: { name: string; quantity: number; line_total: number }[];
};

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Sales report: cancelled orders never count toward revenue or best sellers. */
export function buildSalesReport(orders: ReportOrder[], now = new Date()) {
  const valid = orders.filter((o) => o.status !== "dibatalkan");
  const todayKey = dayKey(now);
  const today = valid.filter((o) => dayKey(new Date(o.created_at)) === todayKey);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    return { key: dayKey(d), label: d.toLocaleDateString("id-ID", { weekday: "short" }), revenue: 0, orders: 0 };
  });
  for (const o of valid) {
    const day = days.find((d) => d.key === dayKey(new Date(o.created_at)));
    if (day) {
      day.revenue += o.total;
      day.orders += 1;
    }
  }

  const byMenu = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const o of valid) {
    for (const it of o.order_items) {
      const cur = byMenu.get(it.name) ?? { name: it.name, quantity: 0, revenue: 0 };
      cur.quantity += it.quantity;
      cur.revenue += it.line_total;
      byMenu.set(it.name, cur);
    }
  }

  return {
    todayRevenue: today.reduce((s, o) => s + o.total, 0),
    todayOrders: today.length,
    weekRevenue: days.reduce((s, d) => s + d.revenue, 0),
    totalRevenue: valid.reduce((s, o) => s + o.total, 0),
    activeOrders: orders.filter((o) => o.status === "menunggu" || o.status === "diproses" || o.status === "siap").length,
    days,
    topMenu: [...byMenu.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5),
  };
}
