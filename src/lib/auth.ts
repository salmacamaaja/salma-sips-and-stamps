import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isAdminQuery } from "@/lib/queries";

const authRoute = getRouteApi("/_authenticated");

export function useAuthUser() {
  return authRoute.useRouteContext().user;
}

export function useIsAdmin() {
  const user = useAuthUser();
  return useQuery(isAdminQuery(user.id)).data ?? false;
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}
