import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ChevronRight, LayoutDashboard, LogOut, ReceiptText, Sparkles } from "lucide-react";
import { MobileShell, PageHeader } from "@/components/cafe/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { myOrdersQuery, profileQuery } from "@/lib/queries";
import { useAuthUser, useIsAdmin, useSignOut } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profil — Cafe's" },
      { name: "description", content: "Kelola profil, alamat, dan lihat poin member Cafe's kamu." },
      { property: "og:title", content: "Profil — Cafe's" },
      { property: "og:description", content: "Kelola profil, alamat, dan lihat poin member Cafe's kamu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(profileQuery(context.user.id)),
  component: ProfilePage,
});

function ProfilePage() {
  const user = useAuthUser();
  const isAdmin = useIsAdmin();
  const signOut = useSignOut();
  const queryClient = useQueryClient();
  const { data: profile } = useSuspenseQuery(profileQuery(user.id));
  const { data: orders } = useQuery(myOrdersQuery(user.id));
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
    setAddress(profile?.address ?? "");
  }, [profile]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (fullName.trim().length < 2) { toast.error("Nama minimal 2 karakter"); return; }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), phone: phone.trim(), address: address.trim(), updated_at: new Date().toISOString() })
      .eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    toast.success("Profil disimpan");
  }

  const initial = (profile?.full_name || user.email || "?").charAt(0).toUpperCase();
  const completed = orders?.filter((o) => o.status === "selesai").length ?? 0;

  return (
    <MobileShell nav={isAdmin ? "admin" : "user"}>
      <PageHeader title="Profil" />
      <div className="space-y-6 px-5">
        <section className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-gradient-coffee font-display text-3xl italic text-primary-foreground shadow-card">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-2xl font-semibold">{profile?.full_name || "Tanpa nama"}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            {isAdmin && <span className="mt-1 inline-block rounded-full bg-gold-soft px-2.5 py-0.5 text-[11px] font-semibold text-primary">Admin</span>}
          </div>
        </section>

        {!isAdmin && (
          <section className="relative overflow-hidden rounded-3xl bg-gradient-coffee p-6 text-primary-foreground shadow-card">
            <div className="absolute -right-10 -top-10 size-40 rounded-full border border-gold/30" />
            <div className="absolute -right-4 -top-4 size-24 rounded-full border border-gold/30" />
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-gold-soft">
              <Sparkles className="size-3.5" /> Poin Member
            </p>
            <p className="mt-2 font-display text-5xl font-semibold">{profile?.points ?? 0}</p>
            <p className="mt-1 text-xs opacity-80">1 poin setiap Rp10.000 · ditambahkan saat pesanan selesai</p>
            <div className="mt-4 flex gap-6 text-sm">
              <div>
                <p className="text-lg font-semibold">{orders?.length ?? 0}</p>
                <p className="text-xs opacity-75">Total pesanan</p>
              </div>
              <div>
                <p className="text-lg font-semibold">{completed}</p>
                <p className="text-xs opacity-75">Selesai</p>
              </div>
            </div>
          </section>
        )}

        <section className="overflow-hidden rounded-3xl bg-card shadow-soft">
          {isAdmin ? (
            <Link to="/admin" className="flex items-center gap-3 px-5 py-4">
              <LayoutDashboard className="size-5 text-gold" />
              <span className="flex-1 font-medium">Dashboard Admin</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ) : (
            <Link to="/orders" className="flex items-center gap-3 px-5 py-4">
              <ReceiptText className="size-5 text-gold" />
              <span className="flex-1 font-medium">Riwayat Pesanan</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          )}
        </section>

        <form onSubmit={save} className="space-y-4 rounded-3xl bg-card p-5 shadow-soft">
          <h2 className="text-2xl font-semibold">Data Diri</h2>
          <div className="space-y-2">
            <Label htmlFor="pname">Nama lengkap</Label>
            <Input id="pname" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pphone">Nomor telepon</Label>
            <Input id="pphone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paddr">Alamat (untuk delivery)</Label>
            <Textarea id="paddr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Alamat lengkap" />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={saving}>
            {saving ? "Menyimpan…" : "Simpan Perubahan"}
          </Button>
        </form>

        <Button variant="outline" size="lg" className="w-full text-destructive" onClick={signOut}>
          <LogOut /> Keluar
        </Button>
      </div>
    </MobileShell>
  );
}
