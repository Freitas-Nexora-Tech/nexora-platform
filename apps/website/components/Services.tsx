export default function Services() {
  const services = [
    {
      icon: "💻",
      title: "Desenvolvimento Web",
      description:
        "Sites rápidos, modernos e responsivos preparados para destacar a sua empresa.",
    },
    {
      icon: "📱",
      title: "Aplicações Mobile",
      description:
        "Aplicações Android e iOS modernas, intuitivas e adaptadas às necessidades do seu negócio.",
    },
    {
      icon: "🤖",
      title: "Inteligência Artificial",
      description:
        "Assistentes virtuais, chatbots e soluções inteligentes para automatizar o seu negócio.",
    },
    {
      icon: "☁️",
      title: "Cloud Computing",
      description:
        "Infraestruturas cloud seguras, escaláveis e preparadas para o crescimento.",
    },
    {
      icon: "⚙️",
      title: "Automação",
      description:
        "Automatização de tarefas e processos para reduzir custos e aumentar a produtividade.",
    },
    {
      icon: "🔐",
      title: "Cibersegurança",
      description:
        "Proteção de dados, sistemas e aplicações contra ameaças digitais.",
    },
    {
      icon: "🛒",
      title: "Lojas Online",
      description:
        "Criação de lojas virtuais modernas com pagamentos integrados e experiência otimizada.",
    },
  ];

  return (
    <section
      id="servicos"
      className="relative overflow-hidden bg-slate-950 py-24 text-white"
    >
      {/* Brilho de fundo */}
      <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Cabeçalho */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="font-semibold uppercase tracking-[0.3em] text-cyan-400">
            O que fazemos
          </span>

          <h2 className="mt-4 text-4xl font-extrabold md:text-5xl">
            Os nossos{" "}
            <span className="text-cyan-400">Serviços</span>
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-400">
            Tecnologia para impulsionar o seu negócio com soluções digitais
            modernas, inteligentes e personalizadas.
          </p>
        </div>

        {/* Cartões */}
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.title}
              className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-8 transition-all duration-300 hover:-translate-y-2 hover:border-cyan-400/60 hover:shadow-2xl hover:shadow-cyan-500/10"
            >
              {/* Brilho do cartão */}
              <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl transition-all duration-500 group-hover:bg-cyan-400/20" />

              {/* Ícone */}
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-3xl transition-all duration-300 group-hover:scale-110 group-hover:border-cyan-400/50 group-hover:bg-cyan-400/20">
                {service.icon}
              </div>

              {/* Conteúdo */}
              <h3 className="relative mt-7 text-2xl font-bold">
                {service.title}
              </h3>

              <p className="relative mt-4 leading-7 text-slate-400">
                {service.description}
              </p>

              {/* Linha inferior */}
              <div className="mt-7 h-px w-12 bg-cyan-400 transition-all duration-300 group-hover:w-24" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}