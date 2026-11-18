import { Link } from "@tanstack/react-router";
import { Plus, Star } from "lucide-react";
import { formatRupiah, CATEGORY_LABEL } from "@/lib/format";
import type { MenuItem } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function MenuImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  if (!src) {
    return (
      <div className={cn("flex items-center justify-center bg-secondary font-display text-2xl italic text-gold", className)}>
        Salma
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" className={cn("object-cover", className)} />;
}

export function BestSellerCard({ item }: { item: MenuItem }) {
  return (
    <Link
      to="/menu/$id"
      params={{ id: item.id }}
      className="w-44 shrink-0 overflow-hidden rounded-3xl bg-card shadow-card"
    >
      <div className="relative">
        <MenuImage src={item.image_url} alt={item.name} className="aspect-square w-full" />
        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 text-[10px] font-semibold text-primary">
          <Star className="size-3 fill-gold text-gold" /> Best Seller
        </span>
      </div>
      <div className="p-3.5">
        <p className="line-clamp-1 font-display text-lg font-semibold leading-tight">{item.name}</p>
        <p className="mt-1 text-sm font-semibold text-primary">{formatRupiah(item.price)}</p>
      </div>
    </Link>
  );
}

export function MenuRow({ item }: { item: MenuItem }) {
  return (
    <Link
      to="/menu/$id"
      params={{ id: item.id }}
      className={cn(
        "flex items-center gap-4 rounded-3xl bg-card p-3 shadow-soft",
        !item.is_available && "opacity-60",
      )}
    >
      <MenuImage src={item.image_url} alt={item.name} className="size-20 shrink-0 rounded-2xl" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-gold">{CATEGORY_LABEL[item.category]}</p>
        <p className="line-clamp-1 font-display text-lg font-semibold leading-tight">{item.name}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{item.description}</p>
        <p className="mt-1 text-sm font-semibold">
          {item.is_available ? formatRupiah(item.price) : "Sedang habis"}
        </p>
      </div>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Plus className="size-4" />
      </span>
    </Link>
  );
}
