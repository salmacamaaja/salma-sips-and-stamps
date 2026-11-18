import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, type OrderStatus } from "@/lib/format";

const statusStyle: Record<OrderStatus, string> = {
  menunggu: "bg-warning-soft text-primary",
  diproses: "bg-gold-soft text-primary",
  siap: "bg-accent text-primary",
  selesai: "bg-success-soft text-success",
  dibatalkan: "bg-muted text-muted-foreground line-through",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", statusStyle[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  size?: "sm" | "md";
}) {
  const btn = size === "sm" ? "size-7" : "size-10";
  return (
    <div className="flex items-center gap-3 rounded-full bg-secondary p-1">
      <button
        type="button"
        aria-label="Kurangi"
        onClick={() => onChange(Math.max(min, value - 1))}
        className={cn("flex items-center justify-center rounded-full bg-card text-primary shadow-soft", btn)}
      >
        <Minus className="size-4" />
      </button>
      <span className="min-w-5 text-center font-semibold">{value}</span>
      <button
        type="button"
        aria-label="Tambah"
        onClick={() => onChange(Math.min(50, value + 1))}
        className={cn("flex items-center justify-center rounded-full bg-primary text-primary-foreground", btn)}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

export function EmptyState({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="mx-5 flex flex-col items-center rounded-3xl bg-card px-6 py-12 text-center shadow-soft">
      <p className="font-display text-2xl font-semibold">{title}</p>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">{text}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
