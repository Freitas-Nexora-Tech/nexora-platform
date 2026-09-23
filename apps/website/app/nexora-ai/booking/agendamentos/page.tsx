import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import ConfirmarMarcacaoButton from "../calendario/ConfirmarMarcacaoButton";
import CancelarMarcacaoButton from "../calendario/CancelarMarcacaoButton";
import ConcluirMarcacaoButton from "@/components/booking/ConcluirMarcacaoButton";

type Agendamento = {
    id: string;
    cliente_id: string;
    servico_id: string;
    profissional_id: string;
    inicio: string;
    fim: string;
    valor: number | null;
    estado: string;
    notas: string | null;
    cliente: {
        nome: string;
    }[] | null;
    servico: {
        nome: string;
    }[] | null;
    profissional: {
        nome: string;
    }[] | null;
};

type ItemFiltro = {
    id: string;
    nome: string;
};

type SearchParams = {
    cliente?: string;
    dataInicio?: string;
    dataFim?: string;
    estado?: string;
    profissional?: string;
    servico?: string;
};

function formatarData(data: string) {
    return new Intl.DateTimeFormat("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(data));
}

function estadoLabel(estado: string) {
    switch (estado) {
        case "pendente":
            return "Pendente";

        case "confirmado":
            return "Confirmado";

        case "concluido":
            return "Concluído";

        case "cancelado":
            return "Cancelado";

        default:
            return estado;
    }
}

function estadoClasses(estado: string) {
    switch (estado) {
        case "pendente":
            return "border-amber-400/30 bg-amber-400/10 text-amber-400";

        case "confirmado":
            return "border-emerald-400/30 bg-emerald-400/10 text-emerald-400";

        case "concluido":
            return "border-sky-400/30 bg-sky-400/10 text-sky-400";

        case "cancelado":
            return "border-red-400/30 bg-red-400/10 text-red-400";

        default:
            return "border-slate-700 bg-slate-900 text-slate-400";
    }
}

export default async function AgendamentosPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;

    const clienteFiltro = params.cliente?.trim() ?? "";
    const dataInicioFiltro = params.dataInicio ?? "";
    const dataFimFiltro = params.dataFim ?? "";
    const estadoFiltro = params.estado ?? "";
    const profissionalFiltro = params.profissional ?? "";
    const servicoFiltro = params.servico ?? "";

    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/booking/login");
    }

    // Membro da empresa + controlo de acesso
    const { data: membro, error: membroError } = await supabase
        .from("company_members")
        .select(
            "id, company_id, role, is_active, must_change_password"
        )
        .eq("user_id", user.id)
        .limit(1)
        .single();

    if (
        membroError ||
        !membro?.company_id ||
        !membro.is_active
    ) {
        redirect("/booking/login");
    }

    if (membro.must_change_password) {
        redirect("/booking/alterar-password");
    }

    // Admin tem acesso total.
    // Funcionário precisa da permissão "marcacoes".
    let podeGerirMarcacoes = membro.role === "admin";

    if (!podeGerirMarcacoes) {
        const { data: permissaoMarcacoes } = await supabase
            .from("company_member_permissions")
            .select("permission")
            .eq("member_id", membro.id)
            .eq("permission", "marcacoes")
            .maybeSingle();

        podeGerirMarcacoes = !!permissaoMarcacoes;
    }

    if (!podeGerirMarcacoes) {
        redirect("/nexora-ai/booking");
    }

    const { data: empresa } = await supabase
        .from("companies")
        .select("id, name")
        .eq("id", membro.company_id)
        .single();

    const [
        { data: profissionaisDisponiveis },
        { data: servicosDisponiveis },
    ] = await Promise.all([
        supabase
            .from("profissionais")
            .select("id, nome")
            .eq("empresa_id", membro.company_id)
            .eq("ativo", true)
            .order("nome", {
                ascending: true,
            }),

        supabase
            .from("servicos")
            .select("id, nome")
            .eq("empresa_id", membro.company_id)
            .eq("ativo", true)
            .order("nome", {
                ascending: true,
            }),
    ]);

    const profissionais =
        (profissionaisDisponiveis ?? []) as ItemFiltro[];

    const servicos =
        (servicosDisponiveis ?? []) as ItemFiltro[];

    let clienteIdsFiltro: string[] | null = null;

    if (clienteFiltro) {
        const { data: clientesFiltrados } =
            await supabase
                .from("clientes")
                .select("id")
                .eq("empresa_id", membro.company_id)
                .ilike(
                    "nome",
                    `%${clienteFiltro}%`
                );

        clienteIdsFiltro =
            clientesFiltrados?.map(
                (cliente) => cliente.id
            ) ?? [];

        if (clienteIdsFiltro.length === 0) {
            clienteIdsFiltro = [
                "00000000-0000-0000-0000-000000000000",
            ];
        }
    }

    let query = supabase
        .from("agendamentos")
        .select(
            `
            id,
            cliente_id,
            servico_id,
            profissional_id,
            inicio,
            fim,
            valor,
            estado,
            notas
            `
        )
        .eq("empresa_id", membro.company_id);

    if (clienteIdsFiltro) {
        query = query.in(
            "cliente_id",
            clienteIdsFiltro
        );
    }

    if (profissionalFiltro) {
        query = query.eq(
            "profissional_id",
            profissionalFiltro
        );
    }

    if (servicoFiltro) {
        query = query.eq(
            "servico_id",
            servicoFiltro
        );
    }

    if (dataInicioFiltro) {
        query = query.gte(
            "inicio",
            `${dataInicioFiltro}T00:00:00`
        );
    }

    if (dataFimFiltro) {
        const dataFim = new Date(
            `${dataFimFiltro}T00:00:00`
        );

        dataFim.setDate(
            dataFim.getDate() + 1
        );

        query = query.lt(
            "inicio",
            dataFim.toISOString()
        );
    }

    if (
        estadoFiltro &&
        [
            "pendente",
            "confirmado",
            "concluido",
            "cancelado",
        ].includes(estadoFiltro)
    ) {
        query = query.eq(
            "estado",
            estadoFiltro
        );
    }

    const {
        data: agendamentos,
        error,
    } = await query.order("inicio", {
        ascending: true,
    });

    let listaAgendamentos: Agendamento[] = [];

    if (!error && agendamentos) {
        const clienteIds = [
            ...new Set(
                agendamentos.map(
                    (agendamento) =>
                        agendamento.cliente_id
                )
            ),
        ];

        const servicoIds = [
            ...new Set(
                agendamentos.map(
                    (agendamento) =>
                        agendamento.servico_id
                )
            ),
        ];

        const profissionalIds = [
            ...new Set(
                agendamentos.map(
                    (agendamento) =>
                        agendamento.profissional_id
                )
            ),
        ];

        const [
            { data: clientes },
            { data: servicosRelacionados },
            { data: profissionaisRelacionados },
        ] = await Promise.all([
            clienteIds.length > 0
                ? supabase
                    .from("clientes")
                    .select("id, nome")
                    .eq(
                        "empresa_id",
                        membro.company_id
                    )
                    .in("id", clienteIds)
                : Promise.resolve({
                    data: [],
                }),

            servicoIds.length > 0
                ? supabase
                    .from("servicos")
                    .select("id, nome")
                    .eq(
                        "empresa_id",
                        membro.company_id
                    )
                    .in("id", servicoIds)
                : Promise.resolve({
                    data: [],
                }),

            profissionalIds.length > 0
                ? supabase
                    .from("profissionais")
                    .select("id, nome")
                    .eq(
                        "empresa_id",
                        membro.company_id
                    )
                    .in("id", profissionalIds)
                : Promise.resolve({
                    data: [],
                }),
        ]);

        const clientesMap = new Map(
            (clientes ?? []).map((cliente) => [
                cliente.id,
                cliente.nome,
            ])
        );

        const servicosMap = new Map(
            (servicosRelacionados ?? []).map(
                (servico) => [
                    servico.id,
                    servico.nome,
                ]
            )
        );

        const profissionaisMap = new Map(
            (profissionaisRelacionados ?? []).map(
                (profissional) => [
                    profissional.id,
                    profissional.nome,
                ]
            )
        );

        listaAgendamentos =
            agendamentos.map(
                (agendamento) => ({
                    ...agendamento,
                    cliente: [
                        {
                            nome:
                                clientesMap.get(
                                    agendamento.cliente_id
                                ) ??
                                "Cliente",
                        },
                    ],
                    servico: [
                        {
                            nome:
                                servicosMap.get(
                                    agendamento.servico_id
                                ) ??
                                "Serviço",
                        },
                    ],
                    profissional: [
                        {
                            nome:
                                profissionaisMap.get(
                                    agendamento.profissional_id
                                ) ??
                                "Profissional",
                        },
                    ],
                })
            ) as Agendamento[];
    }

    const temFiltros =
        Boolean(
            clienteFiltro ||
            dataInicioFiltro ||
            dataFimFiltro ||
            estadoFiltro ||
            profissionalFiltro ||
            servicoFiltro
        );

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
            <div className="mx-auto max-w-6xl">
                <Link
                    href="/nexora-ai/booking"
                    className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
                >
                    ← Voltar ao Booking
                </Link>

                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                            Nexora Booking
                        </p>

                        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                            Agendamentos
                        </h1>

                        <p className="mt-2 text-slate-400">
                            Consulte e gira todas as marcações da empresa.
                        </p>

                        {empresa?.name && (
                            <p className="mt-3 text-sm text-slate-500">
                                Empresa: {empresa.name}
                            </p>
                        )}
                    </div>

                    <Link
                        href="/nexora-ai/booking/calendario/nova"
                        className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                    >
                        + Nova marcação
                    </Link>
                </div>

                <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                    <div className="mb-5">
                        <h2 className="text-lg font-bold text-slate-200">
                            Filtrar agendamentos
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Encontre rapidamente uma marcação por cliente,
                            período, profissional, serviço ou estado.
                        </p>
                    </div>

                    <form
                        method="GET"
                        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
                    >
                        <div>
                            <label
                                htmlFor="cliente"
                                className="mb-2 block text-sm font-medium text-slate-300"
                            >
                                Cliente
                            </label>

                            <input
                                id="cliente"
                                name="cliente"
                                type="text"
                                defaultValue={clienteFiltro}
                                placeholder="Nome do cliente"
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="dataInicio"
                                className="mb-2 block text-sm font-medium text-slate-300"
                            >
                                Data inicial
                            </label>

                            <input
                                id="dataInicio"
                                name="dataInicio"
                                type="date"
                                defaultValue={dataInicioFiltro}
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="dataFim"
                                className="mb-2 block text-sm font-medium text-slate-300"
                            >
                                Data final
                            </label>

                            <input
                                id="dataFim"
                                name="dataFim"
                                type="date"
                                defaultValue={dataFimFiltro}
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="estado"
                                className="mb-2 block text-sm font-medium text-slate-300"
                            >
                                Estado
                            </label>

                            <select
                                id="estado"
                                name="estado"
                                defaultValue={estadoFiltro}
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                            >
                                <option value="">
                                    Todos os estados
                                </option>

                                <option value="pendente">
                                    Pendente
                                </option>

                                <option value="confirmado">
                                    Confirmado
                                </option>

                                <option value="concluido">
                                    Concluído
                                </option>

                                <option value="cancelado">
                                    Cancelado
                                </option>
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="profissional"
                                className="mb-2 block text-sm font-medium text-slate-300"
                            >
                                Profissional
                            </label>

                            <select
                                id="profissional"
                                name="profissional"
                                defaultValue={profissionalFiltro}
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                            >
                                <option value="">
                                    Todos os profissionais
                                </option>

                                {profissionais.map(
                                    (profissional) => (
                                        <option
                                            key={
                                                profissional.id
                                            }
                                            value={
                                                profissional.id
                                            }
                                        >
                                            {
                                                profissional.nome
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="servico"
                                className="mb-2 block text-sm font-medium text-slate-300"
                            >
                                Serviço
                            </label>

                            <select
                                id="servico"
                                name="servico"
                                defaultValue={servicoFiltro}
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                            >
                                <option value="">
                                    Todos os serviços
                                </option>

                                {servicos.map(
                                    (servico) => (
                                        <option
                                            key={servico.id}
                                            value={servico.id}
                                        >
                                            {servico.nome}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div className="flex flex-wrap items-end gap-2 md:col-span-2 lg:col-span-2">
                            <button
                                type="submit"
                                className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                            >
                                🔎 Pesquisar
                            </button>

                            {temFiltros && (
                                <Link
                                    href="/nexora-ai/booking/agendamentos"
                                    className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
                                >
                                    Limpar filtros
                                </Link>
                            )}
                        </div>
                    </form>
                </div>

                <div className="mt-8">
                    {error ? (
                        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-sm text-red-400">
                            Não foi possível carregar os agendamentos.
                        </div>
                    ) : listaAgendamentos.length > 0 ? (
                        <div className="space-y-4">
                            {listaAgendamentos.map(
                                (agendamento) => (
                                    <div
                                        key={agendamento.id}
                                        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/10"
                                    >
                                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <p className="text-2xl font-bold text-cyan-400">
                                                        {formatarData(
                                                            agendamento.inicio
                                                        )}
                                                    </p>

                                                    <span
                                                        className={`rounded-full border px-3 py-1 text-xs font-bold ${estadoClasses(
                                                            agendamento.estado
                                                        )}`}
                                                    >
                                                        {estadoLabel(
                                                            agendamento.estado
                                                        )}
                                                    </span>
                                                </div>

                                                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                                                    <div>
                                                        <p className="text-xs uppercase tracking-wider text-slate-600">
                                                            Cliente
                                                        </p>

                                                        <p className="mt-1 font-semibold text-slate-200">
                                                            {agendamento.cliente?.[0]
                                                                ?.nome ??
                                                                "Cliente"}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs uppercase tracking-wider text-slate-600">
                                                            Serviço
                                                        </p>

                                                        <p className="mt-1 font-semibold text-slate-200">
                                                            {agendamento.servico?.[0]
                                                                ?.nome ??
                                                                "Serviço"}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs uppercase tracking-wider text-slate-600">
                                                            Profissional
                                                        </p>

                                                        <p className="mt-1 font-semibold text-slate-200">
                                                            {agendamento.profissional?.[0]
                                                                ?.nome ??
                                                                "Profissional"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 flex-wrap gap-2">
                                                {agendamento.estado ===
                                                    "pendente" && (
                                                        <ConfirmarMarcacaoButton
                                                            agendamentoId={
                                                                agendamento.id
                                                            }
                                                        />
                                                    )}

                                                {(agendamento.estado === "pendente" ||
                                                    agendamento.estado === "confirmado") && (
                                                        <CancelarMarcacaoButton
                                                            agendamentoId={agendamento.id}
                                                        />
                                                    )}

                                                {agendamento.estado === "confirmado" && (
                                                    <ConcluirMarcacaoButton
                                                        agendamentoId={agendamento.id}
                                                    />
                                                )}

                                                <Link
                                                    href={`/nexora-ai/booking/calendario/editar/${agendamento.id}`}
                                                    className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-400"
                                                >
                                                    ✎ Editar
                                                </Link>
                                            </div>
                                        </div>

                                        <div className="mt-5 border-t border-slate-800 pt-4">
                                            <div className="grid gap-4 sm:grid-cols-3">
                                                <div>
                                                    <p className="text-xs uppercase tracking-wider text-slate-600">
                                                        Valor
                                                    </p>

                                                    <p className="mt-1 text-lg font-bold text-emerald-400">
                                                        {agendamento.valor !== null
                                                            ? new Intl.NumberFormat("pt-PT", {
                                                                style: "currency",
                                                                currency: "EUR",
                                                            }).format(agendamento.valor)
                                                            : "—"}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs uppercase tracking-wider text-slate-600">
                                                        Fim
                                                    </p>

                                                    <p className="mt-1 text-sm text-slate-400">
                                                        {formatarData(
                                                            agendamento.fim
                                                        )}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs uppercase tracking-wider text-slate-600">
                                                        Notas
                                                    </p>

                                                    <p className="mt-1 text-sm text-slate-400">
                                                        {agendamento.notas ||
                                                            "Sem notas"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center">
                            <div className="text-5xl">
                                📅
                            </div>

                            <h2 className="mt-5 text-lg font-bold text-slate-200">
                                {temFiltros
                                    ? "Nenhum agendamento encontrado"
                                    : "Ainda não existem agendamentos"}
                            </h2>

                            <p className="mt-2 text-sm text-slate-500">
                                {temFiltros
                                    ? "Tente alterar os filtros de pesquisa."
                                    : "Crie uma marcação para começar a utilizar a agenda."}
                            </p>

                            {!temFiltros && (
                                <Link
                                    href="/nexora-ai/booking/calendario/nova"
                                    className="mt-5 inline-flex items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                                >
                                    + Nova marcação
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}