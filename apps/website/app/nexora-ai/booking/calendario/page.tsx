import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import ConfirmarMarcacaoButton from "./ConfirmarMarcacaoButton";
import CancelarMarcacaoButton from "./CancelarMarcacaoButton";
import ConcluirMarcacaoButton from "@/components/booking/ConcluirMarcacaoButton";

type Agendamento = {
    id: string;
    inicio: string;
    fim: string;
    estado: string;
    notas: string | null;
    clientes:
    | { nome: string }
    | { nome: string }[]
    | null;
    servicos:
    | { nome: string }
    | { nome: string }[]
    | null;
    profissionais:
    | { nome: string }
    | { nome: string }[]
    | null;
};

function obterDataLocalISO(date: Date, timeZone: string) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}

function formatarData(data: string, timeZone: string) {
    return new Intl.DateTimeFormat("pt-PT", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone,
    }).format(new Date(`${data}T12:00:00`));
}

function obterNome(
    valor:
        | { nome: string }
        | { nome: string }[]
        | null
) {
    if (!valor) return "—";

    return Array.isArray(valor)
        ? valor[0]?.nome ?? "—"
        : valor.nome;
}

function formatarHora(data: string, timeZone: string) {
    return new Intl.DateTimeFormat("pt-PT", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone,
    }).format(new Date(data));
}

function classeEstado(estado: string) {
    switch (estado) {
        case "confirmado":
            return "border-emerald-400/30 bg-emerald-400/10 text-emerald-400";

        case "pendente":
            return "border-amber-400/30 bg-amber-400/10 text-amber-400";

        case "cancelado":
            return "border-red-400/30 bg-red-400/10 text-red-400";

        case "concluido":
            return "border-sky-400/30 bg-sky-400/10 text-sky-400";

        default:
            return "border-slate-700 bg-slate-800 text-slate-400";
    }
}

function nomeEstado(estado: string) {
    switch (estado) {
        case "pendente":
            return "Pendente";

        case "confirmado":
            return "Confirmada";

        case "concluido":
            return "Concluída";

        case "cancelado":
            return "Cancelada";

        default:
            return estado;
    }
}

function adicionarDias(data: string, quantidade: number) {
    const [ano, mes, dia] = data.split("-").map(Number);

    const resultado = new Date(
        Date.UTC(ano, mes - 1, dia)
    );

    resultado.setUTCDate(
        resultado.getUTCDate() + quantidade
    );

    return resultado.toISOString().slice(0, 10);
}

export default async function NexoraBookingCalendarioPage({
    searchParams,
}: {
    searchParams: Promise<{
        data?: string;
    }>;
}) {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/nexora-ai/login");
    }

    // Empresa associada ao utilizador
    const { data: membro, error: membroError } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

    if (membroError || !membro) {
        redirect("/nexora-ai/login");
    }

    // Dados da empresa
    const { data: empresa, error: empresaError } = await supabase
        .from("companies")
        .select("id, name")
        .eq("id", membro.company_id)
        .single();

    if (empresaError || !empresa) {
        redirect("/nexora-ai/login");
    }

    // Configuração do Booking
    const { data: configuracao } = await supabase
        .from("configuracoes_agendamento")
        .select("fuso_horario")
        .eq("empresa_id", empresa.id)
        .maybeSingle();

    const timeZone =
        configuracao?.fuso_horario || "Europe/Lisbon";

    // Data atual no fuso da empresa
    const agora = new Date();

    const dataHoje = obterDataLocalISO(
        agora,
        timeZone
    );

    // Parâmetro da data selecionada
    const parametros = await searchParams;

    const dataInformada = parametros.data;

    // Aceita apenas datas no formato YYYY-MM-DD
    const dataValida =
        dataInformada &&
            /^\d{4}-\d{2}-\d{2}$/.test(dataInformada)
            ? dataInformada
            : dataHoje;

    const dataSelecionada = dataValida;

    const dataAnterior = adicionarDias(
        dataSelecionada,
        -1
    );

    const dataSeguinte = adicionarDias(
        dataSelecionada,
        1
    );

    const inicioDia = new Date(
        `${dataSelecionada}T00:00:00`
    );

    const fimDia = new Date(
        `${dataSelecionada}T23:59:59.999`
    );

    // Agendamentos do dia
    const {
        data: agendamentos,
        error: agendamentosError,
    } = await supabase
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
        .gte("inicio", inicioDia.toISOString())
        .lte("inicio", fimDia.toISOString())
        .order("inicio", {
            ascending: true,
        });

    const listaAgendamentos =
        (agendamentos ?? []) as unknown as Agendamento[];

    return (
        <main className="min-h-screen bg-slate-950 text-white">
            <section className="relative min-h-screen overflow-hidden px-6 py-12">
                <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

                <div className="relative z-10 mx-auto max-w-7xl">

                    {/* Cabeçalho */}

                    <div className="mb-10">
                        <Link
                            href="/nexora-ai/booking"
                            className="mb-6 inline-block text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
                        >
                            ← Voltar ao Booking
                        </Link>

                        <span className="block text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
                            Nexora Booking
                        </span>

                        <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">
                            Calendário
                        </h1>

                        <p className="mt-3 max-w-2xl text-slate-400">
                            Consulte as marcações da sua empresa de forma simples e organizada.
                        </p>
                    </div>

                    {/* Empresa */}

                    <div className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-xl">
                        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                                    Empresa
                                </p>

                                <h2 className="mt-2 text-3xl font-bold">
                                    {empresa.name}
                                </h2>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-5 py-4">
                                <p className="text-xs uppercase tracking-wider text-slate-500">
                                    Fuso horário
                                </p>

                                <p className="mt-1 font-semibold text-slate-200">
                                    {timeZone}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navegação do calendário */}

                    <div className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                            <div>
                                <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                                    Agenda do dia
                                </p>

                                <h2 className="mt-2 text-2xl font-bold capitalize">
                                    {formatarData(
                                        dataSelecionada,
                                        timeZone
                                    )}
                                </h2>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href="/nexora-ai/booking/calendario/nova"
                                    className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                                >
                                    + Nova marcação
                                </Link>

                                <Link
                                    href={`/nexora-ai/booking/calendario?data=${dataAnterior}`}
                                    className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/50 hover:text-cyan-400"
                                >
                                    ← Dia anterior
                                </Link>

                                <Link
                                    href={`/nexora-ai/booking/calendario?data=${dataHoje}`}
                                    className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-400 transition hover:bg-cyan-400/20"
                                >
                                    Hoje
                                </Link>

                                <Link
                                    href={`/nexora-ai/booking/calendario?data=${dataSeguinte}`}
                                    className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/50 hover:text-cyan-400"
                                >
                                    Dia seguinte →
                                </Link>

                            </div>
                        </div>
                    </div>

                    {/* Resumo */}

                    <div className="mb-8 grid gap-5 sm:grid-cols-3">

                        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                            <p className="text-sm text-slate-500">
                                Marcações
                            </p>

                            <p className="mt-2 text-3xl font-bold">
                                {listaAgendamentos.length}
                            </p>

                            <p className="mt-2 text-xs text-slate-600">
                                neste dia
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                            <p className="text-sm text-slate-500">
                                Confirmadas
                            </p>

                            <p className="mt-2 text-3xl font-bold text-emerald-400">
                                {
                                    listaAgendamentos.filter(
                                        (item) =>
                                            item.estado === "confirmado"
                                    ).length
                                }
                            </p>

                            <p className="mt-2 text-xs text-slate-600">
                                marcações confirmadas
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                            <p className="text-sm text-slate-500">
                                Pendentes
                            </p>

                            <p className="mt-2 text-3xl font-bold text-amber-400">
                                {
                                    listaAgendamentos.filter(
                                        (item) =>
                                            item.estado === "pendente"
                                    ).length
                                }
                            </p>

                            <p className="mt-2 text-xs text-slate-600">
                                aguardam confirmação
                            </p>
                        </div>

                    </div>

                    {/* Lista de marcações */}

                    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-7">

                        <div className="mb-6">
                            <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                                Marcações
                            </p>

                            <h2 className="mt-2 text-2xl font-bold">
                                Agenda diária
                            </h2>

                            <p className="mt-2 text-sm text-slate-500">
                                Todas as marcações previstas para este dia.
                            </p>
                        </div>

                        {agendamentosError ? (

                            <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6">
                                <p className="font-semibold text-red-400">
                                    Não foi possível carregar as marcações.
                                </p>

                                <p className="mt-2 text-sm text-slate-500">
                                    Tente atualizar a página.
                                </p>
                            </div>

                        ) : listaAgendamentos.length === 0 ? (

                            <div className="rounded-2xl border border-dashed border-slate-800 p-10 text-center">
                                <div className="text-5xl">
                                    📅
                                </div>

                                <p className="mt-5 text-lg font-semibold">
                                    Não existem marcações para este dia.
                                </p>

                                <p className="mt-2 text-sm text-slate-500">
                                    Quando houver agendamentos, eles aparecerão aqui.
                                </p>
                            </div>

                        ) : (

                            <div className="space-y-4">

                                {listaAgendamentos.map(
                                    (agendamento) => {
                                        const cliente =
                                            obterNome(
                                                agendamento.clientes
                                            );

                                        const servico =
                                            obterNome(
                                                agendamento.servicos
                                            );

                                        const profissional =
                                            obterNome(
                                                agendamento.profissionais
                                            );

                                        return (
                                            <div
                                                key={agendamento.id}
                                                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-lg shadow-black/10 transition hover:border-cyan-400/30"
                                            >
                                                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                                                    {/* Informação principal */}

                                                    <div className="flex items-center gap-5">

                                                        <div className="min-w-[100px]">
                                                            <p className="text-2xl font-bold text-cyan-400">
                                                                {formatarHora(
                                                                    agendamento.inicio,
                                                                    timeZone
                                                                )}
                                                            </p>

                                                            <p className="mt-1 text-xs text-slate-600">
                                                                até{" "}
                                                                {formatarHora(
                                                                    agendamento.fim,
                                                                    timeZone
                                                                )}
                                                            </p>
                                                        </div>

                                                        <div className="hidden h-12 w-px bg-slate-800 lg:block" />

                                                        <div>
                                                            <p className="text-lg font-bold">
                                                                {cliente}
                                                            </p>

                                                            <p className="mt-1 text-sm text-slate-400">
                                                                {servico}
                                                            </p>
                                                        </div>

                                                    </div>

                                                    {/* Estado e ações */}

                                                    <div className="flex flex-col gap-3 lg:items-end">

                                                        <p className="text-sm text-slate-400">
                                                            <span className="text-slate-600">
                                                                Profissional:
                                                            </span>{" "}
                                                            {profissional}
                                                        </p>

                                                        <span
                                                            className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${classeEstado(
                                                                agendamento.estado
                                                            )}`}
                                                        >
                                                            {nomeEstado(
                                                                agendamento.estado
                                                            )}
                                                        </span>

                                                        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-4">
                                                            {agendamento.estado === "pendente" && (
                                                                <ConfirmarMarcacaoButton agendamentoId={agendamento.id} />
                                                            )}

                                                            {(agendamento.estado === "pendente" ||
                                                                agendamento.estado === "confirmado") && (
                                                                    <>
                                                                        <CancelarMarcacaoButton agendamentoId={agendamento.id} />

                                                                        <Link
                                                                            href={`/nexora-ai/booking/calendario/editar/${agendamento.id}`}
                                                                            className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-400"
                                                                        >
                                                                            ✎ Editar
                                                                        </Link>
                                                                    </>
                                                                )}

                                                            {agendamento.estado === "confirmado" && (
                                                                <ConcluirMarcacaoButton agendamentoId={agendamento.id} />
                                                            )}
                                                        </div>

                                                    </div>

                                                </div>

                                                {agendamento.notas && (
                                                    <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                                                        <p className="text-xs uppercase tracking-wider text-slate-600">
                                                            Notas
                                                        </p>

                                                        <p className="mt-1 text-sm text-slate-400">
                                                            {agendamento.notas}
                                                        </p>
                                                    </div>
                                                )}

                                            </div>
                                        );
                                    }
                                )}

                            </div>
                        )}

                    </div>

                </div>
            </section>
        </main>
    );
}