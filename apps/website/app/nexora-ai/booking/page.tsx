import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getBookingAccess } from "@/lib/booking-permissions";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default async function NexoraBookingPage() {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/booking/login");
    }

    const access = await getBookingAccess();

    if (!access) {
        redirect("/booking/login");
    }

    if (access.mustChangePassword) {
        redirect("/booking/alterar-password");
    }

    // Empresa associada ao utilizador
    const {
        data: membro,
        error: membroError,
    } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

    if (membroError || !membro) {
        redirect("/booking/login");
    }

    // Dados da empresa
    const {
        data: empresa,
        error: empresaError,
    } = await supabase
        .from("companies")
        .select("id, name, description")
        .eq("id", membro.company_id)
        .single();

    if (empresaError || !empresa) {
        redirect("/booking/login");
    }

    // Configuração do Booking
    const { data: configuracao } = await supabase
        .from("configuracoes_agendamento")
        .select(
            "agendamento_ativo, fuso_horario, intervalo_marcacao_minutos, antecedencia_minima_minutos, antecedencia_maxima_dias, capacidade_por_horario"
        )
        .eq("empresa_id", empresa.id)
        .maybeSingle();

    // Contagens
    const { count: servicosCount } = access.can("servicos")
        ? await supabase
              .from("servicos")
              .select("id", {
                  count: "exact",
                  head: true,
              })
              .eq("empresa_id", empresa.id)
              .eq("ativo", true)
        : { count: null };

    const { count: profissionaisCount } = access.can("profissionais")
        ? await supabase
              .from("profissionais")
              .select("id", {
                  count: "exact",
                  head: true,
              })
              .eq("empresa_id", empresa.id)
              .eq("ativo", true)
        : { count: null };

    const { count: clientesCount } = access.can("clientes")
        ? await supabase
              .from("clientes")
              .select("id", {
                  count: "exact",
                  head: true,
              })
              .eq("empresa_id", empresa.id)
        : { count: null };

    const { count: agendamentosCount } = access.can("agenda")
        ? await supabase
              .from("agendamentos")
              .select("id", {
                  count: "exact",
                  head: true,
              })
              .eq("empresa_id", empresa.id)
              .in("estado", ["pendente", "confirmado"])
        : { count: null };

    // Próximos agendamentos
    const { data: proximosAgendamentos } = access.can("agenda")
        ? await supabase
              .from("agendamentos")
              .select(
                  `
                    id,
                    inicio,
                    fim,
                    estado,
                    notas,
                    clientes (
                        nome
                    ),
                    servicos (
                        nome
                    ),
                    profissionais (
                        nome
                    )
                `
              )
              .eq("empresa_id", empresa.id)
              .in("estado", ["pendente", "confirmado"])
              .gte("inicio", new Date().toISOString())
              .order("inicio", {
                  ascending: true,
              })
              .limit(5)
        : { data: null };

    return (
        <main className="min-h-screen bg-slate-950 text-white">
            <Navbar />

            <section className="relative overflow-hidden px-6 py-12">
                <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

                <div className="relative z-10 mx-auto max-w-7xl">

                    {/* Cabeçalho */}

                    <div className="mb-10">
                        <a
                            href="/nexora-ai/dashboard"
                            className="mb-6 inline-block text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
                        >
                            ← Voltar ao Dashboard
                        </a>

                        <span className="block text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
                            Nexora Booking
                        </span>

                        <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">
                            Gestão de marcações
                        </h1>

                        <p className="mt-3 max-w-2xl text-slate-400">
                            Gerir marcações, serviços, profissionais e clientes da sua empresa.
                        </p>
                    </div>

                    {/* Empresa e estado */}

                    <div className="mb-8 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-xl">
                        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                                    Empresa
                                </p>

                                <h2 className="mt-2 text-3xl font-bold">
                                    {empresa.name}
                                </h2>
                            </div>

                            <div
                                className={
                                    configuracao?.agendamento_ativo
                                        ? "shrink-0 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-5 py-4"
                                        : "shrink-0 rounded-2xl border border-red-400/20 bg-red-400/5 px-5 py-4"
                                }
                            >
                                <p className="text-xs uppercase tracking-wider text-slate-500">
                                    Estado do Booking
                                </p>

                                {configuracao?.agendamento_ativo ? (
                                    <p className="mt-1 font-bold text-emerald-400">
                                        ● Agendamentos ativos
                                    </p>
                                ) : (
                                    <p className="mt-1 font-bold text-red-400">
                                        ● Agendamentos suspensos
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Estatísticas */}

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

                        {access.can("agenda") && (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-400/40">
                                <div className="flex items-center justify-between">
                                    <div className="text-3xl">📅</div>

                                    <span className="text-xs text-slate-600">
                                        Booking
                                    </span>
                                </div>

                                <p className="mt-5 text-sm text-slate-500">
                                    Agendamentos
                                </p>

                                <p className="mt-1 text-3xl font-bold">
                                    {agendamentosCount ?? 0}
                                </p>

                                <p className="mt-2 text-sm text-slate-500">
                                    pendentes ou confirmados
                                </p>
                            </div>
                        )}

                        {access.can("servicos") && (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-400/40">
                                <div className="flex items-center justify-between">
                                    <div className="text-3xl">💆</div>

                                    <span className="text-xs text-slate-600">
                                        Serviços
                                    </span>
                                </div>

                                <p className="mt-5 text-sm text-slate-500">
                                    Serviços ativos
                                </p>

                                <p className="mt-1 text-3xl font-bold">
                                    {servicosCount ?? 0}
                                </p>

                                <p className="mt-2 text-sm text-slate-500">
                                    disponíveis para marcação
                                </p>
                            </div>
                        )}

                        {access.can("profissionais") && (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-400/40">
                                <div className="flex items-center justify-between">
                                    <div className="text-3xl">👤</div>

                                    <span className="text-xs text-slate-600">
                                        Equipa
                                    </span>
                                </div>

                                <p className="mt-5 text-sm text-slate-500">
                                    Profissionais
                                </p>

                                <p className="mt-1 text-3xl font-bold">
                                    {profissionaisCount ?? 0}
                                </p>

                                <p className="mt-2 text-sm text-slate-500">
                                    profissionais ativos
                                </p>
                            </div>
                        )}

                        {access.can("clientes") && (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-400/40">
                                <div className="flex items-center justify-between">
                                    <div className="text-3xl">👥</div>

                                    <span className="text-xs text-slate-600">
                                        Clientes
                                    </span>
                                </div>

                                <p className="mt-5 text-sm text-slate-500">
                                    Clientes
                                </p>

                                <p className="mt-1 text-3xl font-bold">
                                    {clientesCount ?? 0}
                                </p>

                                <p className="mt-2 text-sm text-slate-500">
                                    clientes registados
                                </p>
                            </div>
                        )}

                    </div>

                    {/* Ações principais */}

                    <div className="mt-10">

                        <div className="mb-6">
                            <h2 className="text-2xl font-bold">
                                Gestão do Booking
                            </h2>

                            <p className="mt-2 text-slate-500">
                                Aceda rapidamente às áreas autorizadas.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                            {access.can("agenda") && (
                                <a
                                    href="/nexora-ai/booking/calendario"
                                    className="group rounded-3xl border border-slate-800 bg-slate-900 p-7 transition hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-xl hover:shadow-cyan-500/5"
                                >
                                    <div className="text-3xl">📅</div>

                                    <h2 className="mt-4 text-xl font-bold group-hover:text-cyan-400">
                                        Calendário
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-slate-400">
                                        Consulte e organize as marcações da empresa.
                                    </p>

                                    <span className="mt-5 inline-block font-semibold text-cyan-400">
                                        Abrir calendário →
                                    </span>
                                </a>
                            )}

                            {access.can("servicos") && (
                                <a
                                    href="/nexora-ai/booking/servicos"
                                    className="group rounded-3xl border border-slate-800 bg-slate-900 p-7 transition hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-xl hover:shadow-cyan-500/5"
                                >
                                    <div className="text-3xl">💆</div>

                                    <h2 className="mt-4 text-xl font-bold group-hover:text-cyan-400">
                                        Serviços
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-slate-400">
                                        Gerir serviços, duração, preços e disponibilidade.
                                    </p>

                                    <span className="mt-5 inline-block font-semibold text-cyan-400">
                                        Gerir serviços →
                                    </span>
                                </a>
                            )}

                            {access.can("profissionais") && (
                                <a
                                    href="/nexora-ai/booking/profissionais"
                                    className="group rounded-3xl border border-slate-800 bg-slate-900 p-7 transition hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-xl hover:shadow-cyan-500/5"
                                >
                                    <div className="text-3xl">👤</div>

                                    <h2 className="mt-4 text-xl font-bold group-hover:text-cyan-400">
                                        Profissionais
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-slate-400">
                                        Gerir profissionais e os serviços que realizam.
                                    </p>

                                    <span className="mt-5 inline-block font-semibold text-cyan-400">
                                        Gerir profissionais →
                                    </span>
                                </a>
                            )}

                            {access.can("clientes") && (
                                <a
                                    href="/nexora-ai/booking/clientes"
                                    className="group rounded-3xl border border-slate-800 bg-slate-900 p-7 transition hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-xl hover:shadow-cyan-500/5"
                                >
                                    <div className="text-3xl">👥</div>

                                    <h2 className="mt-4 text-xl font-bold group-hover:text-cyan-400">
                                        Clientes
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-slate-400">
                                        Consultar e gerir os clientes da empresa.
                                    </p>

                                    <span className="mt-5 inline-block font-semibold text-cyan-400">
                                        Gerir clientes →
                                    </span>
                                </a>
                            )}

                            {access.can("disponibilidade") && (
                                <a
                                    href="/nexora-ai/booking/disponibilidade"
                                    className="group rounded-3xl border border-slate-800 bg-slate-900 p-7 transition hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-xl hover:shadow-cyan-500/5"
                                >
                                    <div className="text-3xl">🕐</div>

                                    <h2 className="mt-4 text-xl font-bold group-hover:text-cyan-400">
                                        Disponibilidade
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-slate-400">
                                        Definir os horários de atendimento dos profissionais.
                                    </p>

                                    <span className="mt-5 inline-block font-semibold text-cyan-400">
                                        Gerir disponibilidade →
                                    </span>
                                </a>
                            )}

                            {access.can("bloqueios") && (
                                <a
                                    href="/nexora-ai/booking/bloqueios"
                                    className="group rounded-3xl border border-slate-800 bg-slate-900 p-7 transition hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-xl hover:shadow-cyan-500/5"
                                >
                                    <div className="text-3xl">🚫</div>

                                    <h2 className="mt-4 text-xl font-bold group-hover:text-cyan-400">
                                        Bloqueios
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-slate-400">
                                        Bloquear períodos em que um profissional não está disponível.
                                    </p>

                                    <span className="mt-5 inline-block font-semibold text-cyan-400">
                                        Gerir bloqueios →
                                    </span>
                                </a>
                            )}

                            {access.can("marcacoes") && (
                                <a
                                    href="/nexora-ai/booking/agendamentos"
                                    className="group rounded-3xl border border-slate-800 bg-slate-900 p-7 transition hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-xl hover:shadow-cyan-500/5"
                                >
                                    <div className="text-3xl">📝</div>

                                    <h2 className="mt-4 text-xl font-bold group-hover:text-cyan-400">
                                        Agendamentos
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-slate-400">
                                        Consultar, gerir e acompanhar todas as marcações da empresa.
                                    </p>

                                    <span className="mt-5 inline-block font-semibold text-cyan-400">
                                        Gerir agendamentos →
                                    </span>
                                </a>
                            )}

                            {access.can("financeiro") && (
                                <a
                                    href="/nexora-ai/booking/financeiro"
                                    className="group rounded-3xl border border-slate-800 bg-slate-900 p-7 transition hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-xl hover:shadow-cyan-500/5"
                                >
                                    <div className="text-3xl">💰</div>

                                    <h2 className="mt-4 text-xl font-bold group-hover:text-cyan-400">
                                        Financeiro
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-slate-400">
                                        Acompanhar o caixa gerado pelas marcações concluídas.
                                    </p>

                                    <span className="mt-5 inline-block font-semibold text-cyan-400">
                                        Ver financeiro →
                                    </span>
                                </a>
                            )}

                            {access.can("configuracoes") && (
                                <a
                                    href="/nexora-ai/booking/configuracoes"
                                    className="group rounded-3xl border border-slate-800 bg-slate-900 p-7 transition hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-xl hover:shadow-cyan-500/5"
                                >
                                    <div className="text-3xl">⚙️</div>

                                    <h2 className="mt-4 text-xl font-bold group-hover:text-cyan-400">
                                        Configurações
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-slate-400">
                                        Gerir as configurações do Nexora Booking.
                                    </p>

                                    <span className="mt-5 inline-block font-semibold text-cyan-400">
                                        Configurar Booking →
                                    </span>
                                </a>
                            )}

                            {access.can("equipa") && (
                                <a
                                    href="/nexora-ai/booking/equipa"
                                    className="group rounded-3xl border border-slate-800 bg-slate-900 p-7 transition hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-xl hover:shadow-cyan-500/5"
                                >
                                    <div className="text-3xl">👥</div>

                                    <h2 className="mt-4 text-xl font-bold group-hover:text-cyan-400">
                                        Equipa
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-slate-400">
                                        Gerir funcionários e permissões de acesso.
                                    </p>

                                    <span className="mt-5 inline-block font-semibold text-cyan-400">
                                        Gerir equipa →
                                    </span>
                                </a>
                            )}

                        </div>
                    </div>

                    {/* Próximos agendamentos */}

                    {access.can("agenda") && (
                        <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-900 p-7">

                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                                        Agenda
                                    </p>

                                    <h2 className="mt-2 text-2xl font-bold">
                                        Próximos agendamentos
                                    </h2>

                                    <p className="mt-2 text-sm text-slate-500">
                                        As próximas marcações da sua empresa.
                                    </p>
                                </div>

                                <a
                                    href="/nexora-ai/booking/calendario"
                                    className="font-semibold text-cyan-400 transition hover:text-cyan-300"
                                >
                                    Ver calendário →
                                </a>
                            </div>

                            <div className="mt-6 space-y-3">

                                {proximosAgendamentos &&
                                proximosAgendamentos.length > 0 ? (
                                    proximosAgendamentos.map((agendamento) => {

                                        const cliente = Array.isArray(
                                            agendamento.clientes
                                        )
                                            ? agendamento.clientes[0]
                                            : agendamento.clientes;

                                        const servico = Array.isArray(
                                            agendamento.servicos
                                        )
                                            ? agendamento.servicos[0]
                                            : agendamento.servicos;

                                        const profissional = Array.isArray(
                                            agendamento.profissionais
                                        )
                                            ? agendamento.profissionais[0]
                                            : agendamento.profissionais;

                                        return (
                                            <div
                                                key={agendamento.id}
                                                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5"
                                            >
                                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                                                    <div>
                                                        <p className="font-bold">
                                                            {cliente?.nome ?? "Cliente"}
                                                        </p>

                                                        <p className="mt-1 text-sm text-slate-400">
                                                            {servico?.nome ?? "Serviço"} ·{" "}
                                                            {profissional?.nome ?? "Profissional"}
                                                        </p>
                                                    </div>

                                                    <div className="text-left md:text-right">
                                                        <p className="font-semibold text-cyan-400">
                                                            {new Date(
                                                                agendamento.inicio
                                                            ).toLocaleString("pt-PT", {
                                                                dateStyle: "short",
                                                                timeStyle: "short",
                                                                timeZone:
                                                                    configuracao?.fuso_horario ||
                                                                    "Europe/Lisbon",
                                                            })}
                                                        </p>

                                                        <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                                                            {agendamento.estado}
                                                        </p>
                                                    </div>

                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center">
                                        <div className="text-4xl">📅</div>

                                        <p className="mt-4 font-semibold">
                                            Não existem próximos agendamentos.
                                        </p>

                                        <p className="mt-2 text-sm text-slate-500">
                                            Quando houver marcações, elas aparecerão aqui.
                                        </p>
                                    </div>
                                )}

                            </div>
                        </div>
                    )}

                    {/* Configuração atual */}

                    {access.can("configuracoes") && (
                        <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/60 p-7">

                            <div className="mb-6">
                                <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                                    Configuração
                                </p>

                                <h2 className="mt-2 text-2xl font-bold">
                                    Regras atuais do Booking
                                </h2>
                            </div>

                            {configuracao ? (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                                    <div className="rounded-2xl bg-slate-950/60 p-5">
                                        <p className="text-sm text-slate-500">
                                            Capacidade
                                        </p>

                                        <p className="mt-2 text-2xl font-bold">
                                            {configuracao.capacidade_por_horario}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-600">
                                            cliente(s) por horário
                                        </p>
                                    </div>

                                    <div className="rounded-2xl bg-slate-950/60 p-5">
                                        <p className="text-sm text-slate-500">
                                            Intervalo
                                        </p>

                                        <p className="mt-2 text-2xl font-bold">
                                            {configuracao.intervalo_marcacao_minutos}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-600">
                                            minutos
                                        </p>
                                    </div>

                                    <div className="rounded-2xl bg-slate-950/60 p-5">
                                        <p className="text-sm text-slate-500">
                                            Antecedência mínima
                                        </p>

                                        <p className="mt-2 text-2xl font-bold">
                                            {configuracao.antecedencia_minima_minutos}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-600">
                                            minutos
                                        </p>
                                    </div>

                                    <div className="rounded-2xl bg-slate-950/60 p-5">
                                        <p className="text-sm text-slate-500">
                                            Antecedência máxima
                                        </p>

                                        <p className="mt-2 text-2xl font-bold">
                                            {configuracao.antecedencia_maxima_dias}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-600">
                                            dias
                                        </p>
                                    </div>

                                </div>
                            ) : (
                                <p className="text-slate-500">
                                    A configuração de agendamento ainda não foi definida.
                                </p>
                            )}

                        </div>
                    )}

                </div>
            </section>

            <Footer />
        </main>
    );
}