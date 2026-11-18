import type { ReactNode } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft, Home, ShoppingBag, ReceiptText, User, LayoutDashboard, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import { SiteFooter } from "./footer";
import { useCart } from "@/lib/cart";

/** Phone-width column used by every page so the app feels native on Android & iOS. */
export function MobileShell({
  children,
  nav,
  className,
  bottomSpace,
}: {
  children: ReactNode;
  nav?: "user" | "admin" | false;
  className?: string;
  /** Extra space under the footer when a page has its own fixed bottom bar. */
  bottomSpace?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className={cn("relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background", className)}>
        <main className={cn("flex-1", nav && "pb-4")}>{children}</main>
        <SiteFooter />
        {(nav || bottomSpace) && <div className={bottomSpace ? "h-28" : "h-20"} aria-hidden />}
        {nav === "user" && <UserNav />}
        {nav === "admin" && <AdminNav />}
      </div>
    </div>
  );
}

const navItem =
  "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium text-muted-foreground transition-colors [&.active]:text-primary";

function NavBar({ children }: { children: ReactNode }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto max-w-md px-4 safe-bottom">
        <div className="flex items-center rounded-3xl border border-border/70 bg-card/95 px-2 shadow-float backdrop-blur">
          {children}
        </div>
      </div>
    </nav>
  );
}

function UserNav() {
  const { count } = useCart();
  return (
    <NavBar>
      <Link to="/home" className={navItem}>
        <Home className="size-5" />
        Beranda
      </Link>
      <Link to="/cart" className={navItem}>
        <span className="relative">
          <ShoppingBag className="size-5" />
          {count > 0 && (
            <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-foreground">
              {count}
            </span>
          )}
        </span>
        Keranjang
      </Link>
      <Link to="/orders" className={navItem}>
        <ReceiptText className="size-5" />
        Pesanan
      </Link>
      <Link to="/profile" className={navItem}>
        <User className="size-5" />
        Profil
      </Link>
    </NavBar>
  );
}

function AdminNav() {
  return (
    <NavBar>
      <Link to="/admin" className={navItem}>
        <LayoutDashboard className="size-5" />
        Dashboard
      </Link>
      <Link to="/home" className={navItem}>
        <Coffee className="size-5" />
        Lihat Menu
      </Link>
      <Link to="/profile" className={navItem}>
        <User className="size-5" />
        Profil
      </Link>
    </NavBar>
  );
}

export function PageHeader({
  title,
  subtitle,
  back = false,
  action,
}: {
  title: string;
  subtitle?: string | undefined;
  back?: boolean;
  action?: ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 bg-background/90 px-5 pb-4 pt-6 backdrop-blur">
      <div className="flex items-center gap-3">
        {back && (
          <button
            type="button"
            onClick={() => router.history.back()}
            className="flex size-10 items-center justify-center rounded-full bg-card shadow-soft"
            aria-label="Kembali"
          >
            <ChevronLeft className="size-5" />
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-semibold leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}
