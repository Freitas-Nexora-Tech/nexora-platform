import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const solucoes = [
  {
    nome: "Nexora Booking",
    etiqueta: "Gestão & Agendamentos",
    descricao:
      "Uma solução completa para empresas gerirem clientes, serviços, horários e marcações de forma simples e organizada.",
    funcionalidades: [
      "Gestão de clientes",
      "Gestão de serviços",
      "Agenda online",
      "Disponibilidade",
      "Marcações",
      "Notificações",
    ],
    estado: "Em desenvolvimento",
    href: "/produtos/nexora-booking",
    icon: "📅",
  },
  {
    nome: "Nexora Web",
    etiqueta: "Web & Presença Digital",
    descricao:
      "Websites e soluções digitais profissionais desenvolvidos à medida das necessidades de cada empresa.",
    funcionalidades: [
      "Websites profissionais",
      "Landing pages",
      "Aplicações web",
      "Integrações",
      "Experiências digitais",
      "Soluções personalizadas",
    ],
    estado: "Disponível",
    href: "/produtos/nexora-web",
    icon: "🌐",
  },
  {
    nome: "Nexora Automation",
    etiqueta: "Automação Empresarial",
    descricao:
      "Automatização de processos para reduzir tarefas repetitivas, melhorar operações e aumentar a produtividade.",
    funcionalidades: [
      "Automação de processos",
      "Integração entre sistemas",
      "Fluxos automáticos",
      "Tarefas repetitivas",
      "Produtividade",
      "Soluções personalizadas",
    ],
    estado: "Sob consulta",
    href: "/produtos/nexora-automation",
    icon: "⚡",
  },
];

export default function ProdutosPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      {/* HERO */}

      <section className="relative overflow-hidden px-6 py-24 md:py-32">

        <div className="absolute left-1/2 top-0 h-[550px] w-[550px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-6xl text-center">

          <span className="font-semibold uppercase tracking-[0.3em] text-cyan-400">
            Soluções Nexora
          </span>

          <h1 className="mt-5 text-5xl font-extrabold tracking-tight md:text-6xl">
            Tecnologia que trabalha
            <span className="block text-cyan-400">
              para a sua empresa.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-slate-400 md:text-xl">
            Criamos soluções digitais para ajudar empresas
            a organizar, automatizar e melhorar a forma como
            trabalham.
          </p>

        </div>
      </section>

      {/* SOLUÇÕES */}

      <section className="px-6 pb-24">

        <div className="mx-auto max-w-6xl">

          <div className="mb-12 max-w-3xl">

            <span className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              O ecossistema Nexora
            </span>

            <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">
              Soluções pensadas para crescer consigo.
            </h2>

            <p className="mt-4 leading-7 text-slate-400">
              Cada solução resolve uma necessidade específica,
              mas todas podem fazer parte de um ecossistema
              tecnológico integrado.
            </p>

          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

            {solucoes.map((solucao) => (
              <article
                key={solucao.nome}
                className="group flex h-full flex-col rounded-3xl border border-slate-800 bg-slate-900/80 p-7 shadow-2xl transition hover:-translate-y-1 hover:border-cyan-400/30"
              >

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-2xl">
                  {solucao.icon}
                </div>

                <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                  {solucao.etiqueta}
                </p>

                <h3 className="mt-3 text-2xl font-extrabold">
                  {solucao.nome}
                </h3>

                <p className="mt-4 leading-7 text-slate-400">
                  {solucao.descricao}
                </p>

                <div className="mt-7 flex-1 border-t border-slate-800 pt-6">

                  <p className="text-sm font-semibold text-slate-300">
                    Funcionalidades
                  </p>

                  <ul className="mt-4 grid gap-3">
                    {solucao.funcionalidades.map(
                      (funcionalidade) => (
                        <li
                          key={funcionalidade}
                          className="flex items-start gap-2 text-sm text-slate-400"
                        >
                          <span className="text-cyan-400">
                            ✓
                          </span>

                          <span>
                            {funcionalidade}
                          </span>
                        </li>
                      )
                    )}
                  </ul>

                </div>

                <div className="mt-8">

                  <p
                    className={`mb-4 text-sm font-semibold ${
                      solucao.estado === "Disponível"
                        ? "text-emerald-400"
                        : "text-slate-500"
                    }`}
                  >
                    {solucao.estado}
                  </p>

                  <a
                    href={solucao.href}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-400"
                  >
                    Saber mais →
                  </a>

                </div>

              </article>
            ))}

          </div>

        </div>
      </section>

      {/* NEXORA AI */}

      <section className="relative overflow-hidden px-6 pb-24">

        <div className="mx-auto max-w-6xl">

          <div className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-slate-900 p-8 shadow-2xl md:p-12">

            <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative z-10 grid gap-10 md:grid-cols-[1fr_auto] md:items-center">

              <div>

                <span className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
                  Inteligência Nexora
                </span>

                <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">
                  Nexora AI
                </h2>

                <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
                  A inteligência que pode acompanhar
                  e potenciar as soluções da sua empresa.
                </p>

                <p className="mt-4 max-w-2xl leading-7 text-slate-500">
                  A Nexora AI não pretende substituir as
                  ferramentas que a sua empresa já utiliza.
                  O nosso objetivo é integrar inteligência
                  artificial nos processos e soluções onde
                  ela realmente acrescenta valor.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">

                  <span className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300">
                    🧠 Conhecimento empresarial
                  </span>

                  <span className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300">
                    📄 Documentos
                  </span>

                  <span className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300">
                    💬 Conversas
                  </span>

                  <span className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300">
                    ⚙️ Automação
                  </span>

                </div>

              </div>

              <div className="flex justify-start md:justify-end">

                <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-cyan-400/20 bg-cyan-400/10 text-6xl shadow-xl">
                  🤖
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* COMO FUNCIONA */}

      <section className="px-6 pb-24">

        <div className="mx-auto max-w-6xl">

          <div className="text-center">

            <span className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Uma visão integrada
            </span>

            <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">
              As soluções trabalham juntas.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-400">
              A verdadeira força da Nexora está na possibilidade
              de combinar diferentes soluções de acordo com
              as necessidades de cada empresa.
            </p>

          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-4">

            {[
              {
                numero: "01",
                titulo: "Escolha",
                texto:
                  "Começamos pelas necessidades reais da empresa.",
              },
              {
                numero: "02",
                titulo: "Integre",
                texto:
                  "As soluções podem comunicar entre si.",
              },
              {
                numero: "03",
                titulo: "Inteligência",
                texto:
                  "A IA acrescenta contexto e automação.",
              },
              {
                numero: "04",
                titulo: "Evolua",
                texto:
                  "O ecossistema cresce à medida que a empresa cresce.",
              },
            ].map((passo) => (
              <div
                key={passo.numero}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
              >

                <span className="text-sm font-bold text-cyan-400">
                  {passo.numero}
                </span>

                <h3 className="mt-4 text-xl font-bold">
                  {passo.titulo}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {passo.texto}
                </p>

              </div>
            ))}

          </div>

        </div>
      </section>

      {/* CTA */}

      <section className="px-6 pb-24">

        <div className="mx-auto max-w-6xl">

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center md:p-12">

            <span className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Nexora Tech
            </span>

            <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">
              A tecnologia deve adaptar-se à sua empresa.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-400">
              Conte-nos o que precisa e descubra como
              podemos criar uma solução adequada ao
              seu negócio.
            </p>

            <a
              href="/contacto"
              className="mt-8 inline-flex rounded-xl bg-cyan-500 px-7 py-4 font-bold text-slate-950 transition hover:bg-cyan-400"
            >
              Falar com a Nexora
            </a>

          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}