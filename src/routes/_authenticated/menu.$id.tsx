import { createFileRoute, Link, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, ChevronLeft, ShoppingBag } from "lucide-react";
import { MobileShell } from "@/components/cafe/shell";
import { MenuImage } from "@/components/cafe/menu-card";
import { QuantityStepper } from "@/components/cafe/bits";
import { Button } from "@/components/ui/button";
import { menuItemQuery } from "@/lib/queries";
import { useCart } from "@/lib/cart";
import { CATEGORY_LABEL, formatRupiah, parseToppings, type Topping } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/menu/$id")({
  head: () => ({
    meta: [
      { title: "Detail Menu — Cafe's" },
      { name: "description", content: "Lihat detail menu, pilih topping, dan tambahkan ke keranjang." },
      { property: "og:title", content: "Detail Menu — Cafe's" },
      { property: "og:description", content: "Lihat detail menu, pilih topping, dan tambahkan ke keranjang." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context, params }) => {
    const item = await context.queryClient.ensureQueryData(menuItemQuery(params.id));
    if (!item) throw notFound();
  },
  notFoundComponent: () => (
    <MobileShell>
      <div className="px-6 py-24 text-center">
        <p className="font-display text-3xl">Menu tidak ditemukan</p>
        <Button asChild className="mt-6"><Link to="/home">Kembali ke beranda</Link></Button>
      </div>
    </MobileShell>
  ),
  component: MenuDetail,
});

function MenuDetail() {
  const { id } = Route.useParams();
  const { data: item } = useSuspenseQuery(menuItemQuery(id));
  const router = useRouter();
  const navigate = useNavigate();
  const { add, count } = useCart();
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Topping[]>([]);

  if (!item) return null;
  const toppings = parseToppings(item.toppings);
  const unit = item.price + selected.reduce((s, t) => s + t.price, 0);

  function toggle(t: Topping) {
    setSelected((prev) => (prev.some((p) => p.name === t.name) ? prev.filter((p) => p.name !== t.name) : [...prev, t]));
  }

  function addToCart(goToCart: boolean) {
    if (!item) return;
    add({ menuItemId: item.id, name: item.name, imageUrl: item.image_url, basePrice: item.price, toppings: selected, quantity: qty });
    toast.success(`${item.name} ditambahkan ke keranjang`);
    if (goToCart) navigate({ to: "/cart" });
    else router.history.back();
  }

  return (
    <MobileShell bottomSpace>
      <div className="relative">
        <MenuImage src={item.image_url} alt={item.name} className="aspect-[4/4.2] w-full" />
        <div className="absolute inset-x-0 top-0 flex justify-between p-5">
          <button type="button" onClick={() => router.history.back()} aria-label="Kembali" className="flex size-11 items-center justify-center rounded-full bg-card/90 shadow-soft backdrop-blur">
            <ChevronLeft className="size-5" />
          </button>
          <Link to="/cart" aria-label="Keranjang" className="relative flex size-11 items-center justify-center rounded-full bg-card/90 shadow-soft backdrop-blur">
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-gold-foreground">{count}</span>
            )}
          </Link>
        </div>
      </div>

      <div className="relative -mt-8 rounded-t-[2rem] bg-background px-6 pb-4 pt-7">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">{CATEGORY_LABEL[item.category]}</p>
        <div className="mt-1 flex items-start justify-between gap-4">
          <h1 className="text-4xl font-semibold leading-tight">{item.name}</h1>
          <p className="mt-2 shrink-0 text-lg font-bold text-primary">{formatRupiah(item.price)}</p>
        </div>
        <p className="mt-3 leading-relaxed text-muted-foreground">{item.description}</p>

        {toppings.length > 0 && (
          <section className="mt-7">
            <h2 className="text-2xl font-semibold">Pilihan Topping</h2>
            <p className="text-xs text-muted-foreground">Opsional, boleh pilih lebih dari satu</p>
            <div className="mt-3 space-y-2">
              {toppings.map((t) => {
                const active = selected.some((s) => s.name === t.name);
                return (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => toggle(t)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-all",
                      active ? "border-gold bg-gold-soft/50" : "border-border bg-card",
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span className={cn("flex size-5 items-center justify-center rounded-md border", active ? "border-primary bg-primary text-primary-foreground" : "border-input")}>
                        {active && <Check className="size-3.5" />}
                      </span>
                      <span className="font-medium">{t.name}</span>
                    </span>
                    <span className="text-sm text-muted-foreground">{t.price > 0 ? `+${formatRupiah(t.price)}` : "Gratis"}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-7 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Jumlah</h2>
          <QuantityStepper value={qty} onChange={setQty} />
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40">
        <div className="mx-auto max-w-md rounded-t-3xl bg-card px-6 pt-4 shadow-float safe-bottom">
          {item.is_available ? (
            <div className="flex gap-3">
              <Button variant="soft" size="xl" className="px-5" onClick={() => addToCart(false)} aria-label="Tambah dan lanjut belanja">
                <ShoppingBag />
              </Button>
              <Button size="xl" className="flex-1" onClick={() => addToCart(true)}>
                Pesan · {formatRupiah(unit * qty)}
              </Button>
            </div>
          ) : (
            <Button size="xl" className="w-full" disabled>Sedang habis</Button>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
