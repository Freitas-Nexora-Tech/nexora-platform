import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function BookingLandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      {/* Hero */}

      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-6xl text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
            Nexora Booking
          </span>

          <h1 className="mx-auto mt-5 max-w-4xl text-5xl font-extrabold leading-tight md:text-7xl">
            A sua agenda.
            <br />
            <span className="text-cyan-400">Mais simples. Mais inteligente.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-400 md:text-xl">
            Gestão profissional de marcações, clientes, serviços e
            profissionais — com inteligência artificial para ajudar a gerir
            melhor o seu negócio.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/nexora-ai/login"
              className="rounded-xl bg-cyan-500 px-8 py-4 font-bold text-slate-950 transition hover:bg-cyan-400"
            >
              Experimentar gratuitamente →
            </a>

            <a
              href="#funcionalidades"
              className="rounded-xl border border-slate-700 px-8 py-4 font-semibold text-white transition hover:border-cyan-400/60 hover:text-cyan-400"
            >
              Ver como funciona
            </a>
          </div>

          <p className="mt-5 text-sm text-slate-600">
            Sem comissões por marcação · Sem complicações · Cancelamento simples
          </p>
        </div>
      </section>

      {/* Problema */}

      <section className="border-y border-slate-900 bg-slate-950 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <span className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              O problema
            </span>

            <h2 className="mt-4 text-3xl font-extrabold md:text-5xl">
              Gerir um negócio não devia significar passar o dia a gerir
              marcações.
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-400">
              Clientes a enviar mensagens, horários espalhados, profissionais
              com disponibilidades diferentes e aquela sensação de que alguns
              clientes simplesmente deixaram de aparecer.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["📅", "Marcações espalhadas", "Perder tempo a organizar horários e pedidos."],
              ["👥", "Clientes esquecidos", "Clientes antigos que deixam de marcar sem ninguém perceber."],
              ["🕐", "Horários vazios", "Espaços na agenda que poderiam estar ocupados."],
              ["📊", "Pouca informação", "Dificuldade em perceber o que realmente acontece no negócio."],
            ].map(([icon, title, text]) => (
              <div
                key={title}
                className="rounded-3xl border border-slate-800 bg-slate-900 p-7"
              >
                <div className="text-3xl">{icon}</div>

                <h3 className="mt-5 text-lg font-bold">{title}</h3>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solução */}

      <section
        id="funcionalidades"
        className="px-6 py-20 md:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Tudo num só lugar
            </span>

            <h2 className="mt-4 text-3xl font-extrabold md:text-5xl">
              Tudo o que precisa para gerir a sua agenda
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-400">
              Uma plataforma simples para organizar o dia a dia e dar aos seus
              clientes uma experiência profissional.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              [
                "📅",
                "Calendário",
                "Veja e organize todas as marcações num único lugar.",
              ],
              [
                "💆",
                "Serviços",
                "Defina serviços, duração, preços e disponibilidade.",
              ],
              [
                "👤",
                "Profissionais",
                "Gira a sua equipa e os serviços que cada profissional realiza.",
              ],
              [
                "👥",
                "Clientes",
                "Tenha os dados e o histórico dos seus clientes organizados.",
              ],
              [
                "🕐",
                "Disponibilidade",
                "Defina os horários de atendimento de cada profissional.",
              ],
              [
                "🚫",
                "Bloqueios",
                "Bloqueie facilmente férias, pausas e períodos indisponíveis.",
              ],
            ].map(([icon, title, text]) => (
              <div
                key={title}
                className="group rounded-3xl border border-slate-800 bg-slate-900 p-8 transition hover:-translate-y-1 hover:border-cyan-400/50"
              >
                <div className="text-4xl">{icon}</div>

                <h3 className="mt-5 text-xl font-bold group-hover:text-cyan-400">
                  {title}
                </h3>

                <p className="mt-3 leading-7 text-slate-400">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diferencial IA */}

      <section className="relative overflow-hidden border-y border-slate-900 bg-slate-900/50 px-6 py-24">
        <div className="pointer-events-none absolute right-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div>
              <span className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
                O diferencial Nexora
              </span>

              <h2 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
                A sua agenda não deve apenas mostrar o que aconteceu.
                <br />
                <span className="text-cyan-400">
                  Deve ajudá-lo a perceber o que fazer a seguir.
                </span>
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-400">
                Com a Nexora AI, pode fazer perguntas sobre o seu próprio
                negócio utilizando linguagem natural. A inteligência artificial
                analisa os dados do Booking e transforma informação em respostas
                úteis.
              </p>

              <div className="mt-8">
                <a
                  href="#planos"
                  className="inline-block rounded-xl bg-cyan-500 px-7 py-3.5 font-bold text-slate-950 transition hover:bg-cyan-400"
                >
                  Conhecer os planos →
                </a>
              </div>
            </div>

            {/* Exemplo de conversa */}

            <div className="rounded-3xl border border-slate-700 bg-slate-950 p-5 shadow-2xl md:p-7">
              <div className="mb-6 flex items-center gap-3 border-b border-slate-800 pb-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-2xl">
                  🤖
                </div>

                <div>
                  <p className="font-bold">Nexora AI</p>

                  <p className="text-xs text-emerald-400">
                    Inteligência do seu negócio
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-cyan-500 px-5 py-4 text-sm font-medium text-slate-950">
                  Que clientes não fazem uma marcação há mais de 60 dias?
                </div>

                <div className="max-w-[90%] rounded-2xl rounded-tl-sm border border-slate-800 bg-slate-900 px-5 py-4 text-sm leading-6 text-slate-300">
                  Encontrei <strong className="text-white">12 clientes</strong>{" "}
                  que não fazem uma marcação há mais de 60 dias.
                  <br />
                  <br />
                  7 deles costumavam marcar regularmente e ainda não regressaram.
                  <br />
                  <br />
                  <span className="text-cyan-400">
                    Posso preparar uma mensagem para os convidar a marcar
                    novamente.
                  </span>
                </div>

                <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-cyan-500 px-5 py-4 text-sm font-medium text-slate-950">
                  Qual foi o serviço mais marcado este mês?
                </div>

                <div className="max-w-[90%] rounded-2xl rounded-tl-sm border border-slate-800 bg-slate-900 px-5 py-4 text-sm leading-6 text-slate-300">
                  <strong className="text-white">
                    Massagem Relaxante
                  </strong>{" "}
                  foi o serviço mais marcado este mês, com 34 marcações.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IA na prática */}

      <section className="px-6 py-20 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Inteligência na prática
            </span>

            <h2 className="mt-4 text-3xl font-extrabold md:text-5xl">
              Pergunte. Perceba. Aja.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-400">
              A Nexora AI foi pensada para transformar os dados do seu negócio
              em decisões simples.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              [
                "🔎",
                "Descobrir",
                "Encontre clientes que não regressam, serviços mais procurados e padrões da sua agenda.",
              ],
              [
                "💡",
                "Perceber",
                "Obtenha respostas claras sobre o desempenho do seu negócio sem procurar dados manualmente.",
              ],
              [
                "🚀",
                "Agir",
                "Prepare campanhas, encontre oportunidades e tome decisões com base nos seus próprios dados.",
              ],
            ].map(([icon, title, text]) => (
              <div
                key={title}
                className="rounded-3xl border border-slate-800 bg-slate-900 p-8"
              >
                <div className="text-4xl">{icon}</div>

                <h3 className="mt-5 text-xl font-bold">{title}</h3>

                <p className="mt-3 leading-7 text-slate-400">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}

      <section className="border-y border-slate-900 bg-slate-900/40 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Simples de começar
            </span>

            <h2 className="mt-4 text-3xl font-extrabold md:text-5xl">
              Comece em poucos passos
            </h2>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              [
                "01",
                "Crie a sua conta",
                "Escolha o plano que melhor se adapta ao seu negócio.",
              ],
              [
                "02",
                "Configure o Booking",
                "Adicione serviços, profissionais, horários e regras de marcação.",
              ],
              [
                "03",
                "Comece a receber marcações",
                "Partilhe a sua página de reservas e deixe o Nexora Booking tratar do resto.",
              ],
            ].map(([number, title, text]) => (
              <div key={number} className="relative">
                <div className="text-6xl font-black text-cyan-400/20">
                  {number}
                </div>

                <h3 className="mt-3 text-2xl font-bold">{title}</h3>

                <p className="mt-3 leading-7 text-slate-400">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}

      <section
        id="planos"
        className="px-6 py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Planos simples
            </span>

            <h2 className="mt-4 text-3xl font-extrabold md:text-5xl">
              Escolha o plano certo para o seu negócio
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-400">
              Comece pequeno e evolua quando o seu negócio crescer.
            </p>

            <p className="mt-4 text-sm font-semibold text-cyan-400">
              Preços de lançamento
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {/* Starter */}

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Starter
              </p>

              <h3 className="mt-3 text-3xl font-bold">15 €</h3>

              <p className="mt-1 text-sm text-slate-500">
                / mês
              </p>

              <p className="mt-5 text-sm leading-6 text-slate-400">
                Para pequenos negócios que querem começar a organizar as suas
                marcações.
              </p>

              <ul className="mt-7 space-y-3 text-sm text-slate-300">
                <li>✓ 2 profissionais</li>
                <li>✓ Marcações ilimitadas</li>
                <li>✓ Gestão de clientes</li>
                <li>✓ Gestão de serviços</li>
                <li>✓ Calendário</li>
                <li>✓ Página de reservas</li>
                <li>✓ QR Code</li>
              </ul>

              <a
                href="/nexora-ai/login"
                className="mt-8 block rounded-xl border border-slate-700 px-5 py-3 text-center font-bold transition hover:border-cyan-400 hover:text-cyan-400"
              >
                Começar agora
              </a>
            </div>

            {/* Professional */}

            <div className="relative rounded-3xl border border-cyan-400/50 bg-slate-900 p-8 shadow-2xl shadow-cyan-500/5">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-cyan-500 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-950">
                Mais popular
              </div>

              <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                Professional
              </p>

              <h3 className="mt-3 text-3xl font-bold">29 €</h3>

              <p className="mt-1 text-sm text-slate-500">
                / mês
              </p>

              <p className="mt-5 text-sm leading-6 text-slate-400">
                Para empresas em crescimento que precisam de mais controlo e
                inteligência.
              </p>

              <ul className="mt-7 space-y-3 text-sm text-slate-300">
                <li>✓ Até 5 profissionais</li>
                <li>✓ Tudo do Starter</li>
                <li>✓ Lembretes</li>
                <li>✓ Gestão avançada</li>
                <li>✓ Estatísticas básicas</li>
                <li>✓ Automação</li>
                <li>✓ Nexora AI incluída</li>
              </ul>

              <a
                href="/nexora-ai/login"
                className="mt-8 block rounded-xl bg-cyan-500 px-5 py-3 text-center font-bold text-slate-950 transition hover:bg-cyan-400"
              >
                Experimentar gratuitamente
              </a>
            </div>

            {/* Business */}

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Business
              </p>

              <h3 className="mt-3 text-3xl font-bold">49 €</h3>

              <p className="mt-1 text-sm text-slate-500">
                / mês
              </p>

              <p className="mt-5 text-sm leading-6 text-slate-400">
                Para empresas com equipas maiores e necessidades mais avançadas.
              </p>

              <ul className="mt-7 space-y-3 text-sm text-slate-300">
                <li>✓ Até 15 profissionais</li>
                <li>✓ Tudo do Professional</li>
                <li>✓ Estatísticas avançadas</li>
                <li>✓ Automação avançada</li>
                <li>✓ Nexora AI incluída</li>
                <li>✓ Suporte prioritário</li>
              </ul>

              <a
                href="/nexora-ai/login"
                className="mt-8 block rounded-xl border border-slate-700 px-5 py-3 text-center font-bold transition hover:border-cyan-400 hover:text-cyan-400"
              >
                Começar agora
              </a>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-slate-600">
            Sem comissões sobre as suas marcações.
          </p>
        </div>
      </section>

      {/* FAQ */}

      <section className="border-t border-slate-900 bg-slate-900/40 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              FAQ
            </span>

            <h2 className="mt-4 text-3xl font-extrabold md:text-5xl">
              Perguntas frequentes
            </h2>
          </div>

          <div className="mt-12 space-y-4">
            {[
              [
                "Preciso de instalar alguma aplicação?",
                "Não. O Nexora Booking funciona online e os seus clientes podem marcar através de uma página de reservas.",
              ],
              [
                "O meu cliente precisa de criar uma conta?",
                "Não. A experiência de marcação pode ser simples e direta, sem obrigar o cliente a instalar uma aplicação.",
              ],
              [
                "Existe comissão sobre as marcações?",
                "Não. O Nexora Booking funciona através de uma subscrição e não através de uma percentagem sobre cada marcação.",
              ],
              [
                "Posso ter vários profissionais?",
                "Sim. O número de profissionais depende do plano escolhido.",
              ],
              [
                "A Nexora AI está incluída?",
                "A Nexora AI está incluída nos planos onde é indicada e foi concebida para trabalhar com os dados do seu próprio negócio.",
              ],
            ].map(([question, answer]) => (
              <div
                key={question}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
              >
                <h3 className="font-bold">{question}</h3>

                <p className="mt-3 leading-7 text-slate-400">
                  {answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}

      <section className="relative overflow-hidden px-6 py-24">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Nexora Booking
          </span>

          <h2 className="mt-5 text-4xl font-extrabold md:text-6xl">
            Menos tempo a gerir a agenda.
            <br />
            <span className="text-cyan-400">
              Mais tempo a gerir o seu negócio.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            Comece a organizar as suas marcações e descubra como a inteligência
            artificial pode ajudar o seu negócio a crescer.
          </p>

          <a
            href="/nexora-ai/login"
            className="mt-10 inline-block rounded-xl bg-cyan-500 px-9 py-4 font-bold text-slate-950 transition hover:bg-cyan-400"
          >
            Experimentar gratuitamente →
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}