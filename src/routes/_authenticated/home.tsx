import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, ShoppingBag, Sparkles } from "lucide-react";
import { MobileShell } from "@/components/cafe/shell";
import { BestSellerCard, MenuRow } from "@/components/cafe/menu-card";
import { Input } from "@/components/ui/input";
import { menuQuery, profileQuery } from "@/lib/queries";
import { useAuthUser, useIsAdmin } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { CATEGORY_LABEL, greeting, type MenuCategory } from "@/lib/format";
import { cn } from "@/lib/utils";
import promoBanner from "@/assets/promo-banner.jpg";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Beranda — Cafe's" },
      { name: "description", content: "Jelajahi minuman, dessert, dan makanan berat pilihan di Cafe's." },
      { property: "og:title", content: "Beranda — Cafe's" },
      { property: "og:description", content: "Jelajahi minuman, dessert, dan makanan berat pilihan di Cafe's." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(menuQuery()),
  component: HomePage,
});

const CATEGORIES: (MenuCategory | "semua")[] = ["semua", "minuman", "dessert", "makanan"];

function HomePage() {
  const user = useAuthUser();
  const isAdmin = useIsAdmin();
  const { data: menu } = useSuspenseQuery(menuQuery());
  const { data: profile } = useQuery(profileQuery(user.id));
  const { count } = useCart();
  const [category, setCategory] = useState<MenuCategory | "semua">("semua");
  const [search, setSearch] = useState("");

  const bestSellers = menu.filter((m) => m.is_best_seller && m.is_available);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return menu.filter(
      (m) =>
        (category === "semua" || m.category === category) &&
        (!q || m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)),
    );
  }, [menu, category, search]);

  const firstName = (profile?.full_name || "").split(" ")[0];

  return (
    <MobileShell nav={isAdmin ? "admin" : "user"}>
      <header className="flex items-center justify-between px-5 pb-2 pt-7">
        <div>
          <p className="text-sm text-muted-foreground">{greeting()},</p>
          <h1 className="text-3xl font-semibold leading-tight">{firstName || "Teman Kopi"}</h1>
        </div>
        <Link
          to="/cart"
          className="relative flex size-12 items-center justify-center rounded-full bg-card shadow-soft"
          aria-label="Keranjang"
        >
          <ShoppingBag className="size-5 text-primary" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-gold-foreground">
              {count}
            </span>
          )}
        </Link>
      </header>

      <div className="px-5 pt-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kopi, dessert, makanan…"
            className="rounded-full border-transparent pl-11 shadow-soft"
          />
        </div>
      </div>

      {/* Promo banners */}
      <section className="no-scrollbar mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5">
        <div className="relative h-44 w-[88%] shrink-0 snap-center overflow-hidden rounded-3xl shadow-card">
          <img src={promoBanner} alt="Kopi, croissant, dan tiramisu di meja marmer" className="absolute inset-0 size-full object-cover" width={1200} height={675} />
          <div className="absolute inset-0 bg-gradient-scrim" />
          <div className="relative flex h-full flex-col justify-center p-5 text-primary-foreground">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold-soft">Paket Pagi</p>
            <p className="mt-1 max-w-[60%] font-display text-2xl font-semibold leading-tight">Kopi & croissant untuk awal yang tenang</p>
          </div>
        </div>
        <div className="relative h-44 w-[88%] shrink-0 snap-center overflow-hidden rounded-3xl bg-gradient-coffee shadow-card">
          <div className="flex h-full items-center gap-4 p-5 text-primary-foreground">
            <div className="flex-1">
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-gold-soft">
                <Sparkles className="size-3" /> Poin Member
              </p>
              <p className="mt-1 font-display text-2xl font-semibold leading-tight">1 poin setiap belanja Rp10.000</p>
              <p className="mt-1 text-xs opacity-80">Poinmu saat ini: {profile?.points ?? 0}</p>
            </div>
            <img src="/images/menu/cheesecake-bakar.jpg" alt="Cheesecake bakar" className="size-28 rounded-full border-2 border-gold/60 object-cover" loading="lazy" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="no-scrollbar mt-6 flex gap-2 overflow-x-auto px-5">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              "shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-all",
              category === c ? "bg-primary text-primary-foreground shadow-soft" : "bg-card text-muted-foreground",
            )}
          >
            {c === "semua" ? "Semua" : CATEGORY_LABEL[c]}
          </button>
        ))}
      </section>

      {category === "semua" && !search && bestSellers.length > 0 && (
        <section className="mt-7">
          <div className="flex items-baseline justify-between px-5">
            <h2 className="text-2xl font-semibold">Best Seller</h2>
            <span className="text-xs text-muted-foreground">Favorit pelanggan</span>
          </div>
          <div className="no-scrollbar mt-3 flex gap-4 overflow-x-auto px-5 pb-4">
            {bestSellers.map((item) => (
              <BestSellerCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-4 px-5">
        <h2 className="text-2xl font-semibold">
          {category === "semua" ? "Semua Menu" : CATEGORY_LABEL[category]}
        </h2>
        <div className="mt-3 space-y-3">
          {filtered.map((item) => (
            <MenuRow key={item.id} item={item} />
          ))}
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">Menu tidak ditemukan.</p>
          )}
        </div>
      </section>
    </MobileShell>
  );
}
