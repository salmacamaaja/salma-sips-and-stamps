import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MobileShell, PageHeader } from "@/components/cafe/shell";
import { EmptyState, StatusBadge } from "@/components/cafe/bits";
import { Button } from "@/components/ui/button";
import { myOrdersQuery } from "@/lib/queries";
import { useAuthUser, useIsAdmin } from "@/lib/auth";
import { formatDateTime, formatRupiah, ORDER_TYPE_LABEL, PAYMENT_LABEL, parseToppings } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({
    meta: [
      { title: "Riwayat Pesanan — Cafe's" },
      { name: "description", content: "Pantau status dan riwayat pesananmu di Cafe's." },
      { property: "og:title", content: "Riwayat Pesanan — Cafe's" },
      { property: "og:description", content: "Pantau status dan riwayat pesananmu di Cafe's." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(myOrdersQuery(context.user.id)),
  component: OrdersPage,
});

function OrdersPage() {
  const user = useAuthUser();
  const isAdmin = useIsAdmin();
  const { data: orders } = useSuspenseQuery({ ...myOrdersQuery(user.id), refetchInterval: 15000 });

  return (
    <MobileShell nav={isAdmin ? "admin" : "user"}>
      <PageHeader title="Pesanan Saya" subtitle="Status diperbarui otomatis" />
      {orders.length === 0 ? (
        <EmptyState title="Belum ada pesanan" text="Pesanan yang kamu buat akan muncul di sini.">
          <Button asChild size="lg"><Link to="/home">Mulai Pesan</Link></Button>
        </EmptyState>
      ) : (
        <div className="space-y-4 px-5">
          {orders.map((order) => (
            <article key={order.id} className="rounded-3xl bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-xl font-semibold">#{order.order_code}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <ul className="mt-4 space-y-2">
                {order.order_items.map((it) => {
                  const tops = parseToppings(it.toppings);
                  return (
                    <li key={it.id} className="flex justify-between gap-3 text-sm">
                      <span>
                        <span className="font-medium">{it.quantity}× {it.name}</span>
                        {tops.length > 0 && <span className="block text-xs text-muted-foreground">{tops.map((t) => t.name).join(", ")}</span>}
                      </span>
                      <span className="shrink-0 text-muted-foreground">{formatRupiah(it.line_total)}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="text-muted-foreground">
                  {ORDER_TYPE_LABEL[order.order_type]} · {PAYMENT_LABEL[order.payment_method]}
                </span>
                <span className="font-bold text-primary">{formatRupiah(order.total)}</span>
              </div>
              {order.points_earned > 0 && (
                <p className="mt-2 text-xs font-semibold text-gold">+{order.points_earned} poin didapat</p>
              )}
            </article>
          ))}
        </div>
      )}
    </MobileShell>
  );
}
