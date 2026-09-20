import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  /*
   * Validar sessão
   */
  const { data: claimsData } = await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  const pathname = request.nextUrl.pathname;

  /*
   * Áreas privadas existentes do Nexora AI
   */
  const areaPrivada =
    pathname.startsWith("/nexora-ai/dashboard") ||
    pathname.startsWith("/nexora-ai/knowledge");

  if (areaPrivada && !userId) {
    return NextResponse.redirect(
      new URL("/nexora-ai/login", request.url)
    );
  }

  /*
   * Área privada do Nexora Booking
   */
  const areaBooking = pathname.startsWith("/nexora-ai/booking");

  if (areaBooking) {
    /*
     * Sem sessão → login do Booking
     */
    if (!userId) {
      return NextResponse.redirect(
        new URL("/booking/login", request.url)
      );
    }

    /*
     * Procurar membro associado ao utilizador
     */
    const { data: membro, error } = await supabase
      .from("company_members")
      .select(
        "id, company_id, role, username, is_active, must_change_password"
      )
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    /*
     * Utilizador sem membro válido
     */
    if (error || !membro) {
      return NextResponse.redirect(
        new URL("/booking/login", request.url)
      );
    }

    /*
     * Conta desativada
     */
    if (!membro.is_active) {
      return NextResponse.redirect(
        new URL("/booking/login", request.url)
      );
    }

    /*
     * Primeiro acesso
     */
    if (membro.must_change_password) {
      return NextResponse.redirect(
        new URL("/booking/alterar-password", request.url)
      );
    }

    /*
     * Admin tem acesso total
     */
    if (membro.role === "admin") {
      return supabaseResponse;
    }

    /*
     * Mapa entre URL e permissão
     */
    const permissionByPath = [
      {
        path: "/nexora-ai/booking/calendario",
        permission: "agenda",
      },
      {
        path: "/nexora-ai/booking/agendamentos",
        permission: "marcacoes",
      },
      {
        path: "/nexora-ai/booking/clientes",
        permission: "clientes",
      },
      {
        path: "/nexora-ai/booking/servicos",
        permission: "servicos",
      },
      {
        path: "/nexora-ai/booking/profissionais",
        permission: "profissionais",
      },
      {
        path: "/nexora-ai/booking/disponibilidade",
        permission: "disponibilidade",
      },
      {
        path: "/nexora-ai/booking/bloqueios",
        permission: "bloqueios",
      },
      {
        path: "/nexora-ai/booking/financeiro",
        permission: "financeiro",
      },
      {
        path: "/nexora-ai/booking/configuracoes",
        permission: "configuracoes",
      },
      {
        path: "/nexora-ai/booking/equipa",
        permission: "equipa",
      },
    ] as const;

    /*
     * Descobrir se a URL atual exige uma permissão
     */
    const protectedRoute = permissionByPath.find((route) =>
      pathname.startsWith(route.path)
    );

    /*
     * Rotas gerais do Booking não exigem uma
     * permissão específica.
     */
    if (!protectedRoute) {
      return supabaseResponse;
    }

    /*
     * Verificar permissão do funcionário
     */
    const { data: permissao, error: permissaoError } = await supabase
      .from("company_member_permissions")
      .select("id")
      .eq("member_id", membro.id)
      .eq("permission", protectedRoute.permission)
      .limit(1)
      .maybeSingle();

    /*
     * Sem permissão → acesso negado
     */
    if (permissaoError || !permissao) {
      return NextResponse.redirect(
        new URL("/nexora-ai/booking", request.url)
      );
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};