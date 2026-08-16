export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-14">

        <div className="grid gap-10 md:grid-cols-3">

          {/* Logo / descrição */}
          <div>
            <h2 className="text-2xl font-extrabold">
              Nexora
              <span className="text-cyan-400"> Tech</span>
            </h2>

            <p className="mt-4 max-w-sm leading-7 text-slate-400">
              Soluções digitais inteligentes para empresas que querem
              crescer através da tecnologia, automação e Inteligência
              Artificial.
            </p>
          </div>

          {/* Navegação */}
          <div>
            <h3 className="font-semibold text-white">
              Navegação
            </h3>

            <div className="mt-4 flex flex-col gap-3">
              <a
                href="/"
                className="text-slate-400 transition hover:text-cyan-400"
              >
                Início
              </a>

              <a
                href="/#servicos"
                className="text-slate-400 transition hover:text-cyan-400"
              >
                Serviços
              </a>

              <a
                href="/nexora-ai"
                className="text-slate-400 transition hover:text-cyan-400"
              >
                Nexora AI
              </a>

              <a
                href="/portfolio"
                className="text-slate-400 transition hover:text-cyan-400"
              >
                Portfólio
              </a>

              <a
                href="/#contacto"
                className="text-slate-400 transition hover:text-cyan-400"
              >
                Contacto
              </a>
            </div>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-semibold text-white">
              Contacto
            </h3>

            <div className="mt-4 space-y-3 text-slate-400">
              <p>📧 contacto@nexoratech.pt</p>
              <p>🤖 Soluções com Inteligência Artificial</p>
              <p>🌍 Portugal & Europa</p>
            </div>
          </div>

        </div>

        {/* Linha inferior */}
        <div className="mt-12 border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Nexora Tech. Todos os direitos reservados.
        </div>

      </div>
    </footer>
  );
}