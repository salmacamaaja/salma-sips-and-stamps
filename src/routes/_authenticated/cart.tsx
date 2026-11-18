import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Banknote, Bike, CheckCircle2, Landmark, QrCode, ShoppingBag, Trash2, Utensils } from "lucide-react";
import { MobileShell, PageHeader } from "@/components/cafe/shell";
import { MenuImage } from "@/components/cafe/menu-card";
import { EmptyState, QuantityStepper } from "@/components/cafe/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser, useIsAdmin } from "@/lib/auth";
import { lineUnitPrice, useCart } from "@/lib/cart";
import { profileQuery } from "@/lib/queries";
import {
  DELIVERY_FEE,
  formatRupiah,
  ORDER_TYPE_LABEL,
  PAYMENT_LABEL,
  pointsForTotal,
  type OrderType,
  type PaymentMethod,
} from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/cart")({
  head: () => ({
    meta: [
      { title: "Keranjang & Checkout — Cafe's" },
      { name: "description", content: "Periksa pesananmu, pilih dine-in, takeaway, atau delivery, lalu bayar." },
      { property: "og:title", content: "Keranjang & Checkout — Cafe's" },
      { property: "og:description", content: "Periksa pesananmu, pilih dine-in, takeaway, atau delivery, lalu bayar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CartPage,
});

const ORDER_TYPES: { value: OrderType; icon: typeof Utensils; hint: string }[] = [
  { value: "dine_in", icon: Utensils, hint: "Makan di tempat" },
  { value: "takeaway", icon: ShoppingBag, hint: "Ambil sendiri" },
  { value: "delivery", icon: Bike, hint: `+${formatRupiah(DELIVERY_FEE)}` },
];

const PAYMENTS: { value: PaymentMethod; icon: typeof QrCode; hint: string }[] = [
  { value: "qris", icon: QrCode, hint: "Scan & bayar" },
  { value: "cash", icon: Banknote, hint: "Bayar di kasir" },
  { value: "transfer", icon: Landmark, hint: "Transfer bank" },
];

const PAYMENT_NOTE: Record<PaymentMethod, string> = {
  qris: "Pindai kode QRIS di kasir untuk menyelesaikan pembayaran.",
  cash: "Silakan bayar tunai di kasir saat pesanan diambil atau diantar.",
  transfer: "Kasir akan memberikan detail rekening untuk transfer pembayaran.",
};

function CartPage() {
  const user = useAuthUser();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { lines, subtotal, setQuantity, remove, clear } = useCart();
  const { data: profile } = useQuery(profileQuery(user.id));

  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [payment, setPayment] = useState<PaymentMethod>("qris");
  const [table, setTable] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState<{ code: string; payment: PaymentMethod; total: number } | null>(null);

  useEffect(() => {
    if (profile?.address && !address) setAddress(profile.address);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.address]);

  const fee = orderType === "delivery" ? DELIVERY_FEE : 0;
  const total = subtotal + fee;

  async function placeOrder() {
    if (orderType === "delivery" && !address.trim()) {
      toast.error("Alamat pengiriman wajib diisi");
      return;
    }
    setSubmitting(true);
    const { data: orderId, error } = await supabase.rpc("place_order", {
      p_items: lines.map((l) => ({ menu_item_id: l.menuItemId, quantity: l.quantity, toppings: l.toppings.map((t) => t.name) })),
      p_order_type: orderType,
      p_payment_method: payment,
      p_table_number: orderType === "dine_in" ? table.trim() : "",
      p_address: orderType === "delivery" ? address.trim() : "",
      p_notes: notes.trim(),
    });
    if (error || !orderId) {
      setSubmitting(false);
      toast.error(error?.message ?? "Pesanan gagal dibuat");
      return;
    }
    const { data: order } = await supabase.from("orders").select("order_code,total").eq("id", orderId).maybeSingle();
    setSubmitting(false);
    clear();
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    setPlaced({ code: order?.order_code ?? "", payment, total: order?.total ?? total });
  }

  return (
    <MobileShell nav={lines.length === 0 && !placed ? (isAdmin ? "admin" : "user") : false} bottomSpace={lines.length > 0}>
      <PageHeader title="Keranjang" subtitle={lines.length ? `${lines.length} menu dipilih` : undefined} back />

      {lines.length === 0 && !placed ? (
        <EmptyState title="Keranjang masih kosong" text="Yuk pilih kopi atau hidangan favoritmu dulu.">
          <Button asChild size="lg"><Link to="/home">Lihat Menu</Link></Button>
        </EmptyState>
      ) : (
        <div className="space-y-7 px-5 pb-4">
          <section className="space-y-3">
            {lines.map((line) => (
              <div key={line.key} className="flex gap-3 rounded-3xl bg-card p-3 shadow-soft">
                <MenuImage src={line.imageUrl} alt={line.name} className="size-20 shrink-0 rounded-2xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-display text-lg font-semibold leading-tight">{line.name}</p>
                    <button type="button" onClick={() => remove(line.key)} aria-label="Hapus" className="text-muted-foreground">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  {line.toppings.length > 0 && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{line.toppings.map((t) => t.name).join(", ")}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm font-semibold">{formatRupiah(lineUnitPrice(line) * line.quantity)}</p>
                    <QuantityStepper size="sm" value={line.quantity} onChange={(v) => setQuantity(line.key, v)} min={0} />
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Cara Pesan</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {ORDER_TYPES.map(({ value, icon: Icon, hint }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOrderType(value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-4 transition-all",
                    orderType === value ? "border-gold bg-gold-soft/50 text-primary" : "border-border bg-card text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  <span className="text-sm font-semibold text-foreground">{ORDER_TYPE_LABEL[value]}</span>
                  <span className="text-[11px]">{hint}</span>
                </button>
              ))}
            </div>
            {orderType === "dine_in" && (
              <div className="mt-3 space-y-2">
                <Label htmlFor="table">Nomor meja (opsional)</Label>
                <Input id="table" value={table} onChange={(e) => setTable(e.target.value)} placeholder="Contoh: 7" />
              </div>
            )}
            {orderType === "delivery" && (
              <div className="mt-3 space-y-2">
                <Label htmlFor="address">Alamat pengiriman</Label>
                <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Jalan, nomor rumah, patokan…" />
              </div>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Metode Bayar</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {PAYMENTS.map(({ value, icon: Icon, hint }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPayment(value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-4 transition-all",
                    payment === value ? "border-gold bg-gold-soft/50 text-primary" : "border-border bg-card text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  <span className="text-sm font-semibold text-foreground">{value === "transfer" ? "Transfer" : PAYMENT_LABEL[value]}</span>
                  <span className="text-[11px]">{hint}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <Label htmlFor="notes">Catatan (opsional)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Contoh: es sedikit, tidak pedas" />
          </section>

          <section className="rounded-3xl bg-card p-5 shadow-soft">
            <Row label="Subtotal" value={formatRupiah(subtotal)} />
            {fee > 0 && <Row label="Ongkos kirim" value={formatRupiah(fee)} />}
            <div className="my-3 h-px bg-border" />
            <Row label="Total" value={formatRupiah(total)} strong />
            <p className="mt-3 text-xs text-muted-foreground">
              Kamu akan mendapat <span className="font-semibold text-gold">{pointsForTotal(total)} poin</span> saat pesanan selesai.
            </p>
          </section>
        </div>
      )}

      {lines.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40">
          <div className="mx-auto max-w-md rounded-t-3xl bg-card px-6 pt-4 shadow-float safe-bottom">
            <Button size="xl" className="w-full" onClick={placeOrder} disabled={submitting}>
              {submitting ? "Memproses…" : `Buat Pesanan · ${formatRupiah(total)}`}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!placed} onOpenChange={(o) => !o && navigate({ to: "/orders" })}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader className="items-center text-center">
            <CheckCircle2 className="size-12 text-success" />
            <DialogTitle className="font-display text-3xl">Pesanan diterima</DialogTitle>
            <DialogDescription>
              Kode pesanan <span className="font-bold text-foreground">#{placed?.code}</span> · {placed && formatRupiah(placed.total)}
            </DialogDescription>
          </DialogHeader>
          {placed && (
            <div className="rounded-2xl bg-secondary p-4 text-center text-sm">
              <p className="font-semibold">{PAYMENT_LABEL[placed.payment]}</p>
              <p className="mt-1 text-muted-foreground">{PAYMENT_NOTE[placed.payment]}</p>
            </div>
          )}
          <Button size="lg" onClick={() => navigate({ to: "/orders" })}>Lihat Pesanan</Button>
        </DialogContent>
      </Dialog>
    </MobileShell>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between py-1", strong ? "text-lg font-bold" : "text-sm text-muted-foreground")}>
      <span>{label}</span>
      <span className={strong ? "text-primary" : "text-foreground"}>{value}</span>
    </div>
  );
}
