"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Empresa = {
    id: string;
    name: string;
    description: string | null;
};

type Configuracao = {
    agendamento_ativo: boolean;
    fuso_horario: string;
    intervalo_marcacao_minutos: number;
    antecedencia_minima_minutos: number;
    antecedencia_maxima_dias: number;
    cancelamento_ativo: boolean;
    prazo_cancelamento_minutos: number;
};

type Servico = {
    id: string;
    nome: string;
    descricao: string | null;
    duracao_minutos: number;
    preco: number | null;
};

type Profissional = {
    id: string;
    nome: string;
};

type EmpresaResponse = {
    empresa: Empresa;
    configuracao: Configuracao;
};

type ServicosResponse = {
    servicos: Servico[];
};

type ProfissionaisResponse = {
    profissionais: Profissional[];
};

type HorariosResponse = {
    data: string;
    profissional_id: string;
    servico_id: string;
    horarios: string[];
    timeZone: string;
};

type Passo = "servico" | "profissional" | "data" | "dados" | "resumo";

function formatarData(data: string) {
    if (!data) {
        return "";
    }

    const [ano, mes, dia] = data.split("-").map(Number);

    if (!ano || !mes || !dia) {
        return data;
    }

    return new Intl.DateTimeFormat("pt-PT", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(ano, mes - 1, dia));
}

function formatarPreco(preco: number | null) {
    if (preco === null || preco === undefined) {
        return "Preço sob consulta";
    }

    return new Intl.NumberFormat("pt-PT", {
        style: "currency",
        currency: "EUR",
    }).format(preco);
}

function obterDataHoje() {
    const agora = new Date();

    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

function adicionarDias(data: string, dias: number) {
    const [ano, mes, dia] = data.split("-").map(Number);

    const resultado = new Date(
        ano,
        mes - 1,
        dia,
        12,
        0,
        0,
        0,
    );

    resultado.setDate(resultado.getDate() + dias);

    const novoAno = resultado.getFullYear();
    const novoMes = String(resultado.getMonth() + 1).padStart(2, "0");
    const novoDia = String(resultado.getDate()).padStart(2, "0");

    return `${novoAno}-${novoMes}-${novoDia}`;
}

function obterInicioDoMes(data: string) {
    const [ano, mes] = data.split("-").map(Number);
    return new Date(ano, mes - 1, 1, 12, 0, 0, 0);
}

function formatarChaveData(data: Date) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

function gerarDiasDoMes(mesAtual: Date) {
    const primeiroDia = new Date(
        mesAtual.getFullYear(),
        mesAtual.getMonth(),
        1,
        12,
        0,
        0,
        0,
    );

    const primeiroDiaSemana =
        primeiroDia.getDay() === 0
            ? 6
            : primeiroDia.getDay() - 1;

    const inicio = new Date(primeiroDia);
    inicio.setDate(
        inicio.getDate() - primeiroDiaSemana,
    );

    return Array.from({ length: 42 }, (_, index) => {
        const data = new Date(inicio);
        data.setDate(data.getDate() + index);
        return data;
    });
}

export default function PublicBookingPage() {
    const params = useParams();

    const empresaId =
        typeof params.empresaId === "string"
            ? params.empresaId
            : "";

    const [empresa, setEmpresa] =
        useState<Empresa | null>(null);

    const [configuracao, setConfiguracao] =
        useState<Configuracao | null>(null);

    const [servicos, setServicos] =
        useState<Servico[]>([]);

    const [profissionais, setProfissionais] =
        useState<Profissional[]>([]);

    const [horarios, setHorarios] =
        useState<string[]>([]);

    const [aCarregarEmpresa, setACarregarEmpresa] =
        useState(true);

    const [aCarregarServicos, setACarregarServicos] =
        useState(true);

    const [aCarregarProfissionais, setACarregarProfissionais] =
        useState(false);

    const [aCarregarHorarios, setACarregarHorarios] =
        useState(false);

    const [erro, setErro] =
        useState("");

    const [erroHorarios, setErroHorarios] =
        useState("");

    const [servicoSelecionado, setServicoSelecionado] =
        useState("");

    const [profissionalSelecionado, setProfissionalSelecionado] =
        useState("");

    const [dataSelecionada, setDataSelecionada] =
        useState(obterDataHoje());

    const [mesCalendario, setMesCalendario] =
        useState(() => obterInicioDoMes(obterDataHoje()));

    const [horaSelecionada, setHoraSelecionada] =
        useState("");

    const [passo, setPasso] =
        useState<Passo>("servico");

    const [nomeCliente, setNomeCliente] =
        useState("");

    const [emailCliente, setEmailCliente] =
        useState("");

    const [telefoneCliente, setTelefoneCliente] =
        useState("");

    const [notasCliente, setNotasCliente] =
        useState("");

    const [erroDadosCliente, setErroDadosCliente] =
        useState("");

    const [aCriarMarcacao, setACriarMarcacao] =
        useState(false);

    const [erroCriacao, setErroCriacao] =
        useState("");

    const [marcacaoCriada, setMarcacaoCriada] =
        useState(false);

    const dataHoje = obterDataHoje();

    const dataMaxima = useMemo(() => {
        const dias =
            configuracao?.antecedencia_maxima_dias ?? 90;

        return adicionarDias(dataHoje, Math.min(dias, 90));
    }, [configuracao, dataHoje]);

    const diasCalendario = useMemo(
        () => gerarDiasDoMes(mesCalendario),
        [mesCalendario],
    );

    const mesAnteriorDisponivel = useMemo(() => {
        const inicioMesAnterior = new Date(
            mesCalendario.getFullYear(),
            mesCalendario.getMonth() - 1,
            1,
            12,
            0,
            0,
            0,
        );

        return (
            inicioMesAnterior >=
            obterInicioDoMes(dataHoje)
        );
    }, [mesCalendario, dataHoje]);

    const proximoMesDisponivel = useMemo(() => {
        const inicioProximoMes = new Date(
            mesCalendario.getFullYear(),
            mesCalendario.getMonth() + 1,
            1,
            12,
            0,
            0,
            0,
        );

        return inicioProximoMes <=
            obterInicioDoMes(dataMaxima);
    }, [mesCalendario, dataMaxima]);

    const servicoAtual = useMemo(
        () =>
            servicos.find(
                (servico) =>
                    servico.id === servicoSelecionado,
            ) ?? null,
        [servicos, servicoSelecionado],
    );

    const profissionalAtual = useMemo(
        () =>
            profissionais.find(
                (profissional) =>
                    profissional.id === profissionalSelecionado,
            ) ?? null,
        [profissionais, profissionalSelecionado],
    );

    useEffect(() => {
        if (!empresaId) {
            setErro("Empresa inválida.");
            setACarregarEmpresa(false);
            setACarregarServicos(false);
            return;
        }

        let cancelado = false;

        async function carregar() {
            setACarregarEmpresa(true);
            setACarregarServicos(true);
            setErro("");

            try {
                const [empresaResponse, servicosResponse] =
                    await Promise.all([
                        fetch(
                            `/api/booking/public/booking/empresa/${empresaId}`,
                        ),
                        fetch(
                            `/api/booking/public/booking/empresa/${empresaId}/servicos`,
                        ),
                    ]);

                const empresaData =
                    (await empresaResponse.json()) as
                        | EmpresaResponse
                        | { error?: string };

                const servicosData =
                    (await servicosResponse.json()) as
                        | ServicosResponse
                        | { error?: string };

                if (cancelado) {
                    return;
                }

                if (!empresaResponse.ok) {
                    setErro(
                        "error" in empresaData &&
                            empresaData.error
                            ? empresaData.error
                            : "Não foi possível carregar a empresa.",
                    );
                    return;
                }

                if (!servicosResponse.ok) {
                    setErro(
                        "error" in servicosData &&
                            servicosData.error
                            ? servicosData.error
                            : "Não foi possível carregar os serviços.",
                    );
                    return;
                }

                if (
                    !("empresa" in empresaData) ||
                    !("configuracao" in empresaData) ||
                    !("servicos" in servicosData)
                ) {
                    setErro(
                        "Não foi possível carregar os dados da página de reservas.",
                    );
                    return;
                }

                setEmpresa(empresaData.empresa);
                setConfiguracao(
                    empresaData.configuracao,
                );
                setServicos(servicosData.servicos);
            } catch {
                if (!cancelado) {
                    setErro(
                        "Não foi possível carregar a página de reservas.",
                    );
                }
            } finally {
                if (!cancelado) {
                    setACarregarEmpresa(false);
                    setACarregarServicos(false);
                }
            }
        }

        carregar();

        return () => {
            cancelado = true;
        };
    }, [empresaId]);

    async function carregarProfissionais(
        servicoId: string,
    ) {
        if (!empresaId || !servicoId) {
            setProfissionais([]);
            return;
        }

        setACarregarProfissionais(true);
        setErro("");

        try {
            const response = await fetch(
                `/api/booking/public/booking/empresa/${empresaId}/servicos/${servicoId}/profissionais`,
            );

            const result =
                (await response.json()) as
                    | ProfissionaisResponse
                    | { error?: string };

            if (!response.ok) {
                setProfissionais([]);
                setErro(
                    "error" in result && result.error
                        ? result.error
                        : "Não foi possível carregar os profissionais.",
                );
                return;
            }

            if (!("profissionais" in result)) {
                setProfissionais([]);
                setErro(
                    "Não foi possível carregar os profissionais.",
                );
                return;
            }

            setProfissionais(result.profissionais);
        } catch {
            setProfissionais([]);
            setErro(
                "Não foi possível carregar os profissionais.",
            );
        } finally {
            setACarregarProfissionais(false);
        }
    }

    async function carregarHorarios(
        profissionalId: string,
        servicoId: string,
        data: string,
    ) {
        if (
            !empresaId ||
            !profissionalId ||
            !servicoId ||
            !data
        ) {
            setHorarios([]);
            return;
        }

        setACarregarHorarios(true);
        setHorarios([]);
        setHoraSelecionada("");
        setErroHorarios("");

        try {
            const response = await fetch(
                `/api/booking/public/booking/empresa/${empresaId}/servicos/${servicoId}/profissionais/${profissionalId}/horarios?data=${data}`,
            );

            const result =
                (await response.json()) as
                    | HorariosResponse
                    | { error?: string };

            if (!response.ok) {
                setErroHorarios(
                    "error" in result && result.error
                        ? result.error
                        : "Não foi possível carregar os horários.",
                );
                return;
            }

            if (!("horarios" in result)) {
                setErroHorarios(
                    "Não foi possível carregar os horários.",
                );
                return;
            }

            setHorarios(result.horarios ?? []);
        } catch {
            setErroHorarios(
                "Não foi possível carregar os horários disponíveis.",
            );
        } finally {
            setACarregarHorarios(false);
        }
    }

    function selecionarServico(id: string) {
        setServicoSelecionado(id);
        setProfissionalSelecionado("");
        setProfissionais([]);
        setDataSelecionada(dataHoje);
        setHoraSelecionada("");
        setHorarios([]);
        setErro("");
        setErroHorarios("");

        if (id) {
            void carregarProfissionais(id);
            setPasso("profissional");
        }
    }

    function selecionarProfissional(id: string) {
        setProfissionalSelecionado(id);
        setHoraSelecionada("");
        setHorarios([]);
        setErroHorarios("");

        if (id && servicoSelecionado && dataSelecionada) {
            void carregarHorarios(
                id,
                servicoSelecionado,
                dataSelecionada,
            );
        }
    }

    function selecionarData(data: string) {
        if (data < dataHoje || data > dataMaxima) {
            return;
        }

        setDataSelecionada(data);
        setMesCalendario(obterInicioDoMes(data));
        setHoraSelecionada("");
        setHorarios([]);
        setErroHorarios("");

        if (
            profissionalSelecionado &&
            servicoSelecionado &&
            data
        ) {
            void carregarHorarios(
                profissionalSelecionado,
                servicoSelecionado,
                data,
            );
        }
    }

    function continuarParaDados() {
        if (
            !servicoSelecionado ||
            !profissionalSelecionado ||
            !dataSelecionada ||
            !horaSelecionada
        ) {
            return;
        }

        setErroDadosCliente("");
        setPasso("dados");
    }

    function validarDadosCliente() {
        const nome = nomeCliente.trim();
        const email = emailCliente.trim();
        const telefone = telefoneCliente.trim();

        if (!nome) {
            setErroDadosCliente(
                "O nome é obrigatório.",
            );
            return false;
        }

        if (nome.length < 2) {
            setErroDadosCliente(
                "Introduza o nome completo.",
            );
            return false;
        }

        if (!email) {
            setErroDadosCliente(
                "O email é obrigatório.",
            );
            return false;
        }

        const emailValido =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!emailValido) {
            setErroDadosCliente(
                "Introduza um email válido.",
            );
            return false;
        }

        if (!telefone) {
            setErroDadosCliente(
                "O telefone é obrigatório.",
            );
            return false;
        }

        if (telefone.length < 6) {
            setErroDadosCliente(
                "Introduza um número de telefone válido.",
            );
            return false;
        }

        setErroDadosCliente("");
        return true;
    }

    function continuarParaResumo() {
        if (!validarDadosCliente()) {
            return;
        }

        setErroCriacao("");
        setPasso("resumo");
    }

    function voltarParaProfissional() {
        setPasso("profissional");
        setHoraSelecionada("");
    }

    function voltarParaData() {
        setPasso("data");
    }

    async function confirmarMarcacao() {
        if (
            !servicoSelecionado ||
            !profissionalSelecionado ||
            !dataSelecionada ||
            !horaSelecionada
        ) {
            return;
        }

        if (!validarDadosCliente()) {
            setPasso("dados");
            return;
        }

        setACriarMarcacao(true);
        setErroCriacao("");

        try {
            const response = await fetch(
                `/api/booking/public/booking/empresa/${empresaId}/marcar`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        servico_id: servicoSelecionado,
                        profissional_id: profissionalSelecionado,
                        data: dataSelecionada,
                        hora: horaSelecionada,
                        nome: nomeCliente.trim(),
                        email: emailCliente.trim(),
                        telefone: telefoneCliente.trim(),
                        notas: notasCliente.trim() || null,
                    }),
                },
            );

            const result = (await response.json()) as {
                error?: string;
                success?: boolean;
            };

            if (!response.ok) {
                setErroCriacao(
                    result.error ||
                        "Não foi possível confirmar a marcação.",
                );
                return;
            }

            setMarcacaoCriada(true);
        } catch {
            setErroCriacao(
                "Não foi possível confirmar a marcação. Tente novamente.",
            );
        } finally {
            setACriarMarcacao(false);
        }
    }

    if (aCarregarEmpresa || aCarregarServicos) {
        return (
            <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
                <div className="mx-auto max-w-3xl">
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl">
                        <div className="animate-pulse space-y-5">
                            <div className="h-8 w-48 rounded bg-slate-800" />
                            <div className="h-4 w-72 rounded bg-slate-800" />
                            <div className="h-24 rounded-2xl bg-slate-800" />
                            <div className="h-24 rounded-2xl bg-slate-800" />
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (erro && !empresa) {
        return (
            <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
                <div className="mx-auto max-w-2xl">
                    <div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-8">
                        <h1 className="text-xl font-bold">
                            Não foi possível abrir as reservas
                        </h1>

                        <p className="mt-3 text-sm text-red-300">
                            {erro}
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    if (!empresa || !configuracao) {
        return null;
    }

    if (marcacaoCriada) {
        return (
            <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
                <div className="mx-auto max-w-2xl">
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 text-center shadow-2xl sm:p-10">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10 text-3xl text-emerald-400">
                            ✓
                        </div>
                        <div className="mt-6 inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                            Nexora Booking
                        </div>
                        <h1 className="mt-5 text-3xl font-bold">
                            Marcação recebida!
                        </h1>
                        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-slate-400">
                            A sua marcação foi registada com sucesso.
                            A empresa poderá confirmar a reserva de acordo
                            com o funcionamento do Booking.
                        </p>
                        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-left">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Resumo
                            </p>
                            <div className="mt-4 space-y-3 text-sm">
                                <div className="flex justify-between gap-4">
                                    <span className="text-slate-500">Serviço</span>
                                    <span className="text-right font-semibold text-white">{servicoAtual?.nome}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-slate-500">Profissional</span>
                                    <span className="text-right font-medium text-white">{profissionalAtual?.nome}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-slate-500">Data</span>
                                    <span className="text-right font-medium capitalize text-white">{formatarData(dataSelecionada)}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-slate-500">Horário</span>
                                    <span className="font-semibold text-cyan-400">{horaSelecionada}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (!configuracao.agendamento_ativo) {
        return (
            <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
                <div className="mx-auto max-w-2xl">
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 text-center shadow-2xl">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-2xl">
                            !
                        </div>

                        <h1 className="mt-5 text-2xl font-bold">
                            Reservas temporariamente indisponíveis
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-slate-400">
                            De momento, esta empresa não está a
                            aceitar novas marcações online.
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
            <div className="mx-auto max-w-3xl">
                {/* Cabeçalho */}

                <div className="mb-8 text-center">
                    <div className="mb-3 inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                        Nexora Booking
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                        {empresa.name}
                    </h1>

                    {empresa.description && (
                        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
                            {empresa.description}
                        </p>
                    )}
                </div>

                {/* Indicador de progresso */}

                <div className="mb-8 grid grid-cols-5 gap-2">
                    {[
                        {
                            id: "servico" as Passo,
                            label: "Serviço",
                        },
                        {
                            id: "profissional" as Passo,
                            label: "Profissional",
                        },
                        {
                            id: "data" as Passo,
                            label: "Data",
                        },
                        {
                            id: "dados" as Passo,
                            label: "Dados",
                        },
                        {
                            id: "resumo" as Passo,
                            label: "Resumo",
                        },
                    ].map((item, index) => {
                        const ativo =
                            item.id === passo;

                        const concluido =
                            (item.id === "servico" &&
                                !!servicoSelecionado) ||
                            (item.id === "profissional" &&
                                !!profissionalSelecionado) ||
                            (item.id === "data" &&
                                !!horaSelecionada) ||
                            (item.id === "dados" &&
                                !!nomeCliente.trim() &&
                                !!emailCliente.trim() &&
                                !!telefoneCliente.trim());

                        return (
                            <div
                                key={item.id}
                                className="flex items-center gap-2"
                            >
                                <div
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                        ativo
                                            ? "bg-cyan-400 text-slate-950"
                                            : concluido
                                              ? "bg-cyan-400/20 text-cyan-400"
                                              : "bg-slate-800 text-slate-500"
                                    }`}
                                >
                                    {index + 1}
                                </div>

                                <span
                                    className={`hidden text-xs font-semibold sm:block ${
                                        ativo
                                            ? "text-white"
                                            : "text-slate-500"
                                    }`}
                                >
                                    {item.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Erro geral */}

                {erro && (
                    <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/5 px-5 py-4 text-sm text-red-300">
                        {erro}
                    </div>
                )}

                {/* Conteúdo */}

                <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl sm:p-8">
                    {/* SERVIÇO */}

                    {passo === "servico" && (
                        <section>
                            <div className="mb-6">
                                <h2 className="text-xl font-bold">
                                    Escolha o serviço
                                </h2>

                                <p className="mt-1 text-sm text-slate-400">
                                    Selecione o serviço que pretende
                                    marcar.
                                </p>
                            </div>

                            {servicos.length === 0 ? (
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-500">
                                    Não existem serviços disponíveis
                                    para marcação online.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {servicos.map(
                                        (servico) => (
                                            <button
                                                key={servico.id}
                                                type="button"
                                                onClick={() =>
                                                    selecionarServico(
                                                        servico.id,
                                                    )
                                                }
                                                className={`w-full rounded-2xl border p-5 text-left transition ${
                                                    servicoSelecionado ===
                                                    servico.id
                                                        ? "border-cyan-400 bg-cyan-400/5"
                                                        : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/70"
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <h3 className="font-semibold text-white">
                                                            {
                                                                servico.nome
                                                            }
                                                        </h3>

                                                        {servico.descricao && (
                                                            <p className="mt-1 text-sm leading-5 text-slate-400">
                                                                {
                                                                    servico.descricao
                                                                }
                                                            </p>
                                                        )}

                                                        <p className="mt-3 text-xs font-medium text-slate-500">
                                                            {
                                                                servico.duracao_minutos
                                                            }{" "}
                                                            minutos
                                                        </p>
                                                    </div>

                                                    <div className="shrink-0 text-right">
                                                        <p className="font-semibold text-cyan-400">
                                                            {formatarPreco(
                                                                servico.preco,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        ),
                                    )}
                                </div>
                            )}
                        </section>
                    )}

                    {/* PROFISSIONAL */}

                    {passo === "profissional" && (
                        <section>
                            <div className="mb-6">
                                <h2 className="text-xl font-bold">
                                    Escolha o profissional
                                </h2>

                                <p className="mt-1 text-sm text-slate-400">
                                    Serviço:{" "}
                                    <span className="text-slate-300">
                                        {servicoAtual?.nome}
                                    </span>
                                </p>
                            </div>

                            {aCarregarProfissionais ? (
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-400">
                                    A carregar profissionais...
                                </div>
                            ) : profissionais.length === 0 ? (
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-500">
                                    Não existem profissionais
                                    disponíveis para este serviço.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {profissionais.map(
                                        (profissional) => (
                                            <button
                                                key={
                                                    profissional.id
                                                }
                                                type="button"
                                                onClick={() => {
                                                    selecionarProfissional(
                                                        profissional.id,
                                                    );
                                                    setPasso(
                                                        "data",
                                                    );
                                                }}
                                                className={`w-full rounded-2xl border p-5 text-left transition ${
                                                    profissionalSelecionado ===
                                                    profissional.id
                                                        ? "border-cyan-400 bg-cyan-400/5"
                                                        : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/70"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-4">
                                                    <div>
                                                        <h3 className="font-semibold">
                                                            {
                                                                profissional.nome
                                                            }
                                                        </h3>

                                                        <p className="mt-1 text-xs text-slate-500">
                                                            Profissional
                                                        </p>
                                                    </div>

                                                    <span className="text-cyan-400">
                                                        →
                                                    </span>
                                                </div>
                                            </button>
                                        ),
                                    )}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() =>
                                    setPasso("servico")
                                }
                                className="mt-6 text-sm font-medium text-slate-400 transition hover:text-white"
                            >
                                ← Alterar serviço
                            </button>
                        </section>
                    )}

                    {/* DATA E HORÁRIO */}

                    {passo === "data" && (
                        <section>
                            <div className="mb-6">
                                <h2 className="text-xl font-bold">
                                    Escolha a data e o horário
                                </h2>

                                <p className="mt-1 text-sm text-slate-400">
                                    {servicoAtual?.nome} com{" "}
                                    {profissionalAtual?.nome}
                                </p>
                            </div>

                            <div>
                                <div className="mb-3 flex items-center justify-between">
                                    <label className="block text-sm font-semibold text-slate-300">
                                        Escolha a data
                                    </label>

                                    <span className="text-xs text-slate-500">
                                        A partir de hoje
                                    </span>
                                </div>

                                <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                                    <div className="mb-4 flex items-center justify-between">
                                        <button
                                            type="button"
                                            disabled={!mesAnteriorDisponivel}
                                            onClick={() => {
                                                if (!mesAnteriorDisponivel) {
                                                    return;
                                                }

                                                setMesCalendario(
                                                    (atual) =>
                                                        new Date(
                                                            atual.getFullYear(),
                                                            atual.getMonth() - 1,
                                                            1,
                                                            12,
                                                            0,
                                                            0,
                                                            0,
                                                        ),
                                                );
                                            }}
                                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                                            aria-label="Mês anterior"
                                        >
                                            ←
                                        </button>

                                        <p className="text-sm font-bold capitalize text-white">
                                            {new Intl.DateTimeFormat(
                                                "pt-PT",
                                                {
                                                    month: "long",
                                                    year: "numeric",
                                                },
                                            ).format(mesCalendario)}
                                        </p>

                                        <button
                                            type="button"
                                            disabled={!proximoMesDisponivel}
                                            onClick={() => {
                                                if (!proximoMesDisponivel) {
                                                    return;
                                                }

                                                setMesCalendario(
                                                    (atual) =>
                                                        new Date(
                                                            atual.getFullYear(),
                                                            atual.getMonth() + 1,
                                                            1,
                                                            12,
                                                            0,
                                                            0,
                                                            0,
                                                        ),
                                                );
                                            }}
                                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                                            aria-label="Mês seguinte"
                                        >
                                            →
                                        </button>
                                    </div>

                                    <div className="mb-2 grid grid-cols-7 gap-1 text-center">
                                        {[
                                            "Seg",
                                            "Ter",
                                            "Qua",
                                            "Qui",
                                            "Sex",
                                            "Sáb",
                                            "Dom",
                                        ].map((dia) => (
                                            <span
                                                key={dia}
                                                className="py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
                                            >
                                                {dia}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-7 gap-1">
                                        {diasCalendario.map((dia) => {
                                            const chave = formatarChaveData(dia);
                                            const pertenceAoMes =
                                                dia.getMonth() ===
                                                mesCalendario.getMonth();

                                            const indisponivel =
                                                chave < dataHoje ||
                                                chave > dataMaxima;

                                            const selecionada =
                                                chave === dataSelecionada;

                                            return (
                                                <button
                                                    key={chave}
                                                    type="button"
                                                    disabled={
                                                        !pertenceAoMes ||
                                                        indisponivel
                                                    }
                                                    onClick={() =>
                                                        selecionarData(
                                                            chave,
                                                        )
                                                    }
                                                    className={`aspect-square rounded-lg text-sm font-medium transition ${
                                                        !pertenceAoMes
                                                            ? "cursor-default text-transparent"
                                                            : indisponivel
                                                              ? "cursor-not-allowed text-slate-700"
                                                              : selecionada
                                                                ? "bg-cyan-400 font-bold text-slate-950"
                                                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                                    }`}
                                                >
                                                    {dia.getDate()}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {dataSelecionada && (
                                    <p className="mt-3 text-center text-xs capitalize text-slate-500">
                                        {formatarData(dataSelecionada)}
                                    </p>
                                )}
                            </div>

                            <div className="mt-7">
                                <div className="mb-3 flex items-center justify-between">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-300">
                                            Horários disponíveis
                                        </label>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Selecione o horário
                                            pretendido.
                                        </p>
                                    </div>

                                    {aCarregarHorarios && (
                                        <span className="text-xs font-semibold text-cyan-400">
                                            A procurar...
                                        </span>
                                    )}
                                </div>

                                {erroHorarios && (
                                    <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
                                        {erroHorarios}
                                    </div>
                                )}

                                {!aCarregarHorarios &&
                                    !erroHorarios &&
                                    horarios.length ===
                                        0 && (
                                        <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-4 text-sm text-slate-500">
                                            Não existem horários
                                            disponíveis para esta
                                            data.
                                        </div>
                                    )}

                                {!aCarregarHorarios &&
                                    horarios.length >
                                        0 && (
                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                            {horarios.map(
                                                (hora) => (
                                                    <button
                                                        key={hora}
                                                        type="button"
                                                        onClick={() =>
                                                            setHoraSelecionada(
                                                                hora,
                                                            )
                                                        }
                                                        className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                                                            horaSelecionada ===
                                                            hora
                                                                ? "border-cyan-400 bg-cyan-400 text-slate-950"
                                                                : "border-slate-700 bg-slate-950/50 text-white hover:border-cyan-400/50"
                                                        }`}
                                                    >
                                                        {hora}
                                                    </button>
                                                ),
                                            )}
                                        </div>
                                    )}
                            </div>

                            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPasso(
                                            "profissional",
                                        )
                                    }
                                    className="text-sm font-medium text-slate-400 transition hover:text-white"
                                >
                                    ← Alterar profissional
                                </button>

                                <button
                                    type="button"
                                    disabled={!horaSelecionada}
                                    onClick={
                                        continuarParaDados
                                    }
                                    className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Continuar
                                </button>
                            </div>
                        </section>
                    )}

                    {/* DADOS DO CLIENTE */}

                    {passo === "dados" && (
                        <section>
                            <div className="mb-6">
                                <h2 className="text-xl font-bold">
                                    Os seus dados
                                </h2>

                                <p className="mt-1 text-sm leading-6 text-slate-400">
                                    Preencha os seus dados para
                                    podermos registar a marcação.
                                </p>
                            </div>

                            {erroDadosCliente && (
                                <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
                                    {erroDadosCliente}
                                </div>
                            )}

                            <div className="space-y-5">
                                <div>
                                    <label
                                        htmlFor="nome"
                                        className="mb-2 block text-sm font-semibold text-slate-300"
                                    >
                                        Nome completo
                                    </label>

                                    <input
                                        id="nome"
                                        type="text"
                                        autoComplete="name"
                                        value={nomeCliente}
                                        onChange={(event) =>
                                            setNomeCliente(
                                                event.target
                                                    .value,
                                            )
                                        }
                                        placeholder="O seu nome"
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600 outline-none transition focus:border-cyan-400"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-2 block text-sm font-semibold text-slate-300"
                                    >
                                        Email
                                    </label>

                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        value={emailCliente}
                                        onChange={(event) =>
                                            setEmailCliente(
                                                event.target
                                                    .value,
                                            )
                                        }
                                        placeholder="exemplo@email.com"
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600 outline-none transition focus:border-cyan-400"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="telefone"
                                        className="mb-2 block text-sm font-semibold text-slate-300"
                                    >
                                        Telefone
                                    </label>

                                    <input
                                        id="telefone"
                                        type="tel"
                                        autoComplete="tel"
                                        value={telefoneCliente}
                                        onChange={(event) =>
                                            setTelefoneCliente(
                                                event.target
                                                    .value,
                                            )
                                        }
                                        placeholder="+351 9XX XXX XXX"
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600 outline-none transition focus:border-cyan-400"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="notas"
                                        className="mb-2 block text-sm font-semibold text-slate-300"
                                    >
                                        Observações{" "}
                                        <span className="font-normal text-slate-500">
                                            (opcional)
                                        </span>
                                    </label>

                                    <textarea
                                        id="notas"
                                        rows={4}
                                        value={notasCliente}
                                        onChange={(event) =>
                                            setNotasCliente(
                                                event.target
                                                    .value,
                                            )
                                        }
                                        placeholder="Alguma informação que considere importante..."
                                        className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600 outline-none transition focus:border-cyan-400"
                                    />
                                </div>
                            </div>

                            {/* Resumo rápido da escolha */}

                            <div className="mt-7 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    A sua marcação
                                </p>

                                <div className="mt-4 space-y-3 text-sm">
                                    <div className="flex justify-between gap-4">
                                        <span className="text-slate-500">
                                            Serviço
                                        </span>

                                        <span className="text-right font-medium text-white">
                                            {
                                                servicoAtual?.nome
                                            }
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        <span className="text-slate-500">
                                            Profissional
                                        </span>

                                        <span className="text-right font-medium text-white">
                                            {
                                                profissionalAtual?.nome
                                            }
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        <span className="text-slate-500">
                                            Data
                                        </span>

                                        <span className="text-right font-medium capitalize text-white">
                                            {formatarData(
                                                dataSelecionada,
                                            )}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        <span className="text-slate-500">
                                            Horário
                                        </span>

                                        <span className="font-medium text-cyan-400">
                                            {
                                                horaSelecionada
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <button
                                    type="button"
                                    onClick={
                                        voltarParaData
                                    }
                                    className="text-sm font-medium text-slate-400 transition hover:text-white"
                                >
                                    ← Alterar data ou horário
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        continuarParaResumo
                                    }
                                    className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                                >
                                    Continuar
                                </button>
                            </div>
                        </section>
                    )}
                </div>

                {/* RESUMO */}

                {passo === "resumo" && (
                    <section>
                        <div className="mb-6">
                            <h2 className="text-xl font-bold">Confirme a sua marcação</h2>
                            <p className="mt-1 text-sm leading-6 text-slate-400">Verifique os dados antes de confirmar a reserva.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Marcação</p>
                                <div className="mt-4 space-y-4 text-sm">
                                    <div className="flex justify-between gap-4"><span className="text-slate-500">Serviço</span><span className="text-right font-semibold text-white">{servicoAtual?.nome}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500">Duração</span><span className="text-right font-medium text-white">{servicoAtual?.duracao_minutos} minutos</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500">Profissional</span><span className="text-right font-semibold text-white">{profissionalAtual?.nome}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500">Data</span><span className="text-right font-medium capitalize text-white">{formatarData(dataSelecionada)}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500">Horário</span><span className="font-semibold text-cyan-400">{horaSelecionada}</span></div>
                                    <div className="flex justify-between gap-4 border-t border-slate-800 pt-4"><span className="text-slate-500">Preço</span><span className="font-semibold text-cyan-400">{formatarPreco(servicoAtual?.preco ?? null)}</span></div>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Os seus dados</p>
                                <div className="mt-4 space-y-4 text-sm">
                                    <div className="flex justify-between gap-4"><span className="text-slate-500">Nome</span><span className="text-right font-medium text-white">{nomeCliente.trim()}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500">Email</span><span className="max-w-[65%] break-all text-right font-medium text-white">{emailCliente.trim()}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500">Telefone</span><span className="text-right font-medium text-white">{telefoneCliente.trim()}</span></div>
                                    {notasCliente.trim() && (<div className="border-t border-slate-800 pt-4"><p className="text-slate-500">Observações</p><p className="mt-1 whitespace-pre-wrap text-white">{notasCliente.trim()}</p></div>)}
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-sm leading-6 text-slate-300">
                            Ao confirmar, a disponibilidade será validada novamente
                            no servidor antes de criar a marcação.
                        </div>

                        {erroCriacao && (
                            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm leading-6 text-red-300">
                                {erroCriacao}
                            </div>
                        )}

                        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <button
                                type="button"
                                disabled={aCriarMarcacao}
                                onClick={() => {
                                    setErroCriacao("");
                                    setPasso("dados");
                                }}
                                className="text-sm font-medium text-slate-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                ← Alterar os meus dados
                            </button>

                            <button
                                type="button"
                                disabled={aCriarMarcacao}
                                onClick={confirmarMarcacao}
                                className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {aCriarMarcacao
                                    ? "A confirmar..."
                                    : "Confirmar marcação"}
                            </button>
                        </div>
                    </section>
                )}

                {/* Rodapé */}

                <div className="mt-6 text-center">
                    <p className="text-xs text-slate-600">
                        Reservas online através do Nexora Booking
                    </p>
                </div>
            </div>
        </main>
    );
}