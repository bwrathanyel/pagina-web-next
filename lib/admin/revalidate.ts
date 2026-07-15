import { supabaseBrowser } from "@/lib/supabase/client";

export async function revalidarSitioPublico() {
  const { data, error } = await supabaseBrowser().auth.getSession();
  const token = data.session?.access_token;
  if (error || !token) throw new Error("sesion_admin_invalida");

  const response = await fetch("/api/admin/revalidate", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("revalidacion_fallida");
}
