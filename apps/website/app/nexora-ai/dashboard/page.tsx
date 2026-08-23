import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default async function NexoraAIDashboardPage() {
  const supabase =
    await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/nexora-ai/login");
  }

  // Empresa associada ao utilizador
  const {
    data: membro,
    error: membroError,
  } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (membroError || !membro) {
    redirect("/nexora-ai/login");
  }

  // Dados da empresa
  const {
    data: empresa,
    error: empresaError,
  } = await supabase
    .from("companies")
    .select("id, name, description")
    .eq("id", membro.company_id)
    .single();

  if (empresaError || !empresa) {
    redirect("/nexora-ai/login");
  }

  // Contagem do conhecimento
  const {
    count: conhecimentoCount,
  } = await supabase
    .from("company_knowledge")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq(
      "company_id",
      empresa.id
    );

  // Contagem das conversas
  const {
    count: conversasCount,
  } = await supabase
    .from("conversations")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq(
      "company_id",
      empresa.id
    );

  // Contagem dos documentos
  const {
    count: documentosCount,
  } = await supabase
    .from("company_documents")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq(
      "company_id",
      empresa.id
    );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-12">
        {/* Glow */}

        <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl">

          {/* Cabeçalho */}

          <div className="mb-10">
            <span className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Nexora AI
            </span>

            <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">
              Dashboard
            </h1>

            <p className="mt-3 max-w-2xl text-slate-400">
              Bem-vindo à área de gestão da
              sua empresa.
            </p>
          </div>

          {/* Empresa */}

          <div className="mb-8 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-xl">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                  Empresa
                </p>

                <h2 className="mt-2 text-3xl font-bold">
                  {empresa.name}
                </h2>

                {empresa.description && (
                  <p className="mt-3 max-w-3xl leading-7 text-slate-400">
                    {empresa.description}
                  </p>
                )}
              </div>

              <div className="shrink-0 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-5 py-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Estado da plataforma
                </p>

                <p className="mt-1 font-bold text-emerald-400">
                  ● Nexora AI Online
                </p>
              </div>

            </div>
          </div>

          {/* Estatísticas */}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">

            {/* Conhecimento */}

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-400/40">
              <div className="flex items-center justify-between">
                <div className="text-3xl">
                  🧠
                </div>

                <span className="text-xs text-slate-600">
                  Empresa
                </span>
              </div>

              <p className="mt-5 text-sm text-slate-500">
                Conhecimento
              </p>

              <p className="mt-1 text-3xl font-bold">
                {conhecimentoCount ?? 0}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                registo(s)
              </p>
            </div>

            {/* Nexora AI */}

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-emerald-400/40">
              <div className="flex items-center justify-between">
                <div className="text-3xl">
                  🤖
                </div>

                <span className="text-xs text-slate-600">
                  Sistema
                </span>
              </div>

              <p className="mt-5 text-sm text-slate-500">
                Nexora AI
              </p>

              <p className="mt-1 text-3xl font-bold text-emerald-400">
                Online
              </p>

              <p className="mt-2 text-sm text-slate-500">
                IA ativa
              </p>
            </div>

            {/* Conta */}

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-400/40">
              <div className="flex items-center justify-between">
                <div className="text-3xl">
                  🔐
                </div>

                <span className="text-xs text-slate-600">
                  Conta
                </span>
              </div>

              <p className="mt-5 text-sm text-slate-500">
                Conta
              </p>

              <p className="mt-1 text-3xl font-bold text-cyan-400">
                Ativa
              </p>

              <p className="mt-2 truncate text-sm text-slate-500">
                {user.email}
              </p>
            </div>

            {/* Conversas */}

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-400/40">
              <div className="flex items-center justify-between">
                <div className="text-3xl">
                  💬
                </div>

                <span className="text-xs text-slate-600">
                  IA
                </span>
              </div>

              <p className="mt-5 text-sm text-slate-500">
                Conversas
              </p>

              <p className="mt-1 text-3xl font-bold">
                {conversasCount ?? 0}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                conversa(s)
              </p>
            </div>

            {/* Documentos */}

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-400/40">
              <div className="flex items-center justify-between">
                <div className="text-3xl">
                  📄
                </div>

                <span className="text-xs text-slate-600">
                  Base
                </span>
              </div>

              <p className="mt-5 text-sm text-slate-500">
                Documentos
              </p>

              <p className="mt-1 text-3xl font-bold">
                {documentosCount ?? 0}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                documento(s)
              </p>
            </div>

          </div>

          {/* Ações */}

          <div className="mt-10">

            <div className="mb-6">
              <h2 className="text-2xl font-bold">
                Gestão da Nexora AI
              </h2>

              <p className="mt-2 text-slate-500">
                Aceda rapidamente às principais
                ferramentas da sua empresa.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

              {/* Chat */}

              <a
                href="/nexora-ai/chat"
                className="group rounded-3xl border border-slate-800 bg-slate-900 p-7 transition hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-xl hover:shadow-cyan-500/5"
              >
                <div className="text-3xl">
                  💬
                </div>

                <h2 className="mt-4 text-xl font-bold group-hover:text-cyan-400">
                  Falar com a Nexora AI
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Converse com o assistente
                  inteligente da sua empresa.
                </p>

                <span className="mt-5 inline-block font-semibold text-cyan-400">
                  Abrir Chat →
                </span>
              </a>

              {/* Conhecimento */}

              <a
                href="/nexora-ai/knowledge"
                className="group rounded-3xl border border-slate-800 bg-slate-900 p-7 transition hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-xl hover:shadow-cyan-500/5"
              >
                <div className="text-3xl">
                  🧠
                </div>

                <h2 className="mt-4 text-xl font-bold group-hover:text-cyan-400">
                  Conhecimento da empresa
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Gerir as informações que a
                  Nexora AI utiliza.
                </p>

                <span className="mt-5 inline-block font-semibold text-cyan-400">
                  Gerir conhecimento →
                </span>
              </a>

              {/* Documentos */}

              <a
                href="/nexora-ai/documents"
                className="group rounded-3xl border border-slate-800 bg-slate-900 p-7 transition hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-xl hover:shadow-cyan-500/5"
              >
                <div className="text-3xl">
                  📄
                </div>

                <h2 className="mt-4 text-xl font-bold group-hover:text-cyan-400">
                  Documentos
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Carregar, processar e gerir
                  os documentos da empresa.
                </p>

                <span className="mt-5 inline-block font-semibold text-cyan-400">
                  Gerir documentos →
                </span>
              </a>

              {/* Conversas */}

              <a
                href="/nexora-ai/conversations"
                className="group rounded-3xl border border-slate-800 bg-slate-900 p-7 transition hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-xl hover:shadow-cyan-500/5"
              >
                <div className="text-3xl">
                  💬
                </div>

                <h2 className="mt-4 text-xl font-bold group-hover:text-cyan-400">
                  Histórico de conversas
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Consulte e continue conversas
                  anteriores com a Nexora AI.
                </p>

                <span className="mt-5 inline-block font-semibold text-cyan-400">
                  Ver conversas →
                </span>
              </a>

            </div>
          </div>

          {/* Estado atual */}

          <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/60 p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                  Plataforma
                </p>

                <h2 className="mt-2 text-xl font-bold">
                  A sua Nexora AI está pronta.
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  O sistema já permite gerir
                  conhecimento, documentos,
                  conversas e utilizar ferramentas
                  inteligentes através da Nexora AI.
                </p>
              </div>

              <a
                href="/nexora-ai/chat"
                className="shrink-0 rounded-xl bg-cyan-500 px-6 py-3 text-center font-bold text-slate-950 transition hover:bg-cyan-400"
              >
                Começar conversa
              </a>

            </div>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}