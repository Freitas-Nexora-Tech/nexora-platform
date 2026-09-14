import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type AgendamentoFinanceiro = {
    id: string;
    inicio: string;
    valor: number | null;
    cliente_id: string;
    servico_id: string;
};

type NomeMap = Map<string, string>;

type HistoricoMensal = {
    ano: number;
    mes: number;
    chave: string;
    nome: string;
    receita: number;
    quantidade: number;
};

function formatarMoeda(valor: number) {
    return new Intl.NumberFormat("pt-PT", {
        style: "currency",
        currency: "EUR",
    }).format(valor);
}

function formatarData(data: string, fusoHorario: string) {
    return new Intl.DateTimeFormat("pt-PT", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: fusoHorario,
    }).format(new Date(data));
}

function obterAnoMesAtual(fusoHorario: string) {
    const partes = new Intl.DateTimeFormat("en-US", {
        timeZone: fusoHorario,
        year: "numeric",
        month: "2-digit",
    }).formatToParts(new Date());

    const ano = Number(
        partes.find((parte) => parte.type === "year")?.value
    );

    const mes = Number(
        partes.find((parte) => parte.type === "month")?.value
    );

    return { ano, mes };
}

function obterAnoMes(
    data: string,
    fusoHorario: string
) {
    const partes = new Intl.DateTimeFormat("en-US", {
        timeZone: fusoHorario,
        year: "numeric",
        month: "2-digit",
    }).formatToParts(new Date(data));

    return {
        ano: Number(
            partes.find((parte) => parte.type === "year")?.value
        ),
        mes: Number(
            partes.find((parte) => parte.type === "month")?.value
        ),
    };
}

function criarHistoricoAno(
    lista: AgendamentoFinanceiro[],
    ano: number,
    fusoHorario: string
): HistoricoMensal[] {
    const historico: HistoricoMensal[] = [];

    const formatadorMes = new Intl.DateTimeFormat("pt-PT", {
        month: "long",
        year: "numeric",
        timeZone: fusoHorario,
    });

    for (let mes = 1; mes <= 12; mes++) {
        const dataReferencia = new Date(
            Date.UTC(ano, mes - 1, 1)
        );

        const agendamentosDoMes = lista.filter(
            (agendamento) => {
                const data = obterAnoMes(
                    agendamento.inicio,
                    fusoHorario
                );

                return (
                    data.ano === ano &&
                    data.mes === mes
                );
            }
        );

        const receita = agendamentosDoMes.reduce(
            (total, agendamento) =>
                total + Number(agendamento.valor ?? 0),
            0
        );

        const nome = formatadorMes.format(
            dataReferencia
        );

        historico.push({
            ano,
            mes,
            chave: `${ano}-${String(mes).padStart(2, "0")}`,
            nome:
                nome.charAt(0).toUpperCase() +
                nome.slice(1),
            receita,
            quantidade: agendamentosDoMes.length,
        });
    }

    return historico;
}

function criarHistorico12Meses(
    lista: AgendamentoFinanceiro[],
    anoAtual: number,
    mesAtual: number,
    fusoHorario: string
): HistoricoMensal[] {
    const historico: HistoricoMensal[] = [];

    const formatadorMes = new Intl.DateTimeFormat("pt-PT", {
        month: "long",
        year: "numeric",
        timeZone: fusoHorario,
    });

    for (let i = 11; i >= 0; i--) {
        const dataReferencia = new Date(
            Date.UTC(anoAtual, mesAtual - 1 - i, 1)
        );

        const ano = dataReferencia.getUTCFullYear();
        const mes = dataReferencia.getUTCMonth() + 1;

        const agendamentosDoMes = lista.filter(
            (agendamento) => {
                const data = obterAnoMes(
                    agendamento.inicio,
                    fusoHorario
                );

                return (
                    data.ano === ano &&
                    data.mes === mes
                );
            }
        );

        const receita = agendamentosDoMes.reduce(
            (total, agendamento) =>
                total + Number(agendamento.valor ?? 0),
            0
        );

        const nome = formatadorMes.format(
            dataReferencia
        );

        historico.push({
            ano,
            mes,
            chave: `${ano}-${String(mes).padStart(2, "0")}`,
            nome:
                nome.charAt(0).toUpperCase() +
                nome.slice(1),
            receita,
            quantidade: agendamentosDoMes.length,
        });
    }

    return historico;
}

type FinanceiroPageProps = {
    searchParams: Promise<{
        ano?: string;
    }>;
};

export default async function FinanceiroPage({
    searchParams,
}: FinanceiroPageProps) {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/nexora-ai/login");
    }

    const { data: membro } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

    if (!membro?.company_id) {
        redirect("/nexora-ai/booking");
    }

    const { data: empresa } = await supabase
        .from("companies")
        .select("id, name")
        .eq("id", membro.company_id)
        .single();

    if (!empresa) {
        redirect("/nexora-ai/booking");
    }

    const { data: configuracao } = await supabase
        .from("configuracoes_agendamento")
        .select("fuso_horario")
        .eq("empresa_id", membro.company_id)
        .maybeSingle();

    const fusoHorario =
        configuracao?.fuso_horario ||
        "Europe/Lisbon";

    const {
        ano: anoAtual,
        mes: mesAtual,
    } = obterAnoMesAtual(fusoHorario);

    const { data: agendamentos, error } = await supabase
        .from("agendamentos")
        .select(
            "id, inicio, valor, cliente_id, servico_id"
        )
        .eq("empresa_id", membro.company_id)
        .eq("estado", "concluido")
        .order("inicio", {
            ascending: false,
        });

    if (error) {
        return (
            <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
                <div className="mx-auto max-w-6xl">
                    <Link
                        href="/nexora-ai/booking"
                        className="text-sm font-medium text-cyan-400"
                    >
                        ← Voltar ao Booking
                    </Link>

                    <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-red-400">
                        Não foi possível carregar os dados financeiros.
                    </div>
                </div>
            </main>
        );
    }

    const lista =
        (agendamentos ?? []) as AgendamentoFinanceiro[];

    /*
     * 9K.3
     *
     * O ano pode ser escolhido através da URL:
     *
     * /nexora-ai/booking/financeiro?ano=2026
     *
     * Se não existir ano selecionado, usamos o ano atual.
     */
    const parametros = await searchParams;

    const anoSelecionado =
        parametros.ano &&
        /^\d{4}$/.test(parametros.ano)
            ? Number(parametros.ano)
            : anoAtual;

    /*
     * Proteção contra anos inválidos.
     */
    const anoFinanceiro =
        anoSelecionado >= 2000 &&
        anoSelecionado <= anoAtual + 1
            ? anoSelecionado
            : anoAtual;

    const concluidosEsteMes = lista.filter(
        (agendamento) => {
            const data = obterAnoMes(
                agendamento.inicio,
                fusoHorario
            );

            return (
                data.ano === anoAtual &&
                data.mes === mesAtual
            );
        }
    );

    const concluidosEsteAno = lista.filter(
        (agendamento) => {
            const data = obterAnoMes(
                agendamento.inicio,
                fusoHorario
            );

            return data.ano === anoAtual;
        }
    );

    const concluidosAnoSelecionado = lista.filter(
        (agendamento) => {
            const data = obterAnoMes(
                agendamento.inicio,
                fusoHorario
            );

            return data.ano === anoFinanceiro;
        }
    );

    const caixaMes = concluidosEsteMes.reduce(
        (total, agendamento) =>
            total +
            Number(agendamento.valor ?? 0),
        0
    );

    const caixaAno = concluidosEsteAno.reduce(
        (total, agendamento) =>
            total +
            Number(agendamento.valor ?? 0),
        0
    );

    /*
     * 9K.2 — HISTÓRICO DOS ÚLTIMOS 12 MESES
     */
    const historico12Meses =
        criarHistorico12Meses(
            lista,
            anoAtual,
            mesAtual,
            fusoHorario
        );

    /*
     * 9K.3 — VISÃO ANUAL
     *
     * Criamos sempre Janeiro → Dezembro,
     * mesmo quando um mês não tem movimento.
     */
    const historicoAno =
        criarHistoricoAno(
            lista,
            anoFinanceiro,
            fusoHorario
        );

    const receitaAno = historicoAno.reduce(
        (total, mes) =>
            total + mes.receita,
        0
    );

    const quantidadeAno = historicoAno.reduce(
        (total, mes) =>
            total + mes.quantidade,
        0
    );

    /*
     * Média mensal:
     *
     * receita anual ÷ 12
     *
     * Mesmo que alguns meses tenham €0,00.
     */
    const mediaMensal =
        receitaAno / 12;

    const mesesComReceita =
        historicoAno.filter(
            (mes) => mes.receita > 0
        );

    const melhorMes =
        mesesComReceita.length > 0
            ? mesesComReceita.reduce(
                  (melhor, mes) =>
                      mes.receita >
                      melhor.receita
                          ? mes
                          : melhor
              )
            : null;

    const piorMes =
        mesesComReceita.length > 0
            ? mesesComReceita.reduce(
                  (pior, mes) =>
                      mes.receita <
                      pior.receita
                          ? mes
                          : pior
              )
            : null;

    const maiorReceitaAno =
        Math.max(
            ...historicoAno.map(
                (mes) => mes.receita
            ),
            0
        );

    const maiorReceita12Meses =
        Math.max(
            ...historico12Meses.map(
                (mes) => mes.receita
            ),
            0
        );

    /*
     * Criamos a lista de anos disponíveis.
     *
     * O ano atual aparece sempre.
     */
    const anosDisponiveis = [
        ...new Set([
            anoAtual,
            ...lista.map(
                (agendamento) =>
                    obterAnoMes(
                        agendamento.inicio,
                        fusoHorario
                    ).ano
            ),
        ]),
    ]
        .filter(
            (ano) =>
                ano >= 2000 &&
                ano <= anoAtual + 1
        )
        .sort((a, b) => b - a);

    const clienteIds = [
        ...new Set(
            concluidosEsteMes.map(
                (agendamento) =>
                    agendamento.cliente_id
            )
        ),
    ];

    const servicoIds = [
        ...new Set(
            concluidosEsteMes.map(
                (agendamento) =>
                    agendamento.servico_id
            )
        ),
    ];

    const [
        { data: clientes },
        { data: servicos },
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
    ]);

    const clientesMap: NomeMap = new Map(
        (clientes ?? []).map(
            (cliente) => [
                cliente.id,
                cliente.nome,
            ]
        )
    );

    const servicosMap: NomeMap = new Map(
        (servicos ?? []).map(
            (servico) => [
                servico.id,
                servico.nome,
            ]
        )
    );

    const nomeMes = new Intl.DateTimeFormat(
        "pt-PT",
        {
            month: "long",
            timeZone: fusoHorario,
        }
    ).format(new Date());

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
            <div className="mx-auto max-w-6xl">
                <Link
                    href="/nexora-ai/booking"
                    className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
                >
                    ← Voltar ao Booking
                </Link>

                <div className="mt-6">
                    <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                        Nexora Booking
                    </p>

                    <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                        Financeiro
                    </h1>

                    <p className="mt-2 text-slate-400">
                        Acompanhe o caixa gerado pelas marcações concluídas.
                    </p>

                    {empresa.name && (
                        <p className="mt-3 text-sm text-slate-500">
                            Empresa: {empresa.name}
                        </p>
                    )}
                </div>

                {/* RESUMO ATUAL */}
                <div className="mt-8 grid gap-5 md:grid-cols-2">
                    <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-7">
                        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
                            Caixa deste mês
                        </p>

                        <p className="mt-3 text-4xl font-extrabold">
                            {formatarMoeda(caixaMes)}
                        </p>

                        <p className="mt-3 text-sm text-slate-400">
                            {concluidosEsteMes.length}{" "}
                            {concluidosEsteMes.length === 1
                                ? "marcação concluída"
                                : "marcações concluídas"}{" "}
                            em {nomeMes}.
                        </p>
                    </div>

                    <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-7">
                        <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                            Caixa deste ano
                        </p>

                        <p className="mt-3 text-4xl font-extrabold">
                            {formatarMoeda(caixaAno)}
                        </p>

                        <p className="mt-3 text-sm text-slate-400">
                            {concluidosEsteAno.length}{" "}
                            {concluidosEsteAno.length === 1
                                ? "marcação concluída"
                                : "marcações concluídas"}{" "}
                            em {anoAtual}.
                        </p>
                    </div>
                </div>

                {/* 9K.2 — HISTÓRICO DOS 12 MESES */}
                <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-7">
                    <div className="mb-7">
                        <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                            Histórico financeiro
                        </p>

                        <h2 className="mt-2 text-2xl font-bold">
                            Últimos 12 meses
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            Receita gerada exclusivamente por marcações concluídas.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {historico12Meses.map(
                            (mes) => {
                                const atual =
                                    mes.ano ===
                                        anoAtual &&
                                    mes.mes ===
                                        mesAtual;

                                const larguraBarra =
                                    maiorReceita12Meses >
                                    0
                                        ? Math.max(
                                              (mes.receita /
                                                  maiorReceita12Meses) *
                                                  100,
                                              mes.receita >
                                                  0
                                                  ? 3
                                                  : 0
                                          )
                                        : 0;

                                return (
                                    <div
                                        key={mes.chave}
                                        className={`rounded-2xl border p-5 ${
                                            atual
                                                ? "border-cyan-400/30 bg-cyan-400/5"
                                                : "border-slate-800 bg-slate-950/40"
                                        }`}
                                    >
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <p className="font-bold text-slate-200">
                                                        {mes.nome}
                                                    </p>

                                                    {atual && (
                                                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-400">
                                                            Mês atual
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                                                    <div
                                                        className="h-full rounded-full bg-emerald-400 transition-all"
                                                        style={{
                                                            width: `${larguraBarra}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="text-left sm:min-w-[170px] sm:text-right">
                                                <p className="text-xl font-extrabold text-emerald-400">
                                                    {formatarMoeda(
                                                        mes.receita
                                                    )}
                                                </p>

                                                <p className="mt-1 text-sm text-slate-500">
                                                    {mes.quantidade}{" "}
                                                    {mes.quantidade ===
                                                    1
                                                        ? "concluída"
                                                        : "concluídas"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        )}
                    </div>

                    <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm font-semibold text-slate-400">
                                Total dos últimos 12 meses
                            </p>

                            <p className="text-2xl font-extrabold text-emerald-400">
                                {formatarMoeda(
                                    historico12Meses.reduce(
                                        (total, mes) =>
                                            total +
                                            mes.receita,
                                        0
                                    )
                                )}
                            </p>
                        </div>

                        <p className="mt-2 text-xs text-slate-600">
                            Histórico móvel dos últimos 12 meses.
                        </p>
                    </div>
                </div>

                {/* 9K.3 — VISÃO ANUAL */}
                <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-7">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                                Análise financeira
                            </p>

                            <h2 className="mt-2 text-2xl font-bold">
                                Visão anual
                            </h2>

                            <p className="mt-2 text-sm text-slate-500">
                                Análise da receita e das marcações concluídas por ano.
                            </p>
                        </div>

                        <form
                            method="GET"
                            className="flex flex-col gap-2 sm:flex-row sm:items-end"
                        >
                            <div>
                                <label
                                    htmlFor="ano"
                                    className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                                >
                                    Ano
                                </label>

                                <select
                                    id="ano"
                                    name="ano"
                                    defaultValue={String(
                                        anoFinanceiro
                                    )}
                                    className="min-w-[150px] rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-400"
                                >
                                    {anosDisponiveis.map(
                                        (ano) => (
                                            <option
                                                key={ano}
                                                value={ano}
                                            >
                                                {ano}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
                            >
                                Ver ano
                            </button>
                        </form>
                    </div>

                    {/* CARDS ANUAIS */}
                    <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                                Receita anual
                            </p>

                            <p className="mt-3 text-2xl font-extrabold">
                                {formatarMoeda(
                                    receitaAno
                                )}
                            </p>

                            <p className="mt-2 text-xs text-slate-500">
                                Ano {anoFinanceiro}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                                Concluídas
                            </p>

                            <p className="mt-3 text-2xl font-extrabold">
                                {quantidadeAno}
                            </p>

                            <p className="mt-2 text-xs text-slate-500">
                                Marcações concluídas
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Média mensal
                            </p>

                            <p className="mt-3 text-2xl font-extrabold">
                                {formatarMoeda(
                                    mediaMensal
                                )}
                            </p>

                            <p className="mt-2 text-xs text-slate-500">
                                Receita anual ÷ 12 meses
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Melhor mês
                            </p>

                            <p className="mt-3 text-lg font-extrabold text-emerald-400">
                                {melhorMes
                                    ? melhorMes.nome
                                    : "Sem receita"}
                            </p>

                            <p className="mt-2 text-sm text-slate-500">
                                {melhorMes
                                    ? formatarMoeda(
                                          melhorMes.receita
                                      )
                                    : "€0,00"}
                            </p>
                        </div>
                    </div>

                    {/* PIOR MÊS */}
                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Pior mês com receita
                                </p>

                                <p className="mt-2 font-bold text-slate-200">
                                    {piorMes
                                        ? piorMes.nome
                                        : "Sem receita no ano"}
                                </p>
                            </div>

                            <p className="text-xl font-extrabold text-slate-300">
                                {piorMes
                                    ? formatarMoeda(
                                          piorMes.receita
                                      )
                                    : "€0,00"}
                            </p>
                        </div>
                    </div>

                    {/* GRÁFICO ANUAL */}
                    <div className="mt-8">
                        <div className="mb-5">
                            <h3 className="text-lg font-bold">
                                Receita por mês
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Evolução da receita ao longo de {anoFinanceiro}.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {historicoAno.map(
                                (mes) => {
                                    const larguraBarra =
                                        maiorReceitaAno >
                                        0
                                            ? Math.max(
                                                  (mes.receita /
                                                      maiorReceitaAno) *
                                                      100,
                                                  mes.receita >
                                                      0
                                                      ? 3
                                                      : 0
                                              )
                                            : 0;

                                    return (
                                        <div
                                            key={mes.chave}
                                            className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="min-w-[110px]">
                                                    <p className="font-semibold text-slate-300">
                                                        {mes.nome}
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-600">
                                                        {mes.quantidade}{" "}
                                                        {mes.quantidade ===
                                                        1
                                                            ? "concluída"
                                                            : "concluídas"}
                                                    </p>
                                                </div>

                                                <div className="flex-1">
                                                    <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                                                        <div
                                                            className="h-full rounded-full bg-emerald-400 transition-all"
                                                            style={{
                                                                width: `${larguraBarra}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <p className="min-w-[105px] text-right text-sm font-bold text-emerald-400">
                                                    {formatarMoeda(
                                                        mes.receita
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </div>

                    {/* TABELA ANUAL */}
                    <div className="mt-8">
                        <div className="mb-5">
                            <h3 className="text-lg font-bold">
                                Resumo mensal
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Todos os meses do ano, incluindo meses sem movimento.
                            </p>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-800">
                            <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-slate-800 bg-slate-950/80 px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                <span>Mês</span>
                                <span>Concluídas</span>
                                <span>Receita</span>
                            </div>

                            <div className="divide-y divide-slate-800">
                                {historicoAno.map(
                                    (mes) => (
                                        <div
                                            key={mes.chave}
                                            className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-4 transition hover:bg-slate-950/60"
                                        >
                                            <div>
                                                <p className="font-semibold text-slate-300">
                                                    {mes.nome}
                                                </p>
                                            </div>

                                            <p className="text-sm text-slate-400">
                                                {mes.quantidade}
                                            </p>

                                            <p
                                                className={`text-right text-sm font-bold ${
                                                    mes.receita >
                                                    0
                                                        ? "text-emerald-400"
                                                        : "text-slate-600"
                                                }`}
                                            >
                                                {formatarMoeda(
                                                    mes.receita
                                                )}
                                            </p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    {/* TOTAL ANUAL */}
                    <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-400">
                                    Total de receita em {anoFinanceiro}
                                </p>

                                <p className="mt-1 text-xs text-slate-600">
                                    Apenas marcações concluídas.
                                </p>
                            </div>

                            <p className="text-3xl font-extrabold text-emerald-400">
                                {formatarMoeda(
                                    receitaAno
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* MOVIMENTO DO MÊS */}
                <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-7">
                    <div className="mb-6">
                        <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                            Movimento
                        </p>

                        <h2 className="mt-2 text-2xl font-bold">
                            Marcações concluídas este mês
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            Apenas marcações concluídas entram no cálculo do caixa.
                        </p>
                    </div>

                    {concluidosEsteMes.length > 0 ? (
                        <div className="space-y-3">
                            {concluidosEsteMes.map(
                                (agendamento) => (
                                    <div
                                        key={
                                            agendamento.id
                                        }
                                        className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-5 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div>
                                            <p className="font-bold text-slate-200">
                                                {clientesMap.get(
                                                    agendamento.cliente_id
                                                ) ??
                                                    "Cliente"}
                                            </p>

                                            <p className="mt-1 text-sm text-slate-400">
                                                {servicosMap.get(
                                                    agendamento.servico_id
                                                ) ??
                                                    "Serviço"}
                                            </p>

                                            <p className="mt-2 text-xs text-slate-500">
                                                {formatarData(
                                                    agendamento.inicio,
                                                    fusoHorario
                                                )}
                                            </p>
                                        </div>

                                        <p className="text-xl font-bold text-emerald-400">
                                            {formatarMoeda(
                                                Number(
                                                    agendamento.valor ??
                                                        0
                                                )
                                            )}
                                        </p>
                                    </div>
                                )
                            )}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center">
                            <div className="text-4xl">
                                💰
                            </div>

                            <p className="mt-4 font-semibold text-slate-200">
                                Ainda não existem marcações concluídas este mês.
                            </p>

                            <p className="mt-2 text-sm text-slate-500">
                                Quando uma marcação for concluída, o valor aparecerá aqui.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}