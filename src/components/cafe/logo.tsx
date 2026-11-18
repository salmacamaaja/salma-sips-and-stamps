import { cn } from "@/lib/utils";

export function SalmaLogo({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const text = size === "lg" ? "text-7xl" : size === "md" ? "text-4xl" : "text-2xl";
  return (
    <div className={cn("flex flex-col items-center text-primary", className)}>
      <span className={cn("font-display font-semibold italic leading-none", text)}>Salma</span>
      <span className="mt-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.4em] text-gold">
        <span className="h-px w-6 bg-gold" />
        Cafe&apos;s
        <span className="h-px w-6 bg-gold" />
      </span>
    </div>
  );
}
