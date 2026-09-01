import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type Cliente = {
  id: string;
  name: string | null;
  description: string | null;
  created_at: string;
};

type Subscricao = {
  company_id: string;
  status: string;
  billing_cycle: string;
  current_period_end: string | null;
  plan_id: string;
  plans:
    | {
        name: string;
        slug: string;
      }
    | {
        name: string;
        slug: string;
      }[]
    | null;
};

export default async function NexoraAdminClientsPage() {
  const supabase = await createSupabaseServerClient();

  // ─────────────────────────────────────────
  // 1. Verificar autenticação
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
  // 3. Buscar empresas
  // ─────────────────────────────────────────

  const { data: empresas, error: empresasError } = await supabase
    .from("companies")
    .select("id, name, description, created_at")
    .order("created_at", {
      ascending: false,
    });

  if (empresasError) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-red-400">
            Erro ao carregar clientes
          </h1>

          <p className="mt-4 text-slate-400">
            Não foi possível carregar as empresas da plataforma.
          </p>

          <pre className="mt-6 overflow-auto rounded-2xl border border-red-500/20 bg-slate-900 p-5 text-sm text-red-300">
            {empresasError.message}
          </pre>
        </div>
      </main>
    );
  }

  const clientes = (empresas ?? []) as Cliente[];

  // ─────────────────────────────────────────
  // 4. Buscar subscrições
  // ─────────────────────────────────────────

  const { data: subscricoes } = await supabase
    .from("company_subscriptions")
    .select(`
      company_id,
      status,
      billing_cycle,
      current_period_end,
      plan_id,
      plans (
        name,
        slug
      )
    `);

  const listaSubscricoes = (subscricoes ?? []) as unknown as Subscricao[];

  // ─────────────────────────────────────────
  // 5. Buscar configurações de IA
  // ─────────────────────────────────────────

  const { data: configuracoesAI } = await supabase
    .from("company_ai_settings")
    .select("company_id, ai_name");

  const mapaAI = new Map(
    (configuracoesAI ?? []).map((item) => [
      item.company_id,
      item.ai_name,
    ])
  );

  // ─────────────────────────────────────────
  // 6. Criar mapa das subscrições
  // ─────────────────────────────────────────

  const mapaSubscricoes = new Map(
    listaSubscricoes.map((subscricao) => [
      subscricao.company_id,
      subscricao,
    ])
  );

  // ─────────────────────────────────────────
  // 7. Funções auxiliares
  // ─────────────────────────────────────────

  function obterPlano(subscricao: Subscricao | undefined) {
    if (!subscricao?.plans) {
      return "Sem plano";
    }

    if (Array.isArray(subscricao.plans)) {
      return subscricao.plans[0]?.name ?? "Sem plano";
    }

    return subscricao.plans.name;
  }

  function obterStatus(status: string | undefined) {
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

  function formatarData(data: string | null) {
    if (!data) {
      return "—";
    }

    return new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(data));
  }

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
            href="/nexora-admin"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400"
          >
            ← Dashboard
          </Link>

        </div>
      </header>

      {/* Conteúdo */}

      <section className="relative overflow-hidden px-6 py-12">

        <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl">

          {/* Título */}

          <div className="mb-10">

            <span className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Administração
            </span>

            <h2 className="mt-3 text-4xl font-extrabold">
              Clientes
            </h2>

            <p className="mt-3 max-w-2xl text-slate-400">
              Consulte e acompanhe todas as empresas que utilizam
              a plataforma Nexora.
            </p>

          </div>

          {/* Resumo */}

          <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-sm text-slate-500">
                Total de clientes
              </p>

              <p className="mt-2 text-3xl font-bold">
                {clientes.length}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-400/20 bg-slate-900 p-6">
              <p className="text-sm text-slate-500">
                IA ativas
              </p>

              <p className="mt-2 text-3xl font-bold text-emerald-400">
                {
                  listaSubscricoes.filter(
                    (item) => item.status === "active"
                  ).length
                }
              </p>
            </div>

            <div className="rounded-2xl border border-amber-400/20 bg-slate-900 p-6">
              <p className="text-sm text-slate-500">
                Pagamentos em atraso
              </p>

              <p className="mt-2 text-3xl font-bold text-amber-400">
                {
                  listaSubscricoes.filter(
                    (item) => item.status === "past_due"
                  ).length
                }
              </p>
            </div>

            <div className="rounded-2xl border border-red-400/20 bg-slate-900 p-6">
              <p className="text-sm text-slate-500">
                Suspensas
              </p>

              <p className="mt-2 text-3xl font-bold text-red-400">
                {
                  listaSubscricoes.filter(
                    (item) => item.status === "suspended"
                  ).length
                }
              </p>
            </div>

          </div>

          {/* Lista */}

          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">

            <div className="border-b border-slate-800 px-6 py-5">

              <h3 className="text-xl font-bold">
                Empresas
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Lista de clientes da Nexora Platform.
              </p>

            </div>

            {clientes.length === 0 ? (

              <div className="px-6 py-16 text-center">

                <div className="text-5xl">
                  🏢
                </div>

                <h3 className="mt-5 text-xl font-bold">
                  Ainda não existem clientes
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Quando uma empresa for criada na plataforma,
                  aparecerá aqui.
                </p>

              </div>

            ) : (

              <div className="divide-y divide-slate-800">

                {clientes.map((cliente) => {

                  const subscricao =
                    mapaSubscricoes.get(cliente.id);

                  const status = obterStatus(
                    subscricao?.status
                  );

                  const plano =
                    obterPlano(subscricao);

                  const aiName =
                    mapaAI.get(cliente.id);

                  return (
                    <div
                      key={cliente.id}
                      className="p-6 transition hover:bg-slate-800/40"
                    >

                      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                        {/* Empresa */}

                        <div className="min-w-0">

                          <div className="flex items-center gap-4">

                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-xl">
                              🏢
                            </div>

                            <div className="min-w-0">

                              <h4 className="truncate text-lg font-bold">
                                {cliente.name ||
                                  "Empresa sem nome"}
                              </h4>

                              <p className="mt-1 truncate text-sm text-slate-500">
                                {cliente.description ||
                                  "Sem descrição"}
                              </p>

                            </div>

                          </div>

                        </div>

                        {/* Plano */}

                        <div className="lg:min-w-36">

                          <p className="text-xs uppercase tracking-wider text-slate-600">
                            Plano
                          </p>

                          <p className="mt-1 font-semibold text-slate-300">
                            {plano}
                          </p>

                        </div>

                        {/* IA */}

                        <div className="lg:min-w-36">

                          <p className="text-xs uppercase tracking-wider text-slate-600">
                            IA
                          </p>

                          <p className="mt-1 font-semibold text-cyan-400">
                            {aiName || "Não configurada"}
                          </p>

                        </div>

                        {/* Estado */}

                        <div className="lg:min-w-44">

                          <p className="text-xs uppercase tracking-wider text-slate-600">
                            Estado
                          </p>

                          <span
                            className={`mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}
                          >
                            <span>
                              {status.icon}
                            </span>

                            {status.label}
                          </span>

                        </div>

                        {/* Renovação */}

                        <div className="lg:min-w-32">

                          <p className="text-xs uppercase tracking-wider text-slate-600">
                            Renovação
                          </p>

                          <p className="mt-1 text-sm text-slate-400">
                            {formatarData(
                              subscricao?.current_period_end ??
                                null
                            )}
                          </p>

                        </div>

                        {/* Ação */}

                        <div className="shrink-0">

                          <Link
                            href={`/nexora-admin/clients/${cliente.id}`}
                            className="inline-flex rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
                          >
                            Ver cliente →
                          </Link>

                        </div>

                      </div>

                    </div>
                  );
                })}

              </div>

            )}

          </div>

        </div>

      </section>
    </main>
  );
}