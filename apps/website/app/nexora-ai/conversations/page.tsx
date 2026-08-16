import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default async function ConversationsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/nexora-ai/login");
  }

  const { data: membro } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membro) {
    redirect("/nexora-ai/login");
  }

  const { data: conversas, error } = await supabase
    .from("conversations")
    .select("id, title, created_at, updated_at")
    .eq("company_id", membro.company_id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Erro ao carregar conversas:", error);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section className="px-6 py-12">
        <div className="mx-auto max-w-5xl">

          <div className="mb-10">
            <span className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Nexora AI
            </span>

            <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">
              Conversas
            </h1>

            <p className="mt-3 text-slate-400">
              Consulte e retome as conversas da sua empresa.
            </p>
          </div>

          {(!conversas || conversas.length === 0) ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center">
              <div className="text-5xl">💬</div>

              <h2 className="mt-5 text-2xl font-bold">
                Ainda não existem conversas
              </h2>

              <p className="mt-3 text-slate-400">
                Comece uma conversa com a Nexora AI.
              </p>

              <a
                href="/nexora-ai/chat"
                className="mt-7 inline-block rounded-xl bg-cyan-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-400"
              >
                Abrir Chat
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {conversas.map((conversa) => (
                <a
                  key={conversa.id}
                  href={`/nexora-ai/chat?conversation=${conversa.id}`}
                  className="block rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-400/60 hover:bg-slate-900/80"
                >
                  <div className="flex items-center justify-between gap-6">

                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold">
                        {conversa.title}
                      </h2>

                      <p className="mt-2 text-sm text-slate-500">
                        {new Date(
                          conversa.updated_at
                        ).toLocaleString("pt-PT")}
                      </p>
                    </div>

                    <span className="shrink-0 text-cyan-400">
                      Abrir →
                    </span>

                  </div>
                </a>
              ))}
            </div>
          )}

        </div>
      </section>

      <Footer />
    </main>
  );
}