import { createSupabaseServerClient } from "@/lib/supabase-server";

export type BookingPermission =
  | "agenda"
  | "clientes"
  | "marcacoes"
  | "servicos"
  | "profissionais"
  | "disponibilidade"
  | "bloqueios"
  | "financeiro"
  | "configuracoes"
  | "equipa";

export async function getBookingAccess() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: membro, error } = await supabase
    .from("company_members")
    .select(
      "id, company_id, role, username, is_active, must_change_password"
    )
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error || !membro) {
    return null;
  }

  if (!membro.is_active) {
    return null;
  }

  const { data: permissoes, error: permissoesError } = await supabase
    .from("company_member_permissions")
    .select("permission")
    .eq("member_id", membro.id);

  if (permissoesError) {
    return null;
  }

  const permissions = new Set(
    (permissoes ?? []).map((item) => item.permission as BookingPermission)
  );

  return {
    userId: user.id,
    memberId: membro.id,
    companyId: membro.company_id,
    role: membro.role,
    username: membro.username,
    mustChangePassword: membro.must_change_password,
    isAdmin: membro.role === "admin",

    can(permission: BookingPermission) {
      return membro.role === "admin" || permissions.has(permission);
    },
  };
}