import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ImagePlus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABEL, parseToppings, type MenuCategory, type Topping } from "@/lib/format";
import type { MenuItem } from "@/lib/queries";
import { MenuImage } from "./menu-card";

/** Shrinks an uploaded photo to a compact JPEG so it can be stored with the menu item. */
async function fileToCompressedDataUrl(file: File, max = 800): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  } finally {
    URL.revokeObjectURL(url);
  }
}

type FormState = {
  name: string;
  category: MenuCategory;
  price: string;
  description: string;
  image_url: string;
  toppings: { name: string; price: string }[];
  is_best_seller: boolean;
  is_available: boolean;
};

const empty: FormState = {
  name: "",
  category: "minuman",
  price: "",
  description: "",
  image_url: "",
  toppings: [],
  is_best_seller: false,
  is_available: true,
};

export function MenuFormDialog({
  open,
  onOpenChange,
  item,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  item: MenuItem | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      item
        ? {
            name: item.name,
            category: item.category,
            price: String(item.price),
            description: item.description,
            image_url: item.image_url,
            toppings: parseToppings(item.toppings).map((t) => ({ name: t.name, price: String(t.price) })),
            is_best_seller: item.is_best_seller,
            is_available: item.is_available,
          }
        : empty,
    );
  }, [open, item]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function onFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("File harus berupa gambar"); return; }
    try {
      set("image_url", await fileToCompressedDataUrl(file));
    } catch {
      toast.error("Gagal membaca gambar");
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const price = Number(form.price);
    if (form.name.trim().length < 2) { toast.error("Nama menu wajib diisi"); return; }
    if (!Number.isFinite(price) || price < 0) { toast.error("Harga tidak valid"); return; }
    const toppings: Topping[] = form.toppings
      .filter((t) => t.name.trim())
      .map((t) => ({ name: t.name.trim(), price: Math.max(0, Number(t.price) || 0) }));
    const payload = {
      name: form.name.trim(),
      category: form.category,
      price: Math.round(price),
      description: form.description.trim(),
      image_url: form.image_url,
      toppings,
      is_best_seller: form.is_best_seller,
      is_available: form.is_available,
      updated_at: new Date().toISOString(),
    };
    setSaving(true);
    const { error } = item
      ? await supabase.from("menu_items").update(payload).eq("id", item.id)
      : await supabase.from("menu_items").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(item ? "Menu diperbarui" : "Menu ditambahkan");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-md overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl">{item ? "Edit Menu" : "Tambah Menu"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center gap-4">
            <MenuImage src={form.image_url} alt="Foto menu" className="size-24 shrink-0 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-sm font-semibold text-primary">
                <ImagePlus className="size-4" /> Unggah foto
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
              </label>
              <Input
                value={form.image_url.startsWith("data:") ? "" : form.image_url}
                onChange={(e) => set("image_url", e.target.value)}
                placeholder="atau tempel URL foto"
                className="h-10 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mname">Nama menu</Label>
            <Input id="mname" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v as MenuCategory)}>
                <SelectTrigger className="h-12 rounded-xl bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_LABEL) as MenuCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mprice">Harga (Rp)</Label>
              <Input id="mprice" type="number" inputMode="numeric" min={0} value={form.price} onChange={(e) => set("price", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mdesc">Deskripsi</Label>
            <Textarea id="mdesc" value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Topping</Label>
              <Button type="button" variant="soft" size="sm" onClick={() => set("toppings", [...form.toppings, { name: "", price: "0" }])}>
                <Plus /> Tambah
              </Button>
            </div>
            {form.toppings.map((t, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={t.name}
                  placeholder="Nama topping"
                  className="h-10 flex-1"
                  onChange={(e) => set("toppings", form.toppings.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                />
                <Input
                  value={t.price}
                  type="number"
                  min={0}
                  placeholder="Harga"
                  className="h-10 w-28"
                  onChange={(e) => set("toppings", form.toppings.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))}
                />
                <Button type="button" variant="ghost" size="icon" aria-label="Hapus topping" onClick={() => set("toppings", form.toppings.filter((_, j) => j !== i))}>
                  <X />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-3 rounded-2xl bg-secondary p-4">
            <label className="flex items-center justify-between text-sm font-medium">
              Tampilkan sebagai Best Seller
              <Switch checked={form.is_best_seller} onCheckedChange={(v) => set("is_best_seller", v)} />
            </label>
            <label className="flex items-center justify-between text-sm font-medium">
              Tersedia untuk dipesan
              <Switch checked={form.is_available} onCheckedChange={(v) => set("is_available", v)} />
            </label>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={saving}>
            {saving ? "Menyimpan…" : "Simpan Menu"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
