import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function NexoraAdminPage() {
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
  // 2. Verificar se é administrador Nexora
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
  // 3. Estatísticas da plataforma
  // ─────────────────────────────────────────

  const { count: empresasCount } = await supabase
    .from("companies")
    .select("id", {
      count: "exact",
      head: true,
    });

  const { count: subscricoesCount } = await supabase
    .from("company_subscriptions")
    .select("id", {
      count: "exact",
      head: true,
    });

  const { count: subscricoesAtivasCount } = await supabase
    .from("company_subscriptions")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("status", "active");

  const { count: pagamentosAtrasadosCount } = await supabase
    .from("company_subscriptions")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("status", "past_due");

  const { count: subscricoesSuspensasCount } = await supabase
    .from("company_subscriptions")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("status", "suspended");

  const { count: configuracoesAICount } = await supabase
    .from("company_ai_settings")
    .select("id", {
      count: "exact",
      head: true,
    });

  // ─────────────────────────────────────────
  // 4. Interface
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

          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/5 px-4 py-2">
            <span className="text-sm font-semibold text-emerald-400">
              ● Administrador
            </span>
          </div>
        </div>
      </header>

      {/* Conteúdo */}

      <section className="relative overflow-hidden px-6 py-12">
        {/* Glow */}

        <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl">

          {/* Cabeçalho */}

          <div className="mb-10">
            <span className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Administração
            </span>

            <h2 className="mt-3 text-4xl font-extrabold md:text-5xl">
              Dashboard
            </h2>

            <p className="mt-3 max-w-2xl text-slate-400">
              Gestão central da plataforma Nexora,
              empresas, subscrições e inteligência artificial.
            </p>
          </div>

          {/* Estatísticas */}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

            {/* Empresas */}

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-400/40">
              <div className="text-3xl">
                🏢
              </div>

              <p className="mt-5 text-sm text-slate-500">
                Empresas
              </p>

              <p className="mt-1 text-3xl font-bold">
                {empresasCount ?? 0}
              </p>

              <p className="mt-2 text-xs text-slate-600">
                clientes registados
              </p>
            </div>

            {/* Subscrições */}

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-400/40">
              <div className="text-3xl">
                💳
              </div>

              <p className="mt-5 text-sm text-slate-500">
                Subscrições
              </p>

              <p className="mt-1 text-3xl font-bold">
                {subscricoesCount ?? 0}
              </p>

              <p className="mt-2 text-xs text-slate-600">
                subscrições registadas
              </p>
            </div>

            {/* IA Ativas */}

            <div className="rounded-2xl border border-emerald-400/20 bg-slate-900 p-6 transition hover:border-emerald-400/40">
              <div className="text-3xl">
                🤖
              </div>

              <p className="mt-5 text-sm text-slate-500">
                IA Ativas
              </p>

              <p className="mt-1 text-3xl font-bold text-emerald-400">
                {subscricoesAtivasCount ?? 0}
              </p>

              <p className="mt-2 text-xs text-slate-600">
                clientes ativos
              </p>
            </div>

            {/* Pagamentos atrasados */}

            <div className="rounded-2xl border border-amber-400/20 bg-slate-900 p-6 transition hover:border-amber-400/40">
              <div className="text-3xl">
                ⚠️
              </div>

              <p className="mt-5 text-sm text-slate-500">
                Pagamentos
              </p>

              <p className="mt-1 text-3xl font-bold text-amber-400">
                {pagamentosAtrasadosCount ?? 0}
              </p>

              <p className="mt-2 text-xs text-slate-600">
                em atraso
              </p>
            </div>

            {/* Suspensas */}

            <div className="rounded-2xl border border-red-400/20 bg-slate-900 p-6 transition hover:border-red-400/40">
              <div className="text-3xl">
                🔒
              </div>

              <p className="mt-5 text-sm text-slate-500">
                Suspensas
              </p>

              <p className="mt-1 text-3xl font-bold text-red-400">
                {subscricoesSuspensasCount ?? 0}
              </p>

              <p className="mt-2 text-xs text-slate-600">
                IA bloqueadas
              </p>
            </div>

            {/* Configurações IA */}

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-400/40">
              <div className="text-3xl">
                ⚙️
              </div>

              <p className="mt-5 text-sm text-slate-500">
                IA configuradas
              </p>

              <p className="mt-1 text-3xl font-bold">
                {configuracoesAICount ?? 0}
              </p>

              <p className="mt-2 text-xs text-slate-600">
                configurações existentes
              </p>
            </div>

          </div>

          {/* Gestão */}

          <div className="mt-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">
                Gestão da plataforma
              </h2>

              <p className="mt-2 text-slate-500">
                Aceda às principais áreas administrativas da Nexora.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

              {/* Clientes */}

              <a
                href="/nexora-admin/clients"
                className="group rounded-3xl border border-slate-800 bg-slate-900 p-7 transition hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-xl hover:shadow-cyan-500/5"
              >
                <div className="text-3xl">
                  🏢
                </div>

                <h3 className="mt-4 text-xl font-bold group-hover:text-cyan-400">
                  Clientes
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Gerir empresas, clientes e acessos à plataforma.
                </p>

                <span className="mt-5 inline-block font-semibold text-cyan-400">
                  Gerir clientes →
                </span>
              </a>

              {/* Subscrições */}

              <a
                href="/nexora-admin/subscriptions"
                className="group rounded-3xl border border-slate-800 bg-slate-900 p-7 transition hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-xl hover:shadow-cyan-500/5"
              >
                <div className="text-3xl">
                  💳
                </div>

                <h3 className="mt-4 text-xl font-bold group-hover:text-cyan-400">
                  Subscrições
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Controlar planos, estados e pagamentos dos clientes.
                </p>

                <span className="mt-5 inline-block font-semibold text-cyan-400">
                  Gerir subscrições →
                </span>
              </a>

              {/* Planos */}

              <a
                href="/nexora-admin/plans"
                className="group rounded-3xl border border-slate-800 bg-slate-900 p-7 transition hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-xl hover:shadow-cyan-500/5"
              >
                <div className="text-3xl">
                  📦
                </div>

                <h3 className="mt-4 text-xl font-bold group-hover:text-cyan-400">
                  Planos
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Gerir preços, limites e funcionalidades dos planos.
                </p>

                <span className="mt-5 inline-block font-semibold text-cyan-400">
                  Gerir planos →
                </span>
              </a>

              {/* IA */}

              <a
                href="/nexora-admin/ai"
                className="group rounded-3xl border border-slate-800 bg-slate-900 p-7 transition hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-xl hover:shadow-cyan-500/5"
              >
                <div className="text-3xl">
                  🤖
                </div>

                <h3 className="mt-4 text-xl font-bold group-hover:text-cyan-400">
                  Nexora AI
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Acompanhar e gerir as inteligências artificiais dos clientes.
                </p>

                <span className="mt-5 inline-block font-semibold text-cyan-400">
                  Gerir IA →
                </span>
              </a>

            </div>
          </div>

          {/* Estado da plataforma */}

          <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/60 p-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                  Estado da plataforma
                </p>

                <h2 className="mt-2 text-xl font-bold">
                  Nexora Platform operacional
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  O núcleo administrativo da Nexora está ligado ao
                  sistema de autenticação e à base de dados da plataforma.
                </p>
              </div>

              <div className="shrink-0 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-5 py-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Sistema
                </p>

                <p className="mt-1 font-bold text-emerald-400">
                  ● Online
                </p>
              </div>

            </div>
          </div>

          {/* Conta */}

          <div className="mt-6 text-sm text-slate-600">
            Administrador autenticado:{" "}
            <span className="text-slate-400">
              {user.email}
            </span>
          </div>

        </div>
      </section>
    </main>
  );
}