export default function About() {
  const highlights = [
    {
      icon: "⚡",
      title: "Tecnologia Moderna",
      description:
        "Utilizamos tecnologias atuais para criar soluções rápidas, seguras e preparadas para o futuro.",
    },
    {
      icon: "🤖",
      title: "Inteligência Artificial",
      description:
        "Integramos IA para automatizar processos e criar experiências digitais mais inteligentes.",
    },
    {
      icon: "☁️",
      title: "Soluções Cloud",
      description:
        "Infraestruturas cloud escaláveis para acompanhar o crescimento da sua empresa.",
    },
    {
      icon: "🎯",
      title: "Soluções Personalizadas",
      description:
        "Cada projeto é desenvolvido de acordo com os objetivos e necessidades de cada cliente.",
    },
  ];

  return (
    <section
      id="sobre"
      className="relative overflow-hidden bg-slate-900 py-24 text-white"
    >
      {/* Efeitos de fundo */}
      <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="absolute -right-32 bottom-20 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Conteúdo principal */}
        <div className="grid items-center gap-14 lg:grid-cols-2">
          
          {/* Texto */}
          <div>
            <span className="font-semibold uppercase tracking-[0.3em] text-cyan-400">
              Sobre Nós
            </span>

            <h2 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
              Tecnologia que{" "}
              <span className="text-cyan-400">impulsiona</span> empresas.
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-300">
              A Nexora Tech nasceu para ajudar empresas a crescer através da
              tecnologia. Criamos websites, aplicações, automações,
              inteligência artificial e soluções cloud adaptadas às
              necessidades de cada cliente.
            </p>

            <p className="mt-5 text-lg leading-8 text-slate-400">
              O nosso objetivo é simplificar processos, aumentar a
              produtividade e criar experiências digitais modernas que geram
              resultados reais.
            </p>

            {/* Destaques */}
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
                Desenvolvimento Web
              </span>

              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
                Inteligência Artificial
              </span>

              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
                Automação
              </span>

              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
                Cloud
              </span>
            </div>
          </div>

          {/* Cartão lateral */}
          <div className="relative">
            <div className="absolute -inset-1 rounded-3xl bg-cyan-400/20 blur-xl" />

            <div className="relative rounded-3xl border border-slate-700 bg-slate-950/90 p-8 shadow-2xl">
              <div className="mb-8">
                <span className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
                  Porquê a Nexora?
                </span>

                <h3 className="mt-3 text-3xl font-bold">
                  Uma tecnologia pensada para o seu negócio.
                </h3>
              </div>

              <div className="space-y-6">
                {highlights.map((item) => (
                  <div
                    key={item.title}
                    className="group flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition-all duration-300 hover:border-cyan-400/40 hover:bg-slate-800/70"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-2xl transition-transform duration-300 group-hover:scale-110">
                      {item.icon}
                    </div>

                    <div>
                      <h4 className="font-bold text-white">
                        {item.title}
                      </h4>

                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Frase final */}
        <div className="mt-20 border-t border-slate-800 pt-12 text-center">
          <p className="mx-auto max-w-3xl text-2xl font-semibold leading-relaxed text-slate-200 md:text-3xl">
            "Transformamos ideias em{" "}
            <span className="text-cyan-400">soluções digitais</span> que fazem
            a diferença."
          </p>
        </div>
      </div>
    </section>
  );
}