import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NexoraAIPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      {/* HERO NEXORA AI */}
      <section
        className="relative min-h-[85vh] flex items-center overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/nexora-ai-bg.png')",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-slate-950/65" />

        {/* Conteúdo */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24">
          <div className="max-w-3xl">

            <span className="inline-block rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-semibold tracking-wide text-cyan-300">
              INTELIGÊNCIA ARTIFICIAL • AUTOMAÇÃO • INOVAÇÃO
            </span>

            <h1 className="mt-6 text-5xl font-bold leading-tight md:text-7xl">
              Nexora
              <span className="text-cyan-400"> AI</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 md:text-xl">
              Inteligência Artificial para transformar a forma como a sua
              empresa trabalha, comunica e cresce.
            </p>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Criamos soluções inteligentes, automações e sistemas preparados
              para tornar os processos empresariais mais rápidos, eficientes e
              escaláveis.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">

            <a
               href="/nexora-ai/chat"
              className="rounded-xl bg-cyan-400 px-7 py-4 font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                Falar com a Nexora
            </a>

              <a
                href="#solucoes"
                className="rounded-xl border border-cyan-400/60 px-7 py-4 font-bold text-white transition hover:bg-cyan-400/10"
              >
                Conhecer soluções
              </a>

            </div>
          </div>
        </div>
      </section>

      {/* SOLUÇÕES */}
      <section
        id="solucoes"
        className="bg-slate-950 px-6 py-24"
      >
        <div className="mx-auto max-w-7xl">

          <div className="max-w-3xl">

            <span className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
              O que fazemos
            </span>

            <h2 className="mt-3 text-4xl font-bold md:text-5xl">
              Inteligência que trabalha para o seu negócio.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-400">
              Desenvolvemos soluções de IA pensadas para problemas reais das
              empresas.
            </p>

          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-7 transition hover:border-cyan-400/60">
              <div className="text-3xl">🧠</div>

              <h3 className="mt-5 text-xl font-bold">
                Inteligência Artificial
              </h3>

              <p className="mt-3 text-slate-400">
                Soluções de IA adaptadas às necessidades da sua empresa.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-7 transition hover:border-cyan-400/60">
              <div className="text-3xl">⚙️</div>

              <h3 className="mt-5 text-xl font-bold">
                Automação
              </h3>

              <p className="mt-3 text-slate-400">
                Automatize tarefas repetitivas e liberte tempo para o que
                realmente importa.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-7 transition hover:border-cyan-400/60">
              <div className="text-3xl">💬</div>

              <h3 className="mt-5 text-xl font-bold">
                Assistentes IA
              </h3>

              <p className="mt-3 text-slate-400">
                Assistentes inteligentes para atendimento, suporte e
                produtividade.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-7 transition hover:border-cyan-400/60">
              <div className="text-3xl">📊</div>

              <h3 className="mt-5 text-xl font-bold">
                Dados e Análise
              </h3>

              <p className="mt-3 text-slate-400">
                Transforme dados em informação útil para melhores decisões.
              </p>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}