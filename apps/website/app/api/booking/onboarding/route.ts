import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const BOOKING_PRODUCT_ID = "165ea020-af05-447a-a21e-1ef91f88b68e";
const CAMPAIGN_CODE = "BOOKING-AI-2M";

const PLAN_SLUGS = ["starter", "professional", "business"] as const;

type PlanSlug = (typeof PLAN_SLUGS)[number];

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    // ---------------------------------------------------------
    // 1. Utilizador autenticado
    // ---------------------------------------------------------
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Utilizador não autenticado." },
        { status: 401 }
      );
    }

    // ---------------------------------------------------------
    // 2. Dados recebidos
    // ---------------------------------------------------------
    const body = await request.json();

    const empresaId = body?.empresa_id;
    const plano = body?.plano as PlanSlug;

    if (!empresaId || typeof empresaId !== "string") {
      return NextResponse.json(
        { error: "empresa_id é obrigatório." },
        { status: 400 }
      );
    }

    if (!PLAN_SLUGS.includes(plano)) {
      return NextResponse.json(
        { error: "Plano inválido." },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 3. Verificar membro da empresa
    // ---------------------------------------------------------
    const { data: membro, error: membroError } = await supabase
      .from("company_members")
      .select(
        "id, company_id, role, is_active, must_change_password"
      )
      .eq("user_id", user.id)
      .eq("company_id", empresaId)
      .maybeSingle();

    if (membroError) {
      console.error(
        "Erro ao verificar membro da empresa:",
        membroError
      );

      return NextResponse.json(
        { error: "Não foi possível validar o acesso à empresa." },
        { status: 500 }
      );
    }

    if (!membro) {
      return NextResponse.json(
        { error: "Não tem acesso a esta empresa." },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------
    // 4. Conta desativada
    // ---------------------------------------------------------
    if (!membro.is_active) {
      return NextResponse.json(
        { error: "A sua conta está desativada." },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------
    // 5. Password inicial ainda não alterada
    // ---------------------------------------------------------
    if (membro.must_change_password) {
      return NextResponse.json(
        {
          error:
            "É necessário alterar a password antes de continuar.",
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------
    // 6. Apenas o administrador pode configurar o Booking
    // ---------------------------------------------------------
    if (membro.role !== "admin") {
      return NextResponse.json(
        {
          error:
            "Apenas o administrador da empresa pode configurar o Booking.",
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------
    // 7. Procurar plano Booking ativo
    // ---------------------------------------------------------
    const { data: planoDb, error: planoError } = await supabase
      .from("products")
      .select("id, slug, name")
      .eq("id", BOOKING_PRODUCT_ID)
      .eq("is_active", true)
      .maybeSingle();

    if (planoError) {
      console.error("Erro ao procurar produto Booking:", planoError);

      return NextResponse.json(
        { error: "Não foi possível carregar o produto Booking." },
        { status: 500 }
      );
    }

    if (!planoDb) {
      return NextResponse.json(
        { error: "Produto Booking não encontrado ou inativo." },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // 8. Verificar se já existe subscrição
    // ---------------------------------------------------------
    const { data: subscricaoExistente, error: subscricaoError } =
      await supabase
        .from("product_subscriptions")
        .select(
          "id, product_id, company_id, plan_slug, status, trial_ends_at"
        )
        .eq("company_id", empresaId)
        .eq("product_id", BOOKING_PRODUCT_ID)
        .maybeSingle();

    if (subscricaoError) {
      console.error(
        "Erro ao verificar subscrição existente:",
        subscricaoError
      );

      return NextResponse.json(
        { error: "Não foi possível verificar a subscrição." },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // 9. Se já existir subscrição, não duplicar
    // ---------------------------------------------------------
    if (subscricaoExistente) {
      return NextResponse.json({
        success: true,
        subscription: subscricaoExistente,
        plan: planoDb,
        already_exists: true,
      });
    }

    // ---------------------------------------------------------
    // 10. Criar trial de 14 dias
    // ---------------------------------------------------------
    const agora = new Date();

    const trialEndsAt = new Date(agora);
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const { data: novaSubscricao, error: novaSubscricaoError } =
      await supabase
        .from("product_subscriptions")
        .insert({
          company_id: empresaId,
          product_id: BOOKING_PRODUCT_ID,
          plan_slug: plano,
          status: "trialing",
          trial_started_at: agora.toISOString(),
          trial_ends_at: trialEndsAt.toISOString(),
        })
        .select(
          "id, product_id, company_id, plan_slug, status, trial_started_at, trial_ends_at"
        )
        .single();

    if (novaSubscricaoError) {
      console.error(
        "Erro ao criar subscrição:",
        novaSubscricaoError
      );

      return NextResponse.json(
        { error: "Não foi possível criar a subscrição." },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // 11. Criar campanha AI de 2 meses
    // ---------------------------------------------------------
    const campaignEndsAt = new Date(agora);
    campaignEndsAt.setMonth(campaignEndsAt.getMonth() + 2);

    const { error: campaignError } = await supabase
      .from("product_campaigns")
      .insert({
        company_id: empresaId,
        product_id: BOOKING_PRODUCT_ID,
        campaign_code: CAMPAIGN_CODE,
        starts_at: agora.toISOString(),
        ends_at: campaignEndsAt.toISOString(),
        status: "active",
      });

    if (campaignError) {
      console.error(
        "Erro ao criar campanha Booking AI:",
        campaignError
      );

      // Tentativa de rollback da subscrição criada acima.
      await supabase
        .from("product_subscriptions")
        .delete()
        .eq("id", novaSubscricao.id);

      return NextResponse.json(
        {
          error:
            "Não foi possível ativar a campanha do Booking AI.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // 12. Verificar configuração do Booking
    // ---------------------------------------------------------
    const { data: configuracaoExistente, error: configuracaoError } =
      await supabase
        .from("configuracoes_agendamento")
        .select(
          "id, empresa_id, nome_empresa, duracao_padrao, intervalo_minutos, timezone, ativo"
        )
        .eq("empresa_id", empresaId)
        .maybeSingle();

    if (configuracaoError) {
      console.error(
        "Erro ao verificar configuração Booking:",
        configuracaoError
      );

      // Rollback
      await supabase
        .from("product_campaigns")
        .delete()
        .eq("company_id", empresaId)
        .eq("campaign_code", CAMPAIGN_CODE);

      await supabase
        .from("product_subscriptions")
        .delete()
        .eq("id", novaSubscricao.id);

      return NextResponse.json(
        {
          error:
            "Não foi possível verificar a configuração do Booking.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // 13. Criar configuração padrão se ainda não existir
    // ---------------------------------------------------------
    if (!configuracaoExistente) {
      const { data: empresa, error: empresaError } = await supabase
        .from("companies")
        .select("id, name")
        .eq("id", empresaId)
        .single();

      if (empresaError || !empresa) {
        console.error(
          "Erro ao carregar empresa:",
          empresaError
        );

        // Rollback
        await supabase
          .from("product_campaigns")
          .delete()
          .eq("company_id", empresaId)
          .eq("campaign_code", CAMPAIGN_CODE);

        await supabase
          .from("product_subscriptions")
          .delete()
          .eq("id", novaSubscricao.id);

        return NextResponse.json(
          { error: "Empresa não encontrada." },
          { status: 404 }
        );
      }

      const { data: novaConfiguracao, error: novaConfiguracaoError } =
        await supabase
          .from("configuracoes_agendamento")
          .insert({
            empresa_id: empresaId,
            nome_empresa: empresa.name,
            duracao_padrao: 60,
            intervalo_minutos: 0,
            timezone: "Europe/Lisbon",
            ativo: true,
          })
          .select(
            "id, empresa_id, nome_empresa, duracao_padrao, intervalo_minutos, timezone, ativo"
          )
          .single();

      if (novaConfiguracaoError) {
        console.error(
          "Erro ao criar configuração Booking:",
          novaConfiguracaoError
        );

        // Rollback
        await supabase
          .from("product_campaigns")
          .delete()
          .eq("company_id", empresaId)
          .eq("campaign_code", CAMPAIGN_CODE);

        await supabase
          .from("product_subscriptions")
          .delete()
          .eq("id", novaSubscricao.id);

        return NextResponse.json(
          {
            error:
              "Não foi possível criar a configuração inicial do Booking.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        subscription: novaSubscricao,
        plan: planoDb,
        configuration: novaConfiguracao,
        campaign: {
          code: CAMPAIGN_CODE,
          starts_at: agora.toISOString(),
          ends_at: campaignEndsAt.toISOString(),
        },
      });
    }

    // ---------------------------------------------------------
    // 14. Já existia configuração
    // ---------------------------------------------------------
    return NextResponse.json({
      success: true,
      subscription: novaSubscricao,
      plan: planoDb,
      configuration: configuracaoExistente,
      campaign: {
        code: CAMPAIGN_CODE,
        starts_at: agora.toISOString(),
        ends_at: campaignEndsAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Erro inesperado no onboarding Booking:", error);

    return NextResponse.json(
      { error: "Ocorreu um erro inesperado." },
      { status: 500 }
    );
  }
}