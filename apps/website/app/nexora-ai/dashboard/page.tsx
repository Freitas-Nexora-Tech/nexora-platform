import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default async function NexoraAIDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/nexora-ai/login");
  }

  // Encontrar a empresa do utilizador
  const { data: membro, error: membroError } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (membroError || !membro) {
    redirect("/nexora-ai/login");
  }

  // Obter dados da empresa
  const { data: empresa, error: empresaError } = await supabase
    .from("companies")
    .select("id, name, description")
    .eq("id", membro.company_id)
    .single();

  if (empresaError || !empresa) {
    redirect("/nexora-ai/login");
  }

  // Contar conhecimento da empresa
  const { count: conhecimentoCount } = await supabase
    .from("company_knowledge")
    .select("id", { count: "exact", head: true })
    .eq("company_id", empresa.id);

    const { count: conversasCount } = await supabase
  .from("conversations")
  .select("id", { count: "exact", head: true })
  .eq("company_id", empresa.id);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section className="px-6 py-12">
        <div className="mx-auto max-w-7xl">

          {/* Cabeçalho */}
          <div className="mb-10">
            <span className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Nexora AI
            </span>

            <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">
              Dashboard
            </h1>

            <p className="mt-3 text-slate-400">
              Bem-vindo à área de gestão da sua empresa.
            </p>
          </div>

          {/* Empresa */}
          <div className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-7">
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

          {/* Estatísticas */}
          <div className="grid gap-5 md:grid-cols-3">

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="text-3xl">🧠</div>

              <p className="mt-5 text-sm text-slate-500">
                Conhecimento
              </p>

              <p className="mt-1 text-3xl font-bold">
                {conhecimentoCount ?? 0}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                registo(s) da empresa
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="text-3xl">🤖</div>

              <p className="mt-5 text-sm text-slate-500">
                Nexora AI
              </p>

              <p className="mt-1 text-3xl font-bold text-emerald-400">
                Online
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Inteligência artificial ativa
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="text-3xl">🔐</div>

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
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="text-3xl">💬</div>

             <p className="mt-5 text-sm text-slate-500">
                 Conversas
             </p>

             <p className="mt-1 text-3xl font-bold">
               {conversasCount ?? 0}
             </p>

             <p className="mt-2 text-sm text-slate-500">
                conversa(s) guardada(s)
             </p>
            </div>

          </div>

          {/* Ações */}
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

            <a
              href="/nexora-ai/chat"
              className="group rounded-3xl border border-slate-800 bg-slate-900 p-7 transition hover:border-cyan-400/60"
            >
              <div className="text-3xl">💬</div>

              <h2 className="mt-4 text-2xl font-bold group-hover:text-cyan-400">
                Falar com a Nexora AI
              </h2>

              <p className="mt-2 text-slate-400">
                Converse com o assistente inteligente da sua empresa.
              </p>

              <span className="mt-5 inline-block font-semibold text-cyan-400">
                Abrir Chat →
              </span>
            </a>

            <a
              href="/nexora-ai/knowledge"
              className="group rounded-3xl border border-slate-800 bg-slate-900 p-7 transition hover:border-cyan-400/60"
            >
              <div className="text-3xl">🧠</div>

              <h2 className="mt-4 text-2xl font-bold group-hover:text-cyan-400">
                Conhecimento da empresa
              </h2>

              <p className="mt-2 text-slate-400">
                Consulte e atualize o conhecimento utilizado pela Nexora AI.
              </p>

              <span className="mt-5 inline-block font-semibold text-cyan-400">
                Gerir conhecimento →
              </span>
            </a>
            
            {/*novo*/}
            <a
               href="/nexora-ai/conversations"
               className="group rounded-3xl border border-slate-800 bg-slate-900 p-7 transition hover:border-cyan-400/60"
            >
            <div className="text-3xl">💬</div>

             <h2 className="mt-4 text-2xl font-bold group-hover:text-cyan-400">
               Histórico de conversas
             </h2>

             <p className="mt-2 text-slate-400">
              Consulte e continue conversas anteriores com a Nexora AI.
             </p>

              <span className="mt-5 inline-block font-semibold text-cyan-400">
              Ver conversas →
             </span>
            </a>

          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}