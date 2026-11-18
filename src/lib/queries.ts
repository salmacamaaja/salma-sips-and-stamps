import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type OrderWithItems = Order & { order_items: OrderItem[] };
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const menuQuery = () =>
  queryOptions({
    queryKey: ["menu"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("category")
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

export const menuItemQuery = (id: string) =>
  queryOptions({
    queryKey: ["menu", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_items").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const isAdminQuery = (userId: string) =>
  queryOptions({
    queryKey: ["is-admin", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    staleTime: 5 * 60 * 1000,
  });

export const myOrdersQuery = (userId: string) =>
  queryOptions({
    queryKey: ["orders", "mine", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OrderWithItems[];
    },
  });

export const allOrdersQuery = () =>
  queryOptions({
    queryKey: ["orders", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data as OrderWithItems[];
    },
  });
