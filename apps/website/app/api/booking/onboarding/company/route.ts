import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const nome =
      typeof body?.nome === "string"
        ? body.nome.trim()
        : "";

    const descricao =
      typeof body?.descricao === "string"
        ? body.descricao.trim()
        : "";

    if (!nome) {
      return NextResponse.json(
        { error: "O nome da empresa é obrigatório." },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();

    // Verificar se o utilizador já pertence a uma empresa.
    const { data: existingMember, error: memberError } =
      await supabaseAdmin
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

    if (memberError) {
      console.error(
        "Erro ao verificar empresa existente:",
        memberError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível verificar a sua empresa.",
        },
        { status: 500 }
      );
    }

    // Se já pertence a uma empresa, reutilizar a empresa existente.
    if (existingMember?.company_id) {
      return NextResponse.json({
        success: true,
        existing_company: true,
        company_id: existingMember.company_id,
      });
    }

    // Obter o email do utilizador autenticado para gerar
    // o username inicial do administrador.
    const {
      data: authUser,
      error: authUserError,
    } = await supabaseAdmin.auth.admin.getUserById(user.id);

    if (authUserError || !authUser.user?.email) {
      console.error(
        "Erro ao obter utilizador Auth:",
        authUserError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível determinar o utilizador.",
        },
        { status: 500 }
      );
    }

    const username = authUser.user.email
      .split("@")[0]
      .trim()
      .toLowerCase();

    if (!username) {
      return NextResponse.json(
        {
          error:
            "Não foi possível determinar o nome de utilizador.",
        },
        { status: 500 }
      );
    }

    // Criar a empresa.
    const { data: company, error: companyError } =
      await supabaseAdmin
        .from("companies")
        .insert({
          name: nome,
          description: descricao || "",
        })
        .select("id, name, description")
        .single();

    if (companyError || !company) {
      console.error(
        "Erro ao criar empresa Booking:",
        companyError
      );

      return NextResponse.json(
        {
          error:
            companyError?.message ||
            "Não foi possível criar a empresa.",
        },
        { status: 500 }
      );
    }

    // Criar o administrador da empresa.
    const { error: memberInsertError } =
      await supabaseAdmin
        .from("company_members")
        .insert({
          user_id: user.id,
          company_id: company.id,
          role: "admin",
          username,
          is_active: true,
          must_change_password: false,
        });

    if (memberInsertError) {
      console.error(
        "Erro ao criar administrador da empresa:",
        memberInsertError
      );

      // Limpar a empresa criada se a associação falhar.
      await supabaseAdmin
        .from("companies")
        .delete()
        .eq("id", company.id);

      return NextResponse.json(
        {
          error:
            "Não foi possível concluir a criação da empresa.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      existing_company: false,
      company_id: company.id,
      company: {
        id: company.id,
        name: company.name,
        description: company.description,
      },
    });
  } catch (error) {
    console.error(
      "Erro no onboarding da empresa Booking:",
      error
    );

    return NextResponse.json(
      { error: "Ocorreu um erro inesperado." },
      { status: 500 }
    );
  }
}