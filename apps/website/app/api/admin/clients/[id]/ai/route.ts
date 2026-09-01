import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

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

  // Cliente administrativo do servidor.
  // Ignora RLS, mas só é utilizado depois
  // de confirmarmos que o utilizador é Nexora Admin.
  const adminSupabase = createSupabaseAdminClient();

  // Confirmar empresa
  const { data: empresa, error: empresaError } =
    await adminSupabase
      .from("companies")
      .select("id, name")
      .eq("id", id)
      .maybeSingle();

  if (empresaError) {
    return NextResponse.json(
      {
        success: false,
        error: empresaError.message,
      },
      {
        status: 500,
      }
    );
  }

  if (!empresa) {
    return NextResponse.json(
      {
        success: false,
        error: "Empresa não encontrada.",
      },
      {
        status: 404,
      }
    );
  }

  // Procurar subscrição
  const { data: subscricao, error: subscricaoError } =
    await adminSupabase
      .from("company_subscriptions")
      .select("id, company_id, ai_enabled")
      .eq("company_id", id)
      .maybeSingle();

  if (subscricaoError) {
    return NextResponse.json(
      {
        success: false,
        error: subscricaoError.message,
      },
      {
        status: 500,
      }
    );
  }

  if (!subscricao) {
    return NextResponse.json(
      {
        success: false,
        error: "Esta empresa não possui uma subscrição.",
      },
      {
        status: 404,
      }
    );
  }

  // Suspender IA
  const { data: atualizada, error: updateError } =
    await adminSupabase
      .from("company_subscriptions")
      .update({
        ai_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscricao.id)
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
  });
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

  // Confirmar empresa
  const { data: empresa, error: empresaError } =
    await adminSupabase
      .from("companies")
      .select("id, name")
      .eq("id", id)
      .maybeSingle();

  if (empresaError) {
    return NextResponse.json(
      {
        success: false,
        error: empresaError.message,
      },
      {
        status: 500,
      }
    );
  }

  if (!empresa) {
    return NextResponse.json(
      {
        success: false,
        error: "Empresa não encontrada.",
      },
      {
        status: 404,
      }
    );
  }

  // Procurar subscrição
  const { data: subscricao, error: subscricaoError } =
    await adminSupabase
      .from("company_subscriptions")
      .select("id, company_id, ai_enabled")
      .eq("company_id", id)
      .maybeSingle();

  if (subscricaoError) {
    return NextResponse.json(
      {
        success: false,
        error: subscricaoError.message,
      },
      {
        status: 500,
      }
    );
  }

  if (!subscricao) {
    return NextResponse.json(
      {
        success: false,
        error: "Esta empresa não possui uma subscrição.",
      },
      {
        status: 404,
      }
    );
  }

  // Reativar IA
  const { data: atualizada, error: updateError } =
    await adminSupabase
      .from("company_subscriptions")
      .update({
        ai_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscricao.id)
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
  });
}