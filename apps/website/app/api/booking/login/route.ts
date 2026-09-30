import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const username =
      typeof body?.username === "string"
        ? body.username.trim().toLowerCase()
        : "";

    const password =
      typeof body?.password === "string"
        ? body.password
        : "";

    if (!username || !password) {
      return NextResponse.json(
        {
          error:
            "Nome de utilizador e palavra-passe são obrigatórios.",
        },
        { status: 400 },
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();

    // Procurar o membro pelo username.
    const { data: membro, error: membroError } =
      await supabaseAdmin
        .from("company_members")
        .select(
          "id, user_id, company_id, role, username, is_active, must_change_password",
        )
        .ilike("username", username)
        .limit(1)
        .maybeSingle();

    if (membroError) {
      console.error(
        "Erro ao procurar membro pelo username:",
        membroError,
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível validar o nome de utilizador.",
        },
        { status: 500 },
      );
    }

    if (!membro) {
      return NextResponse.json(
        {
          error:
            "Nome de utilizador ou palavra-passe incorretos.",
        },
        { status: 401 },
      );
    }

    if (!membro.is_active) {
      return NextResponse.json(
        {
          error: "Esta conta está desativada.",
        },
        { status: 403 },
      );
    }

    // Obter o email real da conta Auth através do user_id.
    const {
      data: authUser,
      error: authUserError,
    } = await supabaseAdmin.auth.admin.getUserById(
      membro.user_id,
    );

    if (authUserError || !authUser.user?.email) {
      console.error(
        "Erro ao obter utilizador Auth:",
        authUserError,
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível localizar a conta de autenticação.",
        },
        { status: 500 },
      );
    }

    const email = authUser.user.email;

    /*
     * Agora fazemos a autenticação normal do Supabase
     * com o email interno/real associado ao username.
     *
     * A palavra-passe nunca é armazenada por nós.
     */
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const {
      data: sessionData,
      error: loginError,
    } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError || !sessionData.session) {
      console.error(
        "Erro de autenticação do Booking:",
        loginError,
      );

      return NextResponse.json(
        {
          error:
            "Nome de utilizador ou palavra-passe incorretos.",
        },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
      },
      must_change_password: membro.must_change_password,
    });
  } catch (error) {
    console.error(
      "Erro inesperado no login do Booking:",
      error,
    );

    return NextResponse.json(
      {
        error: "Ocorreu um erro ao iniciar sessão.",
      },
      { status: 500 },
    );
  }
}