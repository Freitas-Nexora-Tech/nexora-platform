export default function Hero() {
  return (
    <section
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 pt-20 text-center text-white"
      style={{
        backgroundImage:
          "url('/images/hero-tech.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-950/75" />

      {/* Gradiente inferior */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" />

      {/* Brilho */}
      <div className="absolute left-1/2 top-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

      {/* Conteúdo */}
      <div className="relative z-10 mx-auto max-w-5xl">

        <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-5 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
          Inteligência Artificial • Automação • Software
        </span>

        <h1 className="mt-7 text-5xl font-extrabold tracking-tight md:text-7xl">
          Tecnologia que{" "}
          <span className="text-cyan-400">
            trabalha
          </span>{" "}
          para o seu negócio.
        </h1>

        <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
          A Nexora Tech desenvolve soluções digitais,
          inteligência artificial e automação para
          ajudar empresas a simplificar processos,
          aumentar a produtividade e crescer com
          tecnologia.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">

          <a
            href="#contacto"
            className="rounded-xl bg-cyan-500 px-8 py-4 font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition duration-300 hover:bg-cyan-400 hover:shadow-cyan-500/30"
          >
            Falar com a Nexora
          </a>

          <a
            href="#servicos"
            className="rounded-xl border border-cyan-400/50 bg-slate-950/30 px-8 py-4 font-semibold text-white transition duration-300 hover:border-cyan-400 hover:bg-cyan-500/10"
          >
            Conhecer soluções
          </a>

        </div>

        {/* Destaques */}

        <div className="mx-auto mt-16 grid max-w-3xl gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4 backdrop-blur-sm">
            <p className="text-2xl font-bold text-cyan-400">
              IA
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Soluções inteligentes
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4 backdrop-blur-sm">
            <p className="text-2xl font-bold text-cyan-400">
              Automação
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Menos tarefas manuais
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4 backdrop-blur-sm">
            <p className="text-2xl font-bold text-cyan-400">
              Software
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Soluções à medida
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}