import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import ConfirmarMarcacaoButton from "./ConfirmarMarcacaoButton";
import CancelarMarcacaoButton from "./CancelarMarcacaoButton";
import ConcluirMarcacaoButton from "@/components/booking/ConcluirMarcacaoButton";
import MarcacaoCalendarioButton from "./MarcacaoCalendarioButton";

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

type ViewMode = "dia" | "semana";

function obterDataLocalISO(
    date: Date,
    timeZone: string
) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}

function formatarData(
    data: string,
    timeZone: string
) {
    return new Intl.DateTimeFormat("pt-PT", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone,
    }).format(new Date(`${data}T12:00:00`));
}

function formatarDataCurta(
    data: string,
    timeZone: string
) {
    return new Intl.DateTimeFormat("pt-PT", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
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

function formatarHora(
    data: string,
    timeZone: string
) {
    return new Intl.DateTimeFormat("pt-PT", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone,
    }).format(new Date(data));
}

function classeEstado(estado: string) {
    switch (estado) {
        case "confirmado":
            return "border-emerald-400/40 bg-emerald-500/20 text-emerald-100";

        case "pendente":
            return "border-amber-400/40 bg-amber-500/20 text-amber-100";

        case "cancelado":
            return "border-red-400/40 bg-red-500/20 text-red-100";

        case "concluido":
            return "border-sky-400/40 bg-sky-500/20 text-sky-100";

        default:
            return "border-slate-600 bg-slate-700/50 text-slate-200";
    }
}

function classeEstadoCalendario(
    estado: string
) {
    switch (estado) {
        case "confirmado":
            return "border-emerald-400/50 bg-emerald-500/25 text-emerald-50";

        case "pendente":
            return "border-amber-400/50 bg-amber-500/25 text-amber-50";

        case "cancelado":
            return "border-red-400/50 bg-red-500/25 text-red-50";

        case "concluido":
            return "border-sky-400/50 bg-sky-500/25 text-sky-50";

        default:
            return "border-slate-600 bg-slate-700/60 text-slate-100";
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

function adicionarDias(
    data: string,
    quantidade: number
) {
    const [ano, mes, dia] = data
        .split("-")
        .map(Number);

    const resultado = new Date(
        Date.UTC(ano, mes - 1, dia)
    );

    resultado.setUTCDate(
        resultado.getUTCDate() + quantidade
    );

    return resultado
        .toISOString()
        .slice(0, 10);
}

function obterInicioSemana(data: string) {
    const [ano, mes, dia] = data
        .split("-")
        .map(Number);

    const resultado = new Date(
        Date.UTC(ano, mes - 1, dia)
    );

    const diaSemana = resultado.getUTCDay();

    const distanciaSegunda =
        diaSemana === 0
            ? -6
            : 1 - diaSemana;

    resultado.setUTCDate(
        resultado.getUTCDate() +
        distanciaSegunda
    );

    return resultado
        .toISOString()
        .slice(0, 10);
}

function obterHoraMinutos(
    data: string,
    timeZone: string
) {
    const partes =
        new Intl.DateTimeFormat("en-GB", {
            timeZone,
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
        }).formatToParts(new Date(data));

    const hora = Number(
        partes.find(
            (item) => item.type === "hour"
        )?.value ?? 0
    );

    const minuto = Number(
        partes.find(
            (item) => item.type === "minute"
        )?.value ?? 0
    );

    return hora * 60 + minuto;
}

function obterDataHoraLocal(
    data: string,
    timeZone: string
) {
    return obterDataLocalISO(
        new Date(data),
        timeZone
    );
}

function calcularPosicao(
    agendamento: Agendamento,
    timeZone: string,
    horaInicio: number,
    horaFim: number
) {
    const inicio =
        obterHoraMinutos(
            agendamento.inicio,
            timeZone
        );

    const fim =
        obterHoraMinutos(
            agendamento.fim,
            timeZone
        );

    const inicioEfetivo = Math.max(
        inicio,
        horaInicio * 60
    );

    const fimEfetivo = Math.min(
        Math.max(fim, inicioEfetivo + 30),
        horaFim * 60
    );

    const totalMinutos =
        (horaFim - horaInicio) * 60;

    const top =
        ((inicioEfetivo -
            horaInicio * 60) /
            totalMinutos) *
        100;

    const height =
        ((fimEfetivo -
            inicioEfetivo) /
            totalMinutos) *
        100;

    return {
        top,
        height: Math.max(height, 6.5),
    };
}

export default async function NexoraBookingCalendarioPage({
    searchParams,
}: {
    searchParams: Promise<{
        data?: string;
        view?: string;
    }>;
}) {
    const supabase =
        await createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/booking/login");
    }

    const {
        data: membro,
        error: membroError,
    } = await supabase
        .from("company_members")
        .select(
            "id, company_id, role, is_active, must_change_password"
        )
        .eq("user_id", user.id)
        .limit(1)
        .single();

    if (
        membroError ||
        !membro ||
        !membro.is_active
    ) {
        redirect("/booking/login");
    }

    if (membro.must_change_password) {
        redirect("/booking/alterar-password");
    }

    let permissoes: string[] = [];

    if (membro.role !== "admin") {
        const { data: permissoesData } =
            await supabase
                .from(
                    "company_member_permissions"
                )
                .select("permission")
                .eq(
                    "member_id",
                    membro.id
                );

        permissoes =
            permissoesData?.map(
                (item) => item.permission
            ) ?? [];
    }

    const isAdmin =
        membro.role === "admin";

    const temAgenda =
        isAdmin ||
        permissoes.includes("agenda");

    const temMarcacoes =
        isAdmin ||
        permissoes.includes("marcacoes");

    if (!temAgenda) {
        redirect("/nexora-ai/booking");
    }

    const {
        data: empresa,
        error: empresaError,
    } = await supabase
        .from("companies")
        .select("id, name")
        .eq("id", membro.company_id)
        .single();

    if (empresaError || !empresa) {
        redirect("/booking/login");
    }

    const { data: configuracao } =
        await supabase
            .from(
                "configuracoes_agendamento"
            )
            .select("fuso_horario")
            .eq(
                "empresa_id",
                empresa.id
            )
            .maybeSingle();

    const timeZone =
        configuracao?.fuso_horario ||
        "Europe/Lisbon";

    const agora = new Date();

    const dataHoje =
        obterDataLocalISO(
            agora,
            timeZone
        );

    const parametros =
        await searchParams;

    const dataInformada =
        parametros.data;

    const dataValida =
        dataInformada &&
            /^\d{4}-\d{2}-\d{2}$/.test(
                dataInformada
            )
            ? dataInformada
            : dataHoje;

    const view: ViewMode =
        parametros.view === "semana"
            ? "semana"
            : "dia";

    const dataSelecionada =
        dataValida;

    const inicioSemana =
        obterInicioSemana(
            dataSelecionada
        );

    const fimSemana =
        adicionarDias(
            inicioSemana,
            6
        );

    const dataAnterior =
        view === "semana"
            ? adicionarDias(
                inicioSemana,
                -7
            )
            : adicionarDias(
                dataSelecionada,
                -1
            );

    const dataSeguinte =
        view === "semana"
            ? adicionarDias(
                inicioSemana,
                7
            )
            : adicionarDias(
                dataSelecionada,
                1
            );

    /*
     * Procuramos uma janela ligeiramente maior
     * em UTC e depois filtramos as datas pelo
     * fuso horário da empresa.
     *
     * Isto evita problemas nos dias de mudança
     * para horário de verão/inverno.
     */
    const inicioBusca = new Date(
        `${inicioSemana}T00:00:00Z`
    );

    inicioBusca.setUTCDate(
        inicioBusca.getUTCDate() - 1
    );

    const fimBusca = new Date(
        `${fimSemana}T23:59:59.999Z`
    );

    fimBusca.setUTCDate(
        fimBusca.getUTCDate() + 1
    );

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
        .eq(
            "empresa_id",
            empresa.id
        )
        .gte(
            "inicio",
            inicioBusca.toISOString()
        )
        .lte(
            "inicio",
            fimBusca.toISOString()
        )
        .order("inicio", {
            ascending: true,
        });

    const todosAgendamentos =
        (agendamentos ??
            []) as unknown as Agendamento[];

    const agendamentosPeriodo =
        todosAgendamentos.filter(
            (agendamento) => {
                const dataLocal =
                    obterDataHoraLocal(
                        agendamento.inicio,
                        timeZone
                    );

                return (
                    dataLocal >=
                    inicioSemana &&
                    dataLocal <= fimSemana
                );
            }
        );

    const agendamentosDia =
        agendamentosPeriodo.filter(
            (agendamento) =>
                obterDataHoraLocal(
                    agendamento.inicio,
                    timeZone
                ) === dataSelecionada
        );

    const listaAgendamentos =
        view === "dia"
            ? agendamentosDia
            : agendamentosPeriodo;

    const horasInicio = 7;
    const horasFim = 22;
    const totalHoras =
        horasFim - horasInicio;

    const horas = Array.from(
        {
            length:
                totalHoras + 1,
        },
        (_, index) =>
            horasInicio + index
    );

    const diasSemana =
        Array.from(
            { length: 7 },
            (_, index) =>
                adicionarDias(
                    inicioSemana,
                    index
                )
        );

    const linkCalendario = (
        data: string,
        modo: ViewMode
    ) =>
        `/nexora-ai/booking/calendario?data=${data}&view=${modo}`;

    return (
        <main className="min-h-screen bg-slate-950 text-white">
            <section className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
                <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

                <div className="relative z-10 mx-auto max-w-[1600px]">
                    {/* Cabeçalho */}

                    <div className="mb-8">
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
                            Consulte e acompanhe as
                            marcações da sua empresa.
                        </p>
                    </div>

                    {/* Empresa */}

                    <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                                    Empresa
                                </p>

                                <h2 className="mt-2 text-2xl font-bold">
                                    {empresa.name}
                                </h2>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-5 py-3">
                                <p className="text-xs uppercase tracking-wider text-slate-500">
                                    Fuso horário
                                </p>

                                <p className="mt-1 font-semibold text-slate-200">
                                    {timeZone}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navegação */}

                    <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-5">
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                                    {view === "dia"
                                        ? "Agenda do dia"
                                        : "Agenda semanal"}
                                </p>

                                <h2 className="mt-2 text-xl font-bold capitalize sm:text-2xl">
                                    {view === "dia"
                                        ? formatarData(
                                            dataSelecionada,
                                            timeZone
                                        )
                                        : `${formatarDataCurta(
                                            inicioSemana,
                                            timeZone
                                        )} — ${formatarDataCurta(
                                            fimSemana,
                                            timeZone
                                        )}`}
                                </h2>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Link
                                    href={linkCalendario(
                                        dataSelecionada,
                                        "dia"
                                    )}
                                    className={`rounded-xl px-4 py-2 text-sm font-bold transition ${view ===
                                        "dia"
                                        ? "bg-cyan-400 text-slate-950"
                                        : "border border-slate-700 bg-slate-950 text-slate-300 hover:border-cyan-400/50 hover:text-cyan-400"
                                        }`}
                                >
                                    Dia
                                </Link>

                                <Link
                                    href={linkCalendario(
                                        inicioSemana,
                                        "semana"
                                    )}
                                    className={`rounded-xl px-4 py-2 text-sm font-bold transition ${view ===
                                        "semana"
                                        ? "bg-cyan-400 text-slate-950"
                                        : "border border-slate-700 bg-slate-950 text-slate-300 hover:border-cyan-400/50 hover:text-cyan-400"
                                        }`}
                                >
                                    Semana
                                </Link>

                                <Link
                                    href={linkCalendario(
                                        dataAnterior,
                                        view
                                    )}
                                    className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/50 hover:text-cyan-400"
                                >
                                    ←
                                </Link>

                                <Link
                                    href={linkCalendario(
                                        dataHoje,
                                        view
                                    )}
                                    className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-400 transition hover:bg-cyan-400/20"
                                >
                                    Hoje
                                </Link>

                                <Link
                                    href={linkCalendario(
                                        dataSeguinte,
                                        view
                                    )}
                                    className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/50 hover:text-cyan-400"
                                >
                                    →
                                </Link>

                                <Link
                                    href="/nexora-ai/booking/calendario/nova"
                                    className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                                >
                                    + Nova marcação
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Resumo */}

                    <div className="mb-6 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                            <p className="text-sm text-slate-500">
                                Marcações
                            </p>

                            <p className="mt-2 text-3xl font-bold">
                                {listaAgendamentos.length}
                            </p>

                            <p className="mt-1 text-xs text-slate-600">
                                {view === "dia"
                                    ? "neste dia"
                                    : "nesta semana"}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                            <p className="text-sm text-slate-500">
                                Confirmadas
                            </p>

                            <p className="mt-2 text-3xl font-bold text-emerald-400">
                                {
                                    listaAgendamentos.filter(
                                        (
                                            item
                                        ) =>
                                            item.estado ===
                                            "confirmado"
                                    ).length
                                }
                            </p>

                            <p className="mt-1 text-xs text-slate-600">
                                marcações confirmadas
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                            <p className="text-sm text-slate-500">
                                Pendentes
                            </p>

                            <p className="mt-2 text-3xl font-bold text-amber-400">
                                {
                                    listaAgendamentos.filter(
                                        (
                                            item
                                        ) =>
                                            item.estado ===
                                            "pendente"
                                    ).length
                                }
                            </p>

                            <p className="mt-1 text-xs text-slate-600">
                                aguardam confirmação
                            </p>
                        </div>
                    </div>

                    {/* Erro */}

                    {agendamentosError ? (
                        <div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-6">
                            <p className="font-semibold text-red-400">
                                Não foi possível
                                carregar as
                                marcações.
                            </p>

                            <p className="mt-2 text-sm text-slate-500">
                                Tente atualizar a
                                página.
                            </p>
                        </div>
                    ) : view === "semana" ? (
                        /* ==================================================
                           VISTA SEMANAL
                           ================================================== */

                        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900">
                            <div className="min-w-[1050px]">
                                {/* Cabeçalho dos dias */}

                                <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] border-b border-slate-800">
                                    <div className="border-r border-slate-800 p-3" />

                                    {diasSemana.map(
                                        (
                                            dia
                                        ) => {
                                            const eHoje =
                                                dia ===
                                                dataHoje;

                                            return (
                                                <Link
                                                    key={dia}
                                                    href={linkCalendario(dia, "dia")}
                                                    className={`border-r border-slate-800 p-3 text-center transition hover:bg-cyan-400/10 ${eHoje ? "bg-cyan-400/10" : ""
                                                        }`}
                                                    title={`Abrir agenda de ${formatarData(dia, timeZone)}`}
                                                >
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        {new Intl.DateTimeFormat("pt-PT", {
                                                            weekday: "short",
                                                        }).format(
                                                            new Date(`${dia}T12:00:00`)
                                                        )}
                                                    </p>

                                                    <p
                                                        className={`mt-1 text-lg font-bold ${eHoje
                                                            ? "text-cyan-400"
                                                            : "text-slate-200"
                                                            }`}
                                                    >
                                                        {new Intl.DateTimeFormat("pt-PT", {
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                        }).format(
                                                            new Date(`${dia}T12:00:00`)
                                                        )}
                                                    </p>
                                                </Link>
                                            );

                                        }
                                    )}
                                </div>

                                {/* Grelha */}

                                <div className="relative grid grid-cols-[72px_repeat(7,minmax(0,1fr))]">
                                    {/* Horas */}

                                    <div className="relative">
                                        {horas.map(
                                            (
                                                hora
                                            ) => (
                                                <div
                                                    key={
                                                        hora
                                                    }
                                                    className="h-[80px] border-b border-slate-800 px-2 pt-2 text-right text-xs font-semibold text-slate-600"
                                                >
                                                    {String(
                                                        hora
                                                    ).padStart(
                                                        2,
                                                        "0"
                                                    )}
                                                    :00
                                                </div>
                                            )
                                        )}
                                    </div>

                                    {/* Dias */}

                                    {diasSemana.map(
                                        (
                                            dia
                                        ) => {
                                            const agendamentosDiaSemana =
                                                agendamentosPeriodo.filter(
                                                    (
                                                        item
                                                    ) =>
                                                        obterDataHoraLocal(
                                                            item.inicio,
                                                            timeZone
                                                        ) ===
                                                        dia
                                                );

                                            return (
                                                <div
                                                    key={
                                                        dia
                                                    }
                                                    className={`relative border-l border-slate-800 ${dia ===
                                                        dataHoje
                                                        ? "bg-cyan-400/[0.025]"
                                                        : ""
                                                        }`}
                                                >
                                                    {horas.map(
                                                        (
                                                            hora
                                                        ) => (
                                                            <div
                                                                key={
                                                                    hora
                                                                }
                                                                className="h-[80px] border-b border-slate-800"
                                                            />
                                                        )
                                                    )}

                                                    {agendamentosDiaSemana.map(
                                                        (
                                                            agendamento
                                                        ) => {
                                                            const posicao =
                                                                calcularPosicao(
                                                                    agendamento,
                                                                    timeZone,
                                                                    horasInicio,
                                                                    horasFim
                                                                );

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
                                                                    className="absolute left-1 right-1"
                                                                    style={{
                                                                        top: `${posicao.top}%`,
                                                                        height: `${posicao.height}%`,
                                                                    }}
                                                                >
                                                                    <MarcacaoCalendarioButton
                                                                        id={agendamento.id}
                                                                        cliente={cliente}
                                                                        servico={servico}
                                                                        profissional={profissional}
                                                                        inicio={agendamento.inicio}
                                                                        fim={agendamento.fim}
                                                                        estado={agendamento.estado}
                                                                        notas={agendamento.notas}
                                                                        podeGerir={temMarcacoes}
                                                                    >
                                                                        <div
                                                                            className={`h-full overflow-hidden rounded-lg border p-2 text-xs shadow-lg transition hover:brightness-110 ${classeEstadoCalendario(
                                                                                agendamento.estado
                                                                            )}`}
                                                                        >
                                                                            <p className="truncate font-bold">
                                                                                {formatarHora(
                                                                                    agendamento.inicio,
                                                                                    timeZone
                                                                                )}{" "}
                                                                                —{" "}
                                                                                {formatarHora(
                                                                                    agendamento.fim,
                                                                                    timeZone
                                                                                )}
                                                                            </p>

                                                                            <p className="mt-1 line-clamp-2 break-words font-semibold leading-tight">
                                                                                {cliente}
                                                                            </p>

                                                                            <p className="line-clamp-2 break-words text-[11px] leading-tight opacity-80">
                                                                                {servico}
                                                                            </p>

                                                                            {posicao.height >= 7 && (
                                                                                <p className="line-clamp-1 break-words text-[10px] leading-tight opacity-70">
                                                                                    {profissional}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </MarcacaoCalendarioButton>
                                                                </div>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ==================================================
                           VISTA DIÁRIA
                           ================================================== */

                        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900">
                            <div className="min-w-[800px]">
                                <div className="grid grid-cols-[80px_minmax(0,1fr)] border-b border-slate-800">
                                    <div className="border-r border-slate-800 p-3" />

                                    <div className="p-4">
                                        <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                                            {formatarData(
                                                dataSelecionada,
                                                timeZone
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {listaAgendamentos.length ===
                                    0 ? (
                                    <div className="p-12 text-center">
                                        <div className="text-5xl">
                                            📅
                                        </div>

                                        <p className="mt-5 text-lg font-semibold">
                                            Não existem
                                            marcações
                                            para este
                                            dia.
                                        </p>

                                        <p className="mt-2 text-sm text-slate-500">
                                            Quando houver
                                            agendamentos,
                                            eles
                                            aparecerão
                                            aqui.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative grid grid-cols-[80px_minmax(0,1fr)]">
                                        <div>
                                            {horas.map(
                                                (
                                                    hora
                                                ) => (
                                                    <div
                                                        key={
                                                            hora
                                                        }
                                                        className="h-[90px] border-b border-r border-slate-800 px-2 pt-2 text-right text-xs font-semibold text-slate-600"
                                                    >
                                                        {String(
                                                            hora
                                                        ).padStart(
                                                            2,
                                                            "0"
                                                        )}
                                                        :00
                                                    </div>
                                                )
                                            )}
                                        </div>

                                        <div className="relative">
                                            {horas.map(
                                                (
                                                    hora
                                                ) => (
                                                    <div
                                                        key={
                                                            hora
                                                        }
                                                        className="h-[90px] border-b border-slate-800"
                                                    />
                                                )
                                            )}

                                            {listaAgendamentos.map(
                                                (
                                                    agendamento
                                                ) => {
                                                    const posicao =
                                                        calcularPosicao(
                                                            agendamento,
                                                            timeZone,
                                                            horasInicio,
                                                            horasFim
                                                        );

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
                                                            className="absolute left-2 right-2"
                                                            style={{
                                                                top: `${posicao.top}%`,
                                                                height: `${posicao.height}%`,
                                                            }}
                                                        >
                                                            <MarcacaoCalendarioButton
                                                                id={agendamento.id}
                                                                cliente={cliente}
                                                                servico={servico}
                                                                profissional={profissional}
                                                                inicio={agendamento.inicio}
                                                                fim={agendamento.fim}
                                                                estado={agendamento.estado}
                                                                notas={agendamento.notas}
                                                                podeGerir={temMarcacoes}
                                                            >
                                                                <div
                                                                    className={`h-full overflow-hidden rounded-xl border p-3 shadow-lg transition hover:brightness-110 ${classeEstadoCalendario(
                                                                        agendamento.estado
                                                                    )}`}
                                                                >
                                                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                                                        <div className="min-w-0">
                                                                            <p className="break-words text-base font-bold leading-tight">
                                                                                {cliente}
                                                                            </p>

                                                                            <p className="mt-1 break-words text-sm leading-tight opacity-90">
                                                                                {servico}
                                                                            </p>

                                                                            <p className="mt-1 break-words text-xs leading-tight opacity-70">
                                                                                Profissional: {profissional}
                                                                            </p>
                                                                        </div>

                                                                        <div className="shrink-0 lg:text-right">
                                                                            <p className="text-sm font-bold">
                                                                                {formatarHora(
                                                                                    agendamento.inicio,
                                                                                    timeZone
                                                                                )}{" "}
                                                                                —{" "}
                                                                                {formatarHora(
                                                                                    agendamento.fim,
                                                                                    timeZone
                                                                                )}
                                                                            </p>

                                                                            <p className="mt-1 text-xs font-semibold uppercase">
                                                                                {nomeEstado(
                                                                                    agendamento.estado
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    {agendamento.notas && (
                                                                        <div className="mt-3 rounded-lg border border-white/10 bg-black/10 p-2">
                                                                            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
                                                                                Notas
                                                                            </p>

                                                                            <p className="mt-1 text-xs opacity-80">
                                                                                {agendamento.notas}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </MarcacaoCalendarioButton>
                                                        </div>
                                                    );
                                                }
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Legenda */}

                    <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Estados
                        </span>

                        <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${classeEstado(
                                "pendente"
                            )}`}
                        >
                            Pendente
                        </span>

                        <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${classeEstado(
                                "confirmado"
                            )}`}
                        >
                            Confirmada
                        </span>

                        <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${classeEstado(
                                "concluido"
                            )}`}
                        >
                            Concluída
                        </span>

                        <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${classeEstado(
                                "cancelado"
                            )}`}
                        >
                            Cancelada
                        </span>
                    </div>
                </div>
            </section>
        </main>
    );
}