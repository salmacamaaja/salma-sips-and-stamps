import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SalmaLogo } from "@/components/cafe/logo";
import { SiteFooter } from "@/components/cafe/footer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Masuk — Cafe's" },
      { name: "description", content: "Masuk atau daftar akun Cafe's untuk memesan dan mengumpulkan poin." },
      { property: "og:title", content: "Masuk — Cafe's" },
      { property: "og:description", content: "Masuk atau daftar akun Cafe's untuk memesan dan mengumpulkan poin." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

async function destinationFor(userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return data ? ("/admin" as const) : ("/home" as const);
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) navigate({ to: await destinationFor(data.user.id), replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw new Error(error.message === "Invalid login credentials" ? "Email atau password salah." : error.message);
        toast.success("Selamat datang kembali ☕");
        navigate({ to: await destinationFor(data.user.id), replace: true });
      } else {
        if (fullName.trim().length < 2) throw new Error("Nama lengkap wajib diisi.");
        if (password.length < 6) throw new Error("Password minimal 6 karakter.");
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: fullName.trim() } },
        });
        if (error) throw error;
        if (data.session && data.user) {
          navigate({ to: "/home", replace: true });
        } else {
          setSentTo(email.trim());
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(kind: "admin" | "user") {
    setMode("login");
    setEmail(kind === "admin" ? "admin@coffe.com" : "user@coffe.com");
    setPassword(kind === "admin" ? "admin123" : "user123");
  }

  return (
    <div className="min-h-screen bg-gradient-ivory">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6">
        <div className="flex flex-col items-center pb-8 pt-14">
          <SalmaLogo size="md" />
          <h1 className="mt-8 text-center text-3xl font-semibold">
            {mode === "login" ? "Selamat datang" : "Buat akun baru"}
          </h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            {mode === "login" ? "Masuk untuk mulai memesan." : "Daftar dan kumpulkan poin di setiap pesanan."}
          </p>
        </div>

        {sentTo ? (
          <div className="rounded-3xl bg-card p-8 text-center shadow-card">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-gold-soft text-primary">
              <Mail className="size-6" />
            </div>
            <p className="mt-4 font-display text-2xl font-semibold">Cek email kamu</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Kami mengirim tautan konfirmasi ke <span className="font-semibold text-foreground">{sentTo}</span>.
              Klik tautan itu, lalu masuk dengan akunmu.
            </p>
            <Button variant="soft" className="mt-6" onClick={() => { setSentTo(null); setMode("login"); }}>
              Kembali ke halaman masuk
            </Button>
          </div>
        ) : (
          <div className="rounded-3xl bg-card p-6 shadow-card">
            <div className="mb-6 grid grid-cols-2 rounded-full bg-secondary p-1">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded-full py-2.5 text-sm font-semibold transition-all",
                    mode === m ? "bg-card text-primary shadow-soft" : "text-muted-foreground",
                  )}
                >
                  {m === "login" ? "Masuk" : "Daftar"}
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nama lengkap</Label>
                  <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama kamu" autoComplete="name" required />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" autoComplete="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    required
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPw ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Mohon tunggu…" : mode === "login" ? "Masuk" : "Daftar Akun"}
              </Button>
            </form>
          </div>
        )}

        <div className="mt-6 rounded-3xl border border-dashed border-gold/60 p-4">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-gold">Akun contoh</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="soft" size="sm" onClick={() => fillDemo("user")}>Isi akun User</Button>
            <Button variant="soft" size="sm" onClick={() => fillDemo("admin")}>Isi akun Admin</Button>
          </div>
        </div>

        <div className="mt-auto">
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}
