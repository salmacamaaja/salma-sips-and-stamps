import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteFooter } from "@/components/cafe/footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cafe's by Salma — Selamat Datang" },
      { name: "description", content: "Cafe's: tempat santai untuk kopi, dessert, dan makanan hangat. Pesan langsung dari ponselmu." },
      { property: "og:title", content: "Cafe's by Salma — Selamat Datang" },
      { property: "og:description", content: "Tempat santai untuk kopi, dessert, dan makanan hangat. Pesan langsung dari ponselmu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!data.user) return navigate({ to: "/auth", replace: true });
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!cancelled) navigate({ to: role ? "/admin" : "/home", replace: true });
    }, 2400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-ivory">
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="mb-8 flex size-24 items-center justify-center rounded-full border border-gold/50 animate-fade-up">
          <div className="flex size-20 items-center justify-center rounded-full bg-gradient-coffee font-display text-4xl italic text-primary-foreground shadow-card">
            S
          </div>
        </div>
        <h1 className="font-display text-7xl font-semibold italic text-primary animate-splash-rise">Salma</h1>
        <div className="mt-5 h-px w-28 origin-center bg-gold animate-line-grow" />
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.45em] text-gold animate-fade-up">
          Cafe&apos;s
        </p>
        <p className="mt-2 text-sm text-muted-foreground animate-fade-up">Kopi, rasa, dan waktu santai.</p>
      </div>
      <SiteFooter />
    </div>
  );
}
