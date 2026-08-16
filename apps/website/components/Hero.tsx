export default function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center px-6 pt-20 text-center text-white bg-slate-950 overflow-hidden"
      style={{
        backgroundImage: "url('/images/hero-tech.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay escuro para melhorar a leitura */}
      <div className="absolute inset-0 bg-slate-950/65" />

      {/* Conteúdo */}
      <div className="relative z-10 max-w-4xl mx-auto">

        <span className="text-cyan-400 font-semibold tracking-widest uppercase">
          Software • IA • Cloud
        </span>

        <h1 className="mt-4 text-5xl md:text-7xl font-extrabold tracking-tight">
          Nexora Tech
        </h1>

        <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-slate-200 leading-relaxed">
          Criamos soluções digitais inteligentes para empresas que desejam
          crescer utilizando tecnologia, automação e Inteligência Artificial.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">

          <button
            className="rounded-xl bg-cyan-500 px-7 py-4 font-semibold
            text-slate-950 hover:bg-cyan-400 transition duration-300
            shadow-lg shadow-cyan-500/20"
          >
            Solicitar Orçamento
          </button>

          <button
            className="rounded-xl border border-cyan-400 px-7 py-4
            font-semibold text-white hover:bg-cyan-500/20
            transition duration-300"
          >
            Conhecer Serviços
          </button>

        </div>

      </div>
    </section>
  );
}