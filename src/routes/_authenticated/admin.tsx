import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Pencil, Plus, Trash2, LogOut } from "lucide-react";
import { MobileShell } from "@/components/cafe/shell";
import { MenuImage } from "@/components/cafe/menu-card";
import { StatusBadge } from "@/components/cafe/bits";
import { MenuFormDialog } from "@/components/cafe/menu-form";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { allOrdersQuery, isAdminQuery, menuQuery, type MenuItem } from "@/lib/queries";
import { useSignOut } from "@/lib/auth";
import { buildSalesReport } from "@/lib/report";
import {
  CATEGORY_LABEL,
  formatDateTime,
  formatRupiah,
  ORDER_TYPE_LABEL,
  PAYMENT_LABEL,
  parseToppings,
  STATUS_LABEL,
  STATUS_ORDER,
  type MenuCategory,
  type OrderStatus,
} from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Dashboard Admin — Cafe's" },
      { name: "description", content: "Kelola menu, pesanan, dan laporan penjualan Cafe's." },
      { property: "og:title", content: "Dashboard Admin — Cafe's" },
      { property: "og:description", content: "Kelola menu, pesanan, dan laporan penjualan Cafe's." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: async ({ context }) => {
    const isAdmin = await context.queryClient.ensureQueryData(isAdminQuery(context.user.id));
    if (!isAdmin) throw redirect({ to: "/home" });
  },
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(allOrdersQuery()),
      context.queryClient.ensureQueryData(menuQuery()),
    ]),
  component: AdminPage,
});

type Tab = "laporan" | "pesanan" | "menu";

function AdminPage() {
  const [tab, setTab] = useState<Tab>("laporan");
  const signOut = useSignOut();

  return (
    <MobileShell nav="admin">
      <header className="px-5 pb-3 pt-7">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Admin</p>
            <h1 className="text-4xl font-semibold leading-tight">Dashboard</h1>
          </div>
          <Button variant="ivory" size="icon" className="size-11" onClick={signOut} aria-label="Keluar">
            <LogOut />
          </Button>
        </div>
        <div className="mt-5 grid grid-cols-3 rounded-full bg-secondary p-1">
          {(["laporan", "pesanan", "menu"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-full py-2.5 text-sm font-semibold capitalize transition-all",
                tab === t ? "bg-card text-primary shadow-soft" : "text-muted-foreground",
              )}
            >
              {t === "laporan" ? "Laporan" : t === "pesanan" ? "Pesanan" : "Menu"}
            </button>
          ))}
        </div>
      </header>
      <div className="px-5 pt-2">
        {tab === "laporan" && <ReportTab />}
        {tab === "pesanan" && <OrdersTab />}
        {tab === "menu" && <MenuTab />}
      </div>
    </MobileShell>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-3xl p-4 shadow-soft", highlight ? "bg-gradient-coffee text-primary-foreground" : "bg-card")}>
      <p className={cn("text-xs", highlight ? "text-gold-soft" : "text-muted-foreground")}>{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}

function ReportTab() {
  const { data: orders } = useSuspenseQuery({ ...allOrdersQuery(), refetchInterval: 20000 });
  const report = useMemo(() => buildSalesReport(orders), [orders]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Pendapatan hari ini" value={formatRupiah(report.todayRevenue)} highlight />
        <StatCard label="Pesanan hari ini" value={String(report.todayOrders)} />
        <StatCard label="Pesanan aktif" value={String(report.activeOrders)} />
        <StatCard label="7 hari terakhir" value={formatRupiah(report.weekRevenue)} />
      </div>

      <section className="rounded-3xl bg-card p-5 shadow-soft">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold">Penjualan Mingguan</h2>
          <span className="text-xs text-muted-foreground">Total {formatRupiah(report.totalRevenue)}</span>
        </div>
        <div className="mt-4 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={report.days}>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip
                cursor={{ fill: "var(--secondary)" }}
                formatter={(v: number) => [formatRupiah(v), "Pendapatan"]}
                contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }}
              />
              <Bar dataKey="revenue" fill="var(--chart-1)" radius={[8, 8, 8, 8]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-3xl bg-card p-5 shadow-soft">
        <h2 className="text-2xl font-semibold">Menu Terlaris</h2>
        {report.topMenu.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Belum ada penjualan.</p>
        ) : (
          <ol className="mt-3 space-y-3">
            {report.topMenu.map((m, i) => (
              <li key={m.name} className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-full bg-gold-soft font-display text-lg font-semibold text-primary">{i + 1}</span>
                <span className="flex-1 text-sm font-medium">{m.name}</span>
                <span className="text-right text-xs text-muted-foreground">
                  {m.quantity} terjual
                  <br />
                  {formatRupiah(m.revenue)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

type OrderFilter = "aktif" | "semua" | OrderStatus;

function OrdersTab() {
  const queryClient = useQueryClient();
  const { data: orders } = useSuspenseQuery({ ...allOrdersQuery(), refetchInterval: 15000 });
  const [filter, setFilter] = useState<OrderFilter>("aktif");

  const shown = orders.filter((o) =>
    filter === "semua" ? true : filter === "aktif" ? ["menunggu", "diproses", "siap"].includes(o.status) : o.status === filter,
  );

  async function updateStatus(id: string, status: OrderStatus) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Status diubah ke ${STATUS_LABEL[status]}`);
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  }

  const filters: OrderFilter[] = ["aktif", "semua", ...STATUS_ORDER];

  return (
    <div>
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-xs font-semibold",
              filter === f ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
            )}
          >
            {f === "aktif" ? "Aktif" : f === "semua" ? "Semua" : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {shown.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Tidak ada pesanan.</p>}
        {shown.map((order) => (
          <article key={order.id} className="rounded-3xl bg-card p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl font-semibold">#{order.order_code}</p>
                <p className="text-sm font-medium">{order.customer_name || "Pelanggan"}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {order.order_items.map((it) => {
                const tops = parseToppings(it.toppings);
                return (
                  <li key={it.id} className="flex justify-between gap-3">
                    <span>
                      {it.quantity}× {it.name}
                      {tops.length > 0 && <span className="block text-xs text-muted-foreground">{tops.map((t) => t.name).join(", ")}</span>}
                    </span>
                    <span className="shrink-0 text-muted-foreground">{formatRupiah(it.line_total)}</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 space-y-1 rounded-2xl bg-secondary p-3 text-xs">
              <p><span className="text-muted-foreground">Tipe:</span> {ORDER_TYPE_LABEL[order.order_type]}{order.table_number && ` · Meja ${order.table_number}`}</p>
              <p><span className="text-muted-foreground">Bayar:</span> {PAYMENT_LABEL[order.payment_method]}</p>
              {order.address && <p><span className="text-muted-foreground">Alamat:</span> {order.address}</p>}
              {order.notes && <p><span className="text-muted-foreground">Catatan:</span> {order.notes}</p>}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="font-bold text-primary">{formatRupiah(order.total)}</span>
              <Select value={order.status} onValueChange={(v) => updateStatus(order.id, v as OrderStatus)}>
                <SelectTrigger className="h-10 w-40 rounded-full bg-card" aria-label="Ubah status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function MenuTab() {
  const queryClient = useQueryClient();
  const { data: menu } = useSuspenseQuery(menuQuery());
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<MenuItem | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["menu"] });

  async function toggleAvailable(item: MenuItem, value: boolean) {
    const { error } = await supabase.from("menu_items").update({ is_available: value }).eq("id", item.id);
    if (error) { toast.error(error.message); return; }
    refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", deleting.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Menu dihapus");
    setDeleting(null);
    refresh();
  }

  const groups = (Object.keys(CATEGORY_LABEL) as MenuCategory[]).map((c) => ({ c, items: menu.filter((m) => m.category === c) }));

  return (
    <div>
      <Button size="lg" className="w-full" onClick={() => { setEditing(null); setFormOpen(true); }}>
        <Plus /> Tambah Menu
      </Button>

      {groups.map(({ c, items }) => (
        <section key={c} className="mt-6">
          <h2 className="text-2xl font-semibold">{CATEGORY_LABEL[c]} <span className="text-base text-muted-foreground">({items.length})</span></h2>
          <div className="mt-3 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-3xl bg-card p-3 shadow-soft">
                <MenuImage src={item.image_url} alt={item.name} className={cn("size-16 shrink-0 rounded-2xl", !item.is_available && "opacity-50")} />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 font-display text-lg font-semibold leading-tight">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{formatRupiah(item.price)}</p>
                  <label className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch checked={item.is_available} onCheckedChange={(v) => toggleAvailable(item, v)} />
                    {item.is_available ? "Tersedia" : "Habis"}
                  </label>
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="soft" size="icon" aria-label={`Edit ${item.name}`} onClick={() => { setEditing(item); setFormOpen(true); }}>
                    <Pencil />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" aria-label={`Hapus ${item.name}`} onClick={() => setDeleting(item)}>
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <MenuFormDialog open={formOpen} onOpenChange={setFormOpen} item={editing} onSaved={refresh} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="max-w-sm rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl">Hapus menu?</AlertDialogTitle>
            <AlertDialogDescription>“{deleting?.name}” akan dihapus dari daftar menu. Riwayat pesanan tetap tersimpan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Batal</AlertDialogCancel>
            <AlertDialogAction className="rounded-full bg-destructive text-destructive-foreground" onClick={confirmDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
