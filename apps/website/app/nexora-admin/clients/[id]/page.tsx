import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import AIControl from "@/components/admin/AIControl";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function NexoraAdminClientPage({
  params,
}: Props) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();

  // ─────────────────────────────────────────
  // 1. Autenticação
  // ─────────────────────────────────────────

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/nexora-ai/login");
  }

  // ─────────────────────────────────────────
  // 2. Verificar administrador Nexora
  // ─────────────────────────────────────────

  const { data: admin, error: adminError } = await supabase
    .from("nexora_admins")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || !admin) {
    redirect("/nexora-ai/dashboard");
  }

  // ─────────────────────────────────────────
  // 3. Empresa
  // ─────────────────────────────────────────

  const { data: empresa, error: empresaError } = await supabase
    .from("companies")
    .select("id, name, description, created_at")
    .eq("id", id)
    .maybeSingle();

  if (empresaError) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-bold text-red-400">
            Erro ao carregar empresa
          </h1>

          <pre className="mt-6 rounded-2xl border border-red-500/20 bg-slate-900 p-5 text-sm text-red-300">
            {empresaError.message}
          </pre>
        </div>
      </main>
    );
  }

  if (!empresa) {
    notFound();
  }

  // ─────────────────────────────────────────
  // 4. Subscrição
  // ─────────────────────────────────────────

  const { data: subscricao } = await supabase
    .from("company_subscriptions")
    .select(`
    id,
    status,
    billing_cycle,
    ai_enabled,
    current_period_start,
    current_period_end,
    trial_ends_at,
    cancelled_at,
    plan_id,
    plans (
      id,
      name,
      slug,
      description,
      price_monthly,
      price_yearly,
      currency,
      max_messages,
      max_documents,
      max_storage_mb,
      max_users,
      features
    )
  `)
    .eq("company_id", id)
    .maybeSingle();

  // Campanha Nexora Booking + Nexora AI
  const NEXORA_BOOKING_PRODUCT_ID =
    "165ea020-af05-447a-a21e-1ef91f88b68e";

  const BOOKING_AI_CAMPAIGN_CODE =
    "BOOKING-AI-2M";

  const { data: campanhaBooking } = await supabase
    .from("product_subscriptions")
    .select(`
    id,
    product_id,
    campaign_code,
    status,
    ai_suspended,
    campaign_started_at,
    campaign_ends_at
  `)
    .eq("company_id", id)
    .eq("product_id", NEXORA_BOOKING_PRODUCT_ID)
    .eq("campaign_code", BOOKING_AI_CAMPAIGN_CODE)
    .in("status", ["trial", "active"])
    .maybeSingle();

  const agora = new Date();

  const campanhaAIAtiva =
    Boolean(
      campanhaBooking &&
      campanhaBooking.campaign_started_at &&
      campanhaBooking.campaign_ends_at &&
      new Date(
        campanhaBooking.campaign_started_at
      ) <= agora &&
      new Date(
        campanhaBooking.campaign_ends_at
      ) >= agora
    );

  const aiAtivaPorCampanha =
    campanhaAIAtiva &&
    campanhaBooking?.ai_suspended !== true;

  const aiSuspensaPorCampanha =
    campanhaAIAtiva &&
    campanhaBooking?.ai_suspended === true;

  const aiEnabled =
    subscricao
      ? subscricao.ai_enabled !== false
      : aiAtivaPorCampanha;

  // ─────────────────────────────────────────
  // 5. Configuração da IA
  // ─────────────────────────────────────────

  const { data: aiSettings } = await supabase
    .from("company_ai_settings")
    .select(`
      id,
      ai_name,
      personality,
      tone,
      instructions,
      objectives,
      rules,
      configuration_mode,
      created_at,
      updated_at
    `)
    .eq("company_id", id)
    .maybeSingle();

  // ─────────────────────────────────────────
  // 6. Contagens
  // ─────────────────────────────────────────

  const { count: documentosCount } = await supabase
    .from("company_documents")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("company_id", id);

  const { count: conhecimentoCount } = await supabase
    .from("company_knowledge")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("company_id", id);

  const { count: conversasCount } = await supabase
    .from("conversations")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("company_id", id);

  // ─────────────────────────────────────────
  // 7. Helpers
  // ─────────────────────────────────────────

  function obterStatus(status?: string) {
    switch (status) {
      case "active":
        return {
          label: "Ativa",
          className:
            "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
          icon: "●",
        };

      case "trial":
        return {
          label: "Trial",
          className:
            "border-cyan-400/20 bg-cyan-400/10 text-cyan-400",
          icon: "◐",
        };

      case "past_due":
        return {
          label: "Pagamento em atraso",
          className:
            "border-amber-400/20 bg-amber-400/10 text-amber-400",
          icon: "⚠",
        };

      case "suspended":
        return {
          label: "Suspensa",
          className:
            "border-red-400/20 bg-red-400/10 text-red-400",
          icon: "🔒",
        };

      case "cancelled":
        return {
          label: "Cancelada",
          className:
            "border-slate-700 bg-slate-800 text-slate-400",
          icon: "○",
        };

      default:
        return {
          label: "Sem subscrição",
          className:
            "border-slate-700 bg-slate-800 text-slate-400",
          icon: "—",
        };
    }
  }

  function formatarData(data: string | null | undefined) {
    if (!data) {
      return "—";
    }

    return new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(data));
  }

  const status = obterStatus(subscricao?.status);

  const plano = Array.isArray(subscricao?.plans)
    ? subscricao.plans[0]
    : subscricao?.plans;

  // ─────────────────────────────────────────
  // 8. Interface
  // ─────────────────────────────────────────

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* Header */}

      <header className="border-b border-slate-800 bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
              Nexora Tech
            </p>

            <h1 className="mt-1 text-2xl font-extrabold">
              Nexora Admin
            </h1>
          </div>

          <Link
            href="/nexora-admin/clients"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400"
          >
            ← Clientes
          </Link>

        </div>
      </header>

      {/* Conteúdo */}

      <section className="relative overflow-hidden px-6 py-12">

        <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl">

          {/* Cabeçalho da empresa */}

          <div className="mb-10">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex items-center gap-5">

                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-cyan-400/20 bg-cyan-400/10 text-3xl">
                  🏢
                </div>

                <div>

                  <span className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
                    Cliente
                  </span>

                  <h2 className="mt-2 text-4xl font-extrabold">
                    {empresa.name || "Empresa sem nome"}
                  </h2>

                  <p className="mt-2 text-slate-500">
                    {empresa.description ||
                      "Sem descrição da empresa."}
                  </p>

                </div>

              </div>

              <div
                className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${status.className}`}
              >
                <span>{status.icon}</span>
                {status.label}
              </div>

            </div>

          </div>

          {/* Estatísticas */}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-sm text-slate-500">
                Conversas
              </p>

              <p className="mt-2 text-3xl font-bold">
                {conversasCount ?? 0}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-sm text-slate-500">
                Conhecimento
              </p>

              <p className="mt-2 text-3xl font-bold">
                {conhecimentoCount ?? 0}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-sm text-slate-500">
                Documentos
              </p>

              <p className="mt-2 text-3xl font-bold">
                {documentosCount ?? 0}
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-400/20 bg-slate-900 p-6">
              <p className="text-sm text-slate-500">
                Inteligência Artificial
              </p>

              <p className="mt-2 text-xl font-bold text-cyan-400">
                {aiSettings?.ai_name ||
                  "Não configurada"}
              </p>
            </div>

          </div>

          {/* Subscrição */}

          <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-900">

            <div className="border-b border-slate-800 px-6 py-5">

              <h3 className="text-xl font-bold">
                Subscrição
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Estado comercial e plano atual do cliente.
              </p>

            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-600">
                  Plano
                </p>

                <p className="mt-2 text-lg font-bold">
                  {plano?.name || "Sem plano"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-600">
                  Estado
                </p>

                <div className="mt-2">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}
                  >
                    {status.icon}
                    {status.label}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-600">
                  Ciclo
                </p>

                <p className="mt-2 font-semibold text-slate-300">
                  {subscricao?.billing_cycle === "yearly"
                    ? "Anual"
                    : "Mensal"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-600">
                  Próxima renovação
                </p>

                <p className="mt-2 font-semibold text-slate-300">
                  {formatarData(
                    subscricao?.current_period_end
                  )}
                </p>
              </div>

            </div>

            {plano && (
              <div className="border-t border-slate-800 px-6 py-5">

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                  <div>
                    <p className="text-xs text-slate-600">
                      Mensagens/mês
                    </p>

                    <p className="mt-1 font-semibold">
                      {plano.max_messages === null
                        ? "Ilimitado"
                        : plano.max_messages ?? "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-600">
                      Documentos
                    </p>

                    <p className="mt-1 font-semibold">
                      {plano.max_documents === null
                        ? "Ilimitado"
                        : plano.max_documents ?? "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-600">
                      Armazenamento
                    </p>

                    <p className="mt-1 font-semibold">
                      {plano.max_storage_mb === null
                        ? "Ilimitado"
                        : `${plano.max_storage_mb} MB`}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-600">
                      Utilizadores
                    </p>

                    <p className="mt-1 font-semibold">
                      {plano.max_users === null
                        ? "Ilimitado"
                        : plano.max_users ?? "—"}
                    </p>
                  </div>

                </div>

              </div>
            )}

          </div>

          {/* Controlo da IA */}

          <AIControl
            companyId={empresa.id}
            aiEnabled={aiEnabled}
          />
          {/* Configuração da IA */}

          <div className="mt-10 rounded-3xl border border-cyan-400/20 bg-slate-900">

            <div className="border-b border-slate-800 px-6 py-5">

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>

                  <h3 className="text-xl font-bold">
                    Configuração da Nexora AI
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Configuração atual da inteligência artificial desta empresa.
                  </p>

                </div>

                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-400">
                  {aiSettings?.configuration_mode === "client"
                    ? "Cliente"
                    : "Nexora"}
                </span>

              </div>

            </div>

            {aiSettings ? (

              <div className="grid gap-6 p-6 md:grid-cols-2">

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-600">
                    Nome da IA
                  </p>

                  <p className="mt-2 font-semibold text-cyan-400">
                    {aiSettings.ai_name}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-600">
                    Tom
                  </p>

                  <p className="mt-2 text-slate-300">
                    {aiSettings.tone || "Não definido"}
                  </p>
                </div>

                <div className="md:col-span-2">

                  <p className="text-xs uppercase tracking-wider text-slate-600">
                    Personalidade
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                    {aiSettings.personality ||
                      "Não definida"}
                  </p>

                </div>

                <div className="md:col-span-2">

                  <p className="text-xs uppercase tracking-wider text-slate-600">
                    Objetivos
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                    {aiSettings.objectives ||
                      "Não definidos"}
                  </p>

                </div>

                <div className="md:col-span-2">

                  <p className="text-xs uppercase tracking-wider text-slate-600">
                    Instruções
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                    {aiSettings.instructions ||
                      "Não definidas"}
                  </p>

                </div>

                <div className="md:col-span-2">

                  <p className="text-xs uppercase tracking-wider text-slate-600">
                    Regras
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                    {aiSettings.rules ||
                      "Não definidas"}
                  </p>

                </div>

              </div>

            ) : (

              <div className="px-6 py-12 text-center">

                <div className="text-4xl">
                  🤖
                </div>

                <h4 className="mt-4 font-bold">
                  IA ainda não configurada
                </h4>

                <p className="mt-2 text-sm text-slate-500">
                  Esta empresa ainda não possui uma configuração
                  de inteligência artificial.
                </p>

              </div>

            )}

          </div>

          {/* Informação técnica */}

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">

            <p className="text-xs text-slate-600">
              ID da empresa
            </p>

            <p className="mt-1 break-all font-mono text-xs text-slate-500">
              {empresa.id}
            </p>

          </div>

        </div>

      </section>

    </main>
  );
}