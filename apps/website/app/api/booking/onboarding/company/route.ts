import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

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

    const nome = body.nome?.trim();
    const descricao = body.descricao?.trim() || null;

    if (!nome) {
      return NextResponse.json(
        { error: "O nome da empresa é obrigatório." },
        { status: 400 }
      );
    }

    // Primeiro verificar se o utilizador já pertence a uma empresa
    const { data: existingMember, error: memberError } = await supabase
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
        { error: "Não foi possível verificar a sua empresa." },
        { status: 500 }
      );
    }

    // Se já pertence a uma empresa, reutilizar a empresa existente
    if (existingMember?.company_id) {
      return NextResponse.json({
        success: true,
        existing_company: true,
        company_id: existingMember.company_id,
      });
    }

    // Criar nova empresa e associação de forma atómica
    const { data: company, error: companyError } = await supabase.rpc(
      "criar_empresa_booking",
      {
        p_nome: nome,
        p_descricao: descricao,
      }
    );

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
    console.error("Erro no onboarding da empresa Booking:", error);

    return NextResponse.json(
      { error: "Ocorreu um erro inesperado." },
      { status: 500 }
    );
  }
}