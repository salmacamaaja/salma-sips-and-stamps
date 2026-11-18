import { describe, expect, it } from "vitest";
import { DELIVERY_FEE, pointsForTotal } from "@/lib/format";
import { buildSalesReport } from "@/lib/report";
import { lineUnitPrice } from "@/lib/cart";

describe("Cafe's rules", () => {
  it("gives 1 point per Rp10.000 of the order total", () => {
    expect(pointsForTotal(9999)).toBe(0);
    expect(pointsForTotal(10000)).toBe(1);
    expect(pointsForTotal(73000)).toBe(7);
  });

  it("charges Rp10.000 for delivery", () => {
    expect(DELIVERY_FEE).toBe(10000);
  });

  it("adds topping prices to the menu price", () => {
    expect(lineUnitPrice({ basePrice: 28000, toppings: [{ name: "Oat Milk", price: 8000 }, { name: "Less Sugar", price: 0 }] })).toBe(36000);
  });

  it("leaves cancelled orders out of the sales report", () => {
    const now = new Date("2026-11-18T10:00:00");
    const report = buildSalesReport(
      [
        { created_at: "2026-11-18T08:00:00", status: "selesai", total: 50000, order_items: [{ name: "Tiramisu Slice", quantity: 1, line_total: 38000 }] },
        { created_at: "2026-11-18T09:00:00", status: "dibatalkan", total: 90000, order_items: [{ name: "Soto Banjar", quantity: 2, line_total: 70000 }] },
      ],
      now,
    );
    expect(report.todayRevenue).toBe(50000);
    expect(report.todayOrders).toBe(1);
    expect(report.topMenu.map((m) => m.name)).toEqual(["Tiramisu Slice"]);
  });
});
