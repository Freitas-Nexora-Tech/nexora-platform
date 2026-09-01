import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    // ─────────────────────────────────────
    // 1. Verificar utilizador autenticado
    // ─────────────────────────────────────

    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Não autenticado.",
        },
        { status: 401 }
      );
    }

    // ─────────────────────────────────────
    // 2. Verificar se é administrador Nexora
    // ─────────────────────────────────────

    const { data: admin } = await supabase
      .from("nexora_admins")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (admin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Administradores Nexora não utilizam este processo.",
        },
        { status: 403 }
      );
    }

    // ─────────────────────────────────────
    // 3. Verificar se já tem empresa
    // ─────────────────────────────────────

    const { data: membroExistente } = await supabase
      .from("company_members")
      .select("id, company_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (membroExistente) {
      return NextResponse.json(
        {
          success: false,
          error: "Este utilizador já possui uma empresa.",
          company_id: membroExistente.company_id,
        },
        { status: 409 }
      );
    }

    // ─────────────────────────────────────
    // 4. Ler dados enviados pelo formulário
    // ─────────────────────────────────────

    const body = await request.json();

    const nome = String(body.nome ?? "").trim();
    const descricao = String(body.descricao ?? "").trim();

    if (!nome) {
      return NextResponse.json(
        {
          success: false,
          error: "O nome da empresa é obrigatório.",
        },
        { status: 400 }
      );
    }

    if (nome.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error:
            "O nome da empresa deve ter pelo menos 2 caracteres.",
        },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────
    // 5. Cliente administrativo
    // ─────────────────────────────────────

    const adminSupabase = createSupabaseAdminClient();

    // ─────────────────────────────────────
    // 6. Procurar plano Starter
    // ─────────────────────────────────────

    const { data: plano, error: planoError } =
      await adminSupabase
        .from("plans")
        .select("id, name, slug")
        .eq("slug", "starter")
        .eq("is_active", true)
        .single();

    if (planoError || !plano) {
      console.error(
        "Erro ao encontrar plano Starter:",
        planoError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "O plano Starter não está disponível.",
        },
        { status: 500 }
      );
    }

    // ─────────────────────────────────────
    // 7. Criar empresa
    // ─────────────────────────────────────

    const { data: empresa, error: empresaError } =
      await adminSupabase
        .from("companies")
        .insert({
          name: nome,
          description: descricao || null,
        })
        .select("id, name, description")
        .single();

    if (empresaError || !empresa) {
      console.error(
        "Erro ao criar empresa:",
        empresaError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Não foi possível criar a empresa.",
        },
        { status: 500 }
      );
    }

    // ─────────────────────────────────────
    // 8. Criar membro da empresa
    // ─────────────────────────────────────

    const { error: membroError } =
      await adminSupabase
        .from("company_members")
        .insert({
          user_id: user.id,
          company_id: empresa.id,
        });

    if (membroError) {
      console.error(
        "Erro ao criar membro:",
        membroError
      );

      // Limpar empresa criada
      await adminSupabase
        .from("companies")
        .delete()
        .eq("id", empresa.id);

      return NextResponse.json(
        {
          success: false,
          error:
            "Não foi possível associar o utilizador à empresa.",
        },
        { status: 500 }
      );
    }

    // ─────────────────────────────────────
    // 9. Criar configuração da Nexora AI
    // ─────────────────────────────────────

    const { error: aiSettingsError } =
      await adminSupabase
        .from("company_ai_settings")
        .insert({
          company_id: empresa.id,
          ai_name: "Nexora AI",
          configuration_mode: "nexora",
        });

    if (aiSettingsError) {
      console.error(
        "Erro ao criar configuração da IA:",
        aiSettingsError
      );

      // Limpar dados criados
      await adminSupabase
        .from("company_members")
        .delete()
        .eq("company_id", empresa.id);

      await adminSupabase
        .from("companies")
        .delete()
        .eq("id", empresa.id);

      return NextResponse.json(
        {
          success: false,
          error:
            "Não foi possível configurar a Nexora AI.",
        },
        { status: 500 }
      );
    }

    // ─────────────────────────────────────
    // 10. Criar subscrição Starter / Trial
    // ─────────────────────────────────────

    const trialEndsAt = new Date();

    trialEndsAt.setDate(
      trialEndsAt.getDate() + 14
    );

    const { error: subscriptionError } =
      await adminSupabase
        .from("company_subscriptions")
        .insert({
          company_id: empresa.id,
          plan_id: plano.id,
          status: "trial",
          billing_cycle: "monthly",
          current_period_start: new Date().toISOString(),
          current_period_end: trialEndsAt.toISOString(),
          trial_ends_at: trialEndsAt.toISOString(),
          ai_enabled: true,
        });

    if (subscriptionError) {
      console.error(
        "Erro ao criar subscrição:",
        subscriptionError
      );

      // Limpar dados criados
      await adminSupabase
        .from("company_ai_settings")
        .delete()
        .eq("company_id", empresa.id);

      await adminSupabase
        .from("company_members")
        .delete()
        .eq("company_id", empresa.id);

      await adminSupabase
        .from("companies")
        .delete()
        .eq("id", empresa.id);

      return NextResponse.json(
        {
          success: false,
          error:
            "Não foi possível criar a subscrição.",
        },
        { status: 500 }
      );
    }

    // ─────────────────────────────────────
    // 11. Sucesso
    // ─────────────────────────────────────

    return NextResponse.json({
      success: true,
      message: "Empresa configurada com sucesso.",
      company: empresa,
      plan: plano,
    });
  } catch (error) {
    console.error(
      "Erro inesperado no onboarding:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Ocorreu um erro inesperado durante a configuração.",
      },
      { status: 500 }
    );
  }
}