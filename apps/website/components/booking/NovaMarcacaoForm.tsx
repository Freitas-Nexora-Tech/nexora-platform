"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DatePicker from "@/components/booking/DatePicker";

type Cliente = {
    id: string;
    nome: string;
    email: string | null;
    telefone: string | null;
};

type Servico = {
    id: string;
    nome: string;
    duracao_minutos: number;
    preco: number;
};

type Profissional = {
    id: string;
    nome: string;
};

type NovaMarcacaoFormProps = {
    clientes: Cliente[];
    servicos: Servico[];
    profissionais: Profissional[];
};

type DisponibilidadeResponse = {
    horarios?: string[];
    error?: string;
};

function getToday() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getMaxDate() {
    const date = new Date();

    date.setDate(date.getDate() + 60);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export default function NovaMarcacaoForm({
    clientes: clientesIniciais,
    servicos,
    profissionais,
}: NovaMarcacaoFormProps) {
    const [clientes, setClientes] =
        useState<Cliente[]>(clientesIniciais);

    const [clienteId, setClienteId] = useState("");
    const [servicoId, setServicoId] = useState("");
    const [profissionalId, setProfissionalId] = useState("");
    const [data, setData] = useState("");
    const [hora, setHora] = useState("");
    const [notas, setNotas] = useState("");

    const [novoCliente, setNovoCliente] =
        useState(false);

    const [novoClienteNome, setNovoClienteNome] =
        useState("");
    const [novoClienteTelefone, setNovoClienteTelefone] =
        useState("");
    const [novoClienteEmail, setNovoClienteEmail] =
        useState("");
    const [novoClienteNotas, setNovoClienteNotas] =
        useState("");

    const [aCriarCliente, setACriarCliente] =
        useState(false);
    const [erroCliente, setErroCliente] =
        useState("");

    const [horarios, setHorarios] =
        useState<string[]>([]);

    const [aCarregarHorarios, setACarregarHorarios] =
        useState(false);

    const [erroHorarios, setErroHorarios] =
        useState("");

    const [aCriar, setACriar] =
        useState(false);

    const [erroCriacao, setErroCriacao] =
        useState("");

    useEffect(() => {
        if (
            !servicoId ||
            !profissionalId ||
            !data
        ) {
            setHorarios([]);
            setHora("");
            setErroHorarios("");
            return;
        }

        let cancelado = false;

        async function carregarHorarios() {
            setACarregarHorarios(true);
            setHorarios([]);
            setHora("");
            setErroHorarios("");

            try {
                const response = await fetch(
                    "/api/booking/disponibilidade",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            servico_id: servicoId,
                            profissional_id:
                                profissionalId,
                            data,
                        }),
                    }
                );

                const result =
                    (await response.json()) as DisponibilidadeResponse;

                if (cancelado) {
                    return;
                }

                if (!response.ok) {
                    setErroHorarios(
                        result.error ||
                        "Não foi possível carregar os horários."
                    );
                    return;
                }

                setHorarios(
                    result.horarios ?? []
                );
            } catch {
                if (!cancelado) {
                    setErroHorarios(
                        "Não foi possível carregar os horários disponíveis."
                    );
                }
            } finally {
                if (!cancelado) {
                    setACarregarHorarios(false);
                }
            }
        }

        carregarHorarios();

        return () => {
            cancelado = true;
        };
    }, [
        servicoId,
        profissionalId,
        data,
    ]);

    const podeContinuar =
        clienteId !== "" &&
        servicoId !== "" &&
        profissionalId !== "" &&
        data !== "" &&
        hora !== "";

    async function criarCliente() {
        const nome =
            novoClienteNome.trim();

        if (!nome) {
            setErroCliente(
                "O nome do cliente é obrigatório."
            );
            return;
        }

        setACriarCliente(true);
        setErroCliente("");

        try {
            const response = await fetch(
                "/api/booking/clientes",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        nome,
                        telefone:
                            novoClienteTelefone.trim() ||
                            null,
                        email:
                            novoClienteEmail.trim() ||
                            null,
                        notas:
                            novoClienteNotas.trim() ||
                            null,
                    }),
                }
            );

            const result =
                await response.json();

            if (!response.ok) {
                setErroCliente(
                    result.error ||
                    "Não foi possível criar o cliente."
                );
                return;
            }

            const clienteCriado =
                result.cliente as Cliente;

            setClientes((clientesAtuais) => [
                ...clientesAtuais,
                clienteCriado,
            ]);

            setClienteId(
                clienteCriado.id
            );

            setNovoClienteNome("");
            setNovoClienteTelefone("");
            setNovoClienteEmail("");
            setNovoClienteNotas("");
            setNovoCliente(false);
        } catch {
            setErroCliente(
                "Não foi possível criar o cliente."
            );
        } finally {
            setACriarCliente(false);
        }
    }

    function cancelarNovoCliente() {
        setNovoCliente(false);
        setErroCliente("");
        setNovoClienteNome("");
        setNovoClienteTelefone("");
        setNovoClienteEmail("");
        setNovoClienteNotas("");
    }

    async function criarMarcacao() {
        if (!podeContinuar) {
            return;
        }

        const servicoSelecionado =
            servicos.find(
                (servico) =>
                    servico.id === servicoId
            );

        if (!servicoSelecionado) {
            setErroCriacao(
                "Serviço inválido."
            );
            return;
        }

        setACriar(true);
        setErroCriacao("");

        try {
            const [ano, mes, dia] =
                data
                    .split("-")
                    .map(Number);

            const [horas, minutos] =
                hora
                    .split(":")
                    .map(Number);

            const inicio = new Date(
                ano,
                mes - 1,
                dia,
                horas,
                minutos,
                0,
                0
            );

            const fim = new Date(
                inicio.getTime() +
                servicoSelecionado.duracao_minutos *
                60 *
                1000
            );

            const response = await fetch(
                "/api/booking/agendamentos",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        cliente_id:
                            clienteId,
                        servico_id:
                            servicoId,
                        profissional_id:
                            profissionalId,
                        inicio:
                            inicio.toISOString(),
                        fim:
                            fim.toISOString(),
                        notas:
                            notas.trim() ||
                            null,
                    }),
                }
            );

            const result =
                await response.json();

            if (!response.ok) {
                setErroCriacao(
                    result.error ||
                    "Não foi possível criar a marcação."
                );
                return;
            }

            const agendamentoId =
                result.agendamento?.id;

            if (!agendamentoId) {
                setErroCriacao(
                    "A marcação foi criada, mas não foi possível obter os seus dados."
                );
                return;
            }

            window.location.href =
                `/nexora-ai/booking/calendario/nova/sucesso?id=${agendamentoId}`;
        } catch {
            setErroCriacao(
                "Não foi possível criar a marcação."
            );
        } finally {
            setACriar(false);
        }
    }

    return (
        <div className="space-y-6">

            {/* Cliente */}

            <div>
                <label
                    htmlFor="cliente"
                    className="mb-2 block text-sm font-semibold text-slate-300"
                >
                    Cliente
                </label>

                {!novoCliente ? (
                    <>
                        <select
                            id="cliente"
                            name="cliente"
                            value={clienteId}
                            onChange={(event) =>
                                setClienteId(
                                    event.target.value
                                )
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                        >
                            <option
                                value=""
                                disabled
                            >
                                {clientes.length > 0
                                    ? "Selecione um cliente"
                                    : "Ainda não existem clientes"}
                            </option>

                            {clientes.map(
                                (cliente) => (
                                    <option
                                        key={
                                            cliente.id
                                        }
                                        value={
                                            cliente.id
                                        }
                                    >
                                        {cliente.nome}
                                    </option>
                                )
                            )}
                        </select>

                        <button
                            type="button"
                            onClick={() => {
                                setNovoCliente(
                                    true
                                );
                                setErroCliente("");
                            }}
                            className="mt-3 text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
                        >
                            + Novo cliente
                        </button>
                    </>
                ) : (
                    <div className="space-y-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">

                        <div>
                            <p className="text-sm font-bold text-white">
                                Novo cliente
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                Preencha os dados do novo cliente.
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="novo-cliente-nome"
                                className="mb-2 block text-xs font-semibold text-slate-400"
                            >
                                Nome *
                            </label>

                            <input
                                id="novo-cliente-nome"
                                value={
                                    novoClienteNome
                                }
                                onChange={(event) =>
                                    setNovoClienteNome(
                                        event.target.value
                                    )
                                }
                                placeholder="Nome do cliente"
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="novo-cliente-telefone"
                                className="mb-2 block text-xs font-semibold text-slate-400"
                            >
                                Telefone
                            </label>

                            <input
                                id="novo-cliente-telefone"
                                value={
                                    novoClienteTelefone
                                }
                                onChange={(event) =>
                                    setNovoClienteTelefone(
                                        event.target.value
                                    )
                                }
                                placeholder="Telefone"
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="novo-cliente-email"
                                className="mb-2 block text-xs font-semibold text-slate-400"
                            >
                                Email
                            </label>

                            <input
                                id="novo-cliente-email"
                                type="email"
                                value={
                                    novoClienteEmail
                                }
                                onChange={(event) =>
                                    setNovoClienteEmail(
                                        event.target.value
                                    )
                                }
                                placeholder="Email"
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="novo-cliente-notas"
                                className="mb-2 block text-xs font-semibold text-slate-400"
                            >
                                Notas
                            </label>

                            <textarea
                                id="novo-cliente-notas"
                                rows={3}
                                value={
                                    novoClienteNotas
                                }
                                onChange={(event) =>
                                    setNovoClienteNotas(
                                        event.target.value
                                    )
                                }
                                placeholder="Notas sobre o cliente..."
                                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400"
                            />
                        </div>

                        {erroCliente && (
                            <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-400">
                                {erroCliente}
                            </div>
                        )}

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={
                                    criarCliente
                                }
                                disabled={
                                    aCriarCliente
                                }
                                className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {aCriarCliente
                                    ? "A criar..."
                                    : "Criar cliente"}
                            </button>

                            <button
                                type="button"
                                onClick={
                                    cancelarNovoCliente
                                }
                                disabled={
                                    aCriarCliente
                                }
                                className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Serviço */}

            <div>
                <label
                    htmlFor="servico"
                    className="mb-2 block text-sm font-semibold text-slate-300"
                >
                    Serviço
                </label>

                <select
                    id="servico"
                    name="servico"
                    value={servicoId}
                    onChange={(event) => {
                        setServicoId(
                            event.target.value
                        );
                        setHora("");
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                >
                    <option
                        value=""
                        disabled
                    >
                        {servicos.length > 0
                            ? "Selecione um serviço"
                            : "Ainda não existem serviços"}
                    </option>

                    {servicos.map(
                        (servico) => (
                            <option
                                key={
                                    servico.id
                                }
                                value={
                                    servico.id
                                }
                            >
                                {servico.nome} ·{" "}
                                {
                                    servico.duracao_minutos
                                }{" "}
                                min · €{" "}
                                {Number(
                                    servico.preco
                                ).toFixed(2)}
                            </option>
                        )
                    )}
                </select>

                {servicos.length === 0 && (
                    <p className="mt-2 text-xs text-amber-400">
                        Não existem serviços ativos disponíveis.
                    </p>
                )}
            </div>

            {/* Profissional */}

            <div>
                <label
                    htmlFor="profissional"
                    className="mb-2 block text-sm font-semibold text-slate-300"
                >
                    Profissional
                </label>

                <select
                    id="profissional"
                    name="profissional"
                    value={profissionalId}
                    onChange={(event) => {
                        setProfissionalId(
                            event.target.value
                        );
                        setHora("");
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                >
                    <option
                        value=""
                        disabled
                    >
                        {profissionais.length > 0
                            ? "Selecione um profissional"
                            : "Ainda não existem profissionais"}
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

                {profissionais.length === 0 && (
                    <p className="mt-2 text-xs text-amber-400">
                        Não existem profissionais ativos disponíveis.
                    </p>
                )}
            </div>

            {/* Data */}

            <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Data
                </label>

                <DatePicker
                    value={data}
                    onChange={(value) => {
                        setData(value);
                        setHora("");
                    }}
                    minDate={getToday()}
                    maxDate={getMaxDate()}
                />

                {data && (
                    <p className="mt-2 text-xs text-slate-500">
                        Data selecionada:{" "}
                        {data}
                    </p>
                )}
            </div>

            {/* Horários disponíveis */}

            {servicoId &&
                profissionalId &&
                data && (
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <label className="block text-sm font-semibold text-slate-300">
                                    Horários disponíveis
                                </label>

                                <p className="mt-1 text-xs text-slate-500">
                                    Selecione o horário pretendido.
                                </p>
                            </div>

                            {aCarregarHorarios && (
                                <span className="text-xs font-semibold text-cyan-400">
                                    A procurar...
                                </span>
                            )}
                        </div>

                        {erroHorarios && (
                            <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-400">
                                {
                                    erroHorarios
                                }
                            </div>
                        )}

                        {!aCarregarHorarios &&
                            !erroHorarios &&
                            horarios.length ===
                                0 && (
                                <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-4 text-sm text-slate-500">
                                    Não existem horários disponíveis para esta combinação de serviço, profissional e data.
                                </div>
                            )}

                        {horarios.length >
                            0 && (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                                {horarios.map(
                                    (
                                        horario
                                    ) => {
                                        const selecionado =
                                            hora ===
                                            horario;

                                        return (
                                            <button
                                                key={
                                                    horario
                                                }
                                                type="button"
                                                onClick={() =>
                                                    setHora(
                                                        horario
                                                    )
                                                }
                                                className={[
                                                    "rounded-xl border px-4 py-3 text-sm font-bold transition",
                                                    selecionado
                                                        ? "border-cyan-400 bg-cyan-500 text-slate-950"
                                                        : "border-slate-700 bg-slate-950 text-slate-300 hover:border-cyan-400 hover:text-white",
                                                ].join(
                                                    " "
                                                )}
                                            >
                                                {
                                                    horario
                                                }
                                            </button>
                                        );
                                    }
                                )}
                            </div>
                        )}
                    </div>
                )}

            {/* Notas */}

            <div>
                <label
                    htmlFor="notas"
                    className="mb-2 block text-sm font-semibold text-slate-300"
                >
                    Notas
                </label>

                <textarea
                    id="notas"
                    name="notas"
                    rows={4}
                    value={notas}
                    onChange={(event) =>
                        setNotas(
                            event.target.value
                        )
                    }
                    placeholder="Notas opcionais sobre a marcação..."
                    className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400"
                />
            </div>

            {/* Resumo */}

            {hora && (
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                        Horário selecionado
                    </p>

                    <p className="mt-2 text-2xl font-bold text-white">
                        {data} às{" "}
                        {hora}
                    </p>
                </div>
            )}

            {erroCriacao && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-400">
                    {erroCriacao}
                </div>
            )}

            {/* Ações */}

            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">

                <Link
                    href="/nexora-ai/booking/calendario"
                    className="rounded-xl border border-slate-700 bg-slate-950 px-6 py-3 text-center text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white"
                >
                    Cancelar
                </Link>

                <button
                    type="button"
                    disabled={
                        !podeContinuar ||
                        aCriar
                    }
                    onClick={
                        criarMarcacao
                    }
                    className="rounded-xl bg-cyan-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {aCriar
                        ? "A criar..."
                        : "Continuar"}
                </button>

            </div>
        </div>
    );
}