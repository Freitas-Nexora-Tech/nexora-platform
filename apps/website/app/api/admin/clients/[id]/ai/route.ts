import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase-server";

import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const BOOKING_PRODUCT_ID =
  "165ea020-af05-447a-a21e-1ef91f88b68e";

const BOOKING_AI_CAMPAIGN_CODE =
  "BOOKING-AI-2M";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function verificarAdministrador() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      autorizado: false,
      supabase,
      user: null,
      status: 401,
      mensagem: "Não autenticado.",
    };
  }

  const { data: admin, error: adminError } = await supabase
    .from("nexora_admins")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || !admin) {
    return {
      autorizado: false,
      supabase,
      user,
      status: 403,
      mensagem: "Acesso administrativo não autorizado.",
    };
  }

  return {
    autorizado: true,
    supabase,
    user,
    status: 200,
    mensagem: "",
  };
}

async function obterEmpresaESubscricoes(
  adminSupabase: ReturnType<typeof createSupabaseAdminClient>,
  companyId: string
) {
  const { data: empresa, error: empresaError } =
    await adminSupabase
      .from("companies")
      .select("id, name")
      .eq("id", companyId)
      .maybeSingle();

  if (empresaError) {
    return {
      empresa: null,
      subscricaoAI: null,
      campanhaBooking: null,
      error: empresaError.message,
      status: 500,
    };
  }

  if (!empresa) {
    return {
      empresa: null,
      subscricaoAI: null,
      campanhaBooking: null,
      error: "Empresa não encontrada.",
      status: 404,
    };
  }

  const {
    data: subscricaoAI,
    error: subscricaoAIError,
  } = await adminSupabase
    .from("company_subscriptions")
    .select("id, company_id, ai_enabled")
    .eq("company_id", companyId)
    .maybeSingle();

  if (subscricaoAIError) {
    return {
      empresa,
      subscricaoAI: null,
      campanhaBooking: null,
      error: subscricaoAIError.message,
      status: 500,
    };
  }

  const {
    data: campanhaBooking,
    error: campanhaError,
  } = await adminSupabase
    .from("product_subscriptions")
    .select(
      "id, company_id, product_id, status, campaign_code, campaign_started_at, campaign_ends_at, ai_suspended"
    )
    .eq("company_id", companyId)
    .eq("product_id", BOOKING_PRODUCT_ID)
    .eq("campaign_code", BOOKING_AI_CAMPAIGN_CODE)
    .in("status", ["trial", "active"])
    .maybeSingle();

  if (campanhaError) {
    return {
      empresa,
      subscricaoAI,
      campanhaBooking: null,
      error: campanhaError.message,
      status: 500,
    };
  }

  return {
    empresa,
    subscricaoAI,
    campanhaBooking,
    error: null,
    status: 200,
  };
}

// ─────────────────────────────────────────
// SUSPENDER IA
// DELETE /api/admin/clients/[id]/ai
// ─────────────────────────────────────────

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  const verificacao = await verificarAdministrador();

  if (!verificacao.autorizado) {
    return NextResponse.json(
      {
        success: false,
        error: verificacao.mensagem,
      },
      {
        status: verificacao.status,
      }
    );
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        error: "ID da empresa não fornecido.",
      },
      {
        status: 400,
      }
    );
  }

  const adminSupabase = createSupabaseAdminClient();

  const resultado = await obterEmpresaESubscricoes(
    adminSupabase,
    id
  );

  if (resultado.error) {
    return NextResponse.json(
      {
        success: false,
        error: resultado.error,
      },
      {
        status: resultado.status,
      }
    );
  }

  // ─────────────────────────────────────────
  // Subscrição Nexora AI tradicional
  // ─────────────────────────────────────────

  if (resultado.subscricaoAI) {
    const {
      data: atualizada,
      error: updateError,
    } = await adminSupabase
      .from("company_subscriptions")
      .update({
        ai_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", resultado.subscricaoAI.id)
      .select("id, company_id, ai_enabled")
      .single();

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: updateError.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Nexora AI suspensa com sucesso.",
      subscription: atualizada,
      access_type: "ai_subscription",
    });
  }

  // ─────────────────────────────────────────
  // Campanha Booking + Nexora AI
  // ─────────────────────────────────────────

  if (resultado.campanhaBooking) {
    const agora = new Date();

    const campanhaAtiva =
      resultado.campanhaBooking.campaign_started_at &&
      resultado.campanhaBooking.campaign_ends_at &&
      new Date(
        resultado.campanhaBooking.campaign_started_at
      ) <= agora &&
      new Date(
        resultado.campanhaBooking.campaign_ends_at
      ) >= agora;

    if (!campanhaAtiva) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A campanha Nexora AI desta empresa não está atualmente ativa.",
        },
        {
          status: 409,
        }
      );
    }

    const {
      data: atualizada,
      error: updateError,
    } = await adminSupabase
      .from("product_subscriptions")
      .update({
        ai_suspended: true,
        updated_at: new Date().toISOString(),
      })
      .eq(
        "id",
        resultado.campanhaBooking.id
      )
      .select(
        "id, company_id, campaign_code, ai_suspended"
      )
      .single();

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: updateError.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Nexora AI suspensa com sucesso.",
      subscription: atualizada,
      access_type: "booking_campaign",
    });
  }

  return NextResponse.json(
    {
      success: false,
      error:
        "Esta empresa não possui uma subscrição Nexora AI nem um benefício Booking + AI ativo.",
    },
    {
      status: 404,
    }
  );
}

// ─────────────────────────────────────────
// REATIVAR IA
// POST /api/admin/clients/[id]/ai
// ─────────────────────────────────────────

export async function POST(
  request: Request,
  context: RouteContext
) {
  const verificacao = await verificarAdministrador();

  if (!verificacao.autorizado) {
    return NextResponse.json(
      {
        success: false,
        error: verificacao.mensagem,
      },
      {
        status: verificacao.status,
      }
    );
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        error: "ID da empresa não fornecido.",
      },
      {
        status: 400,
      }
    );
  }

  const adminSupabase = createSupabaseAdminClient();

  const resultado = await obterEmpresaESubscricoes(
    adminSupabase,
    id
  );

  if (resultado.error) {
    return NextResponse.json(
      {
        success: false,
        error: resultado.error,
      },
      {
        status: resultado.status,
      }
    );
  }

  // ─────────────────────────────────────────
  // Subscrição Nexora AI tradicional
  // ─────────────────────────────────────────

  if (resultado.subscricaoAI) {
    const {
      data: atualizada,
      error: updateError,
    } = await adminSupabase
      .from("company_subscriptions")
      .update({
        ai_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", resultado.subscricaoAI.id)
      .select("id, company_id, ai_enabled")
      .single();

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: updateError.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Nexora AI reativada com sucesso.",
      subscription: atualizada,
      access_type: "ai_subscription",
    });
  }

  // ─────────────────────────────────────────
  // Campanha Booking + Nexora AI
  // ─────────────────────────────────────────

  if (resultado.campanhaBooking) {
    const agora = new Date();

    const campanhaAtiva =
      resultado.campanhaBooking.campaign_started_at &&
      resultado.campanhaBooking.campaign_ends_at &&
      new Date(
        resultado.campanhaBooking.campaign_started_at
      ) <= agora &&
      new Date(
        resultado.campanhaBooking.campaign_ends_at
      ) >= agora;

    if (!campanhaAtiva) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A campanha Nexora AI desta empresa não está atualmente ativa.",
        },
        {
          status: 409,
        }
      );
    }

    const {
      data: atualizada,
      error: updateError,
    } = await adminSupabase
      .from("product_subscriptions")
      .update({
        ai_suspended: false,
        updated_at: new Date().toISOString(),
      })
      .eq(
        "id",
        resultado.campanhaBooking.id
      )
      .select(
        "id, company_id, campaign_code, ai_suspended"
      )
      .single();

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: updateError.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Nexora AI reativada com sucesso.",
      subscription: atualizada,
      access_type: "booking_campaign",
    });
  }

  return NextResponse.json(
    {
      success: false,
      error:
        "Esta empresa não possui uma subscrição Nexora AI nem um benefício Booking + AI ativo.",
    },
    {
      status: 404,
    }
  );
}