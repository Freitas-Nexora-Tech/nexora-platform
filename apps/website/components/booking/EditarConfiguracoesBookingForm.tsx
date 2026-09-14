"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Configuracao = {
    id: string;
    agendamento_ativo: boolean;
    fuso_horario: string;
    intervalo_marcacao_minutos: number;
    antecedencia_minima_minutos: number;
    antecedencia_maxima_dias: number;
    cancelamento_ativo: boolean;
    prazo_cancelamento_minutos: number;
    capacidade_por_horario: number;
};

type Props = {
    configuracao: Configuracao;
};

export default function EditarConfiguracoesBookingForm({
    configuracao,
}: Props) {
    const router = useRouter();

    const [agendamentoAtivo, setAgendamentoAtivo] =
        useState(configuracao.agendamento_ativo);

    const [fusoHorario, setFusoHorario] =
        useState(configuracao.fuso_horario);

    const [intervalo, setIntervalo] =
        useState(
            String(
                configuracao.intervalo_marcacao_minutos
            )
        );

    const [antecedenciaMinima, setAntecedenciaMinima] =
        useState(
            String(
                configuracao.antecedencia_minima_minutos
            )
        );

    const [antecedenciaMaxima, setAntecedenciaMaxima] =
        useState(
            String(
                configuracao.antecedencia_maxima_dias
            )
        );

    const [cancelamentoAtivo, setCancelamentoAtivo] =
        useState(configuracao.cancelamento_ativo);

    const [prazoCancelamento, setPrazoCancelamento] =
        useState(
            String(
                configuracao.prazo_cancelamento_minutos
            )
        );

    const [capacidade, setCapacidade] =
        useState(
            String(
                configuracao.capacidade_por_horario
            )
        );

    const [aGuardar, setAGuardar] = useState(false);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setErro("");
        setSucesso("");

        const intervaloNumero = Number(intervalo);
        const antecedenciaMinimaNumero =
            Number(antecedenciaMinima);
        const antecedenciaMaximaNumero =
            Number(antecedenciaMaxima);
        const prazoCancelamentoNumero =
            Number(prazoCancelamento);
        const capacidadeNumero = Number(capacidade);

        if (
            !Number.isInteger(intervaloNumero) ||
            intervaloNumero <= 0
        ) {
            setErro(
                "O intervalo entre marcações deve ser um número inteiro positivo."
            );
            return;
        }

        if (
            !Number.isInteger(
                antecedenciaMinimaNumero
            ) ||
            antecedenciaMinimaNumero < 0
        ) {
            setErro(
                "A antecedência mínima deve ser igual ou superior a zero."
            );
            return;
        }

        if (
            !Number.isInteger(
                antecedenciaMaximaNumero
            ) ||
            antecedenciaMaximaNumero <= 0
        ) {
            setErro(
                "A antecedência máxima deve ser um número inteiro positivo."
            );
            return;
        }

        if (
            antecedenciaMaximaNumero * 24 * 60 <
            antecedenciaMinimaNumero
        ) {
            setErro(
                "A antecedência máxima deve ser superior à antecedência mínima."
            );
            return;
        }

        if (
            !Number.isInteger(
                prazoCancelamentoNumero
            ) ||
            prazoCancelamentoNumero < 0
        ) {
            setErro(
                "O prazo de cancelamento deve ser igual ou superior a zero."
            );
            return;
        }

        if (
            !Number.isInteger(capacidadeNumero) ||
            capacidadeNumero <= 0
        ) {
            setErro(
                "A capacidade por horário deve ser um número inteiro positivo."
            );
            return;
        }

        if (!fusoHorario.trim()) {
            setErro("O fuso horário é obrigatório.");
            return;
        }

        setAGuardar(true);

        try {
            const response = await fetch(
                "/api/booking/configuracoes",
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        agendamento_ativo:
                            agendamentoAtivo,
                        fuso_horario:
                            fusoHorario.trim(),
                        intervalo_marcacao_minutos:
                            intervaloNumero,
                        antecedencia_minima_minutos:
                            antecedenciaMinimaNumero,
                        antecedencia_maxima_dias:
                            antecedenciaMaximaNumero,
                        cancelamento_ativo:
                            cancelamentoAtivo,
                        prazo_cancelamento_minutos:
                            prazoCancelamentoNumero,
                        capacidade_por_horario:
                            capacidadeNumero,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.error ||
                        "Não foi possível atualizar as configurações."
                );
            }

            setSucesso(
                "Configurações atualizadas com sucesso."
            );

            setTimeout(() => {
                router.push(
                    "/nexora-ai/booking/configuracoes"
                );
                router.refresh();
            }, 700);
        } catch (error) {
            setErro(
                error instanceof Error
                    ? error.message
                    : "Ocorreu um erro ao atualizar as configurações."
            );
        } finally {
            setAGuardar(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6"
        >
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <h2 className="text-lg font-bold">
                    Funcionamento da agenda
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Defina as regras gerais da agenda.
                </p>

                <div className="mt-6 space-y-5">
                    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                        <div>
                            <p className="font-semibold text-slate-200">
                                Agendamentos ativos
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Permitir que os clientes façam novos agendamentos.
                            </p>
                        </div>

                        <input
                            type="checkbox"
                            checked={agendamentoAtivo}
                            onChange={(event) =>
                                setAgendamentoAtivo(
                                    event.target.checked
                                )
                            }
                            className="h-5 w-5 accent-cyan-400"
                        />
                    </label>

                    <div>
                        <label
                            htmlFor="fusoHorario"
                            className="mb-2 block text-sm font-medium text-slate-200"
                        >
                            Fuso horário
                        </label>

                        <select
                            id="fusoHorario"
                            value={fusoHorario}
                            onChange={(event) =>
                                setFusoHorario(
                                    event.target.value
                                )
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
                        >
                            <option value="Europe/Lisbon">
                                Europe/Lisbon
                            </option>

                            <option value="Europe/Madrid">
                                Europe/Madrid
                            </option>

                            <option value="Europe/Paris">
                                Europe/Paris
                            </option>
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="intervalo"
                            className="mb-2 block text-sm font-medium text-slate-200"
                        >
                            Intervalo entre marcações (minutos)
                        </label>

                        <input
                            id="intervalo"
                            type="number"
                            min="1"
                            step="1"
                            value={intervalo}
                            onChange={(event) =>
                                setIntervalo(
                                    event.target.value
                                )
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="capacidade"
                            className="mb-2 block text-sm font-medium text-slate-200"
                        >
                            Capacidade por horário
                        </label>

                        <input
                            id="capacidade"
                            type="number"
                            min="1"
                            step="1"
                            value={capacidade}
                            onChange={(event) =>
                                setCapacidade(
                                    event.target.value
                                )
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
                        />
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <h2 className="text-lg font-bold">
                    Antecedência dos agendamentos
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Controle quando os clientes podem marcar.
                </p>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <div>
                        <label
                            htmlFor="antecedenciaMinima"
                            className="mb-2 block text-sm font-medium text-slate-200"
                        >
                            Antecedência mínima (minutos)
                        </label>

                        <input
                            id="antecedenciaMinima"
                            type="number"
                            min="0"
                            step="1"
                            value={antecedenciaMinima}
                            onChange={(event) =>
                                setAntecedenciaMinima(
                                    event.target.value
                                )
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="antecedenciaMaxima"
                            className="mb-2 block text-sm font-medium text-slate-200"
                        >
                            Antecedência máxima (dias)
                        </label>

                        <input
                            id="antecedenciaMaxima"
                            type="number"
                            min="1"
                            step="1"
                            value={antecedenciaMaxima}
                            onChange={(event) =>
                                setAntecedenciaMaxima(
                                    event.target.value
                                )
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
                        />
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <h2 className="text-lg font-bold">
                    Cancelamentos
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Defina as regras de cancelamento.
                </p>

                <div className="mt-6 space-y-5">
                    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                        <div>
                            <p className="font-semibold text-slate-200">
                                Cancelamentos ativos
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Permitir o cancelamento de marcações pelos clientes.
                            </p>
                        </div>

                        <input
                            type="checkbox"
                            checked={cancelamentoAtivo}
                            onChange={(event) =>
                                setCancelamentoAtivo(
                                    event.target.checked
                                )
                            }
                            className="h-5 w-5 accent-cyan-400"
                        />
                    </label>

                    <div>
                        <label
                            htmlFor="prazoCancelamento"
                            className="mb-2 block text-sm font-medium text-slate-200"
                        >
                            Prazo mínimo para cancelamento (minutos)
                        </label>

                        <input
                            id="prazoCancelamento"
                            type="number"
                            min="0"
                            step="1"
                            value={prazoCancelamento}
                            onChange={(event) =>
                                setPrazoCancelamento(
                                    event.target.value
                                )
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
                        />
                    </div>
                </div>
            </section>

            {erro && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {erro}
                </div>
            )}

            {sucesso && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                    {sucesso}
                </div>
            )}

            <div className="flex flex-wrap gap-3">
                <button
                    type="submit"
                    disabled={aGuardar}
                    className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {aGuardar
                        ? "A guardar..."
                        : "Guardar configurações"}
                </button>

                <button
                    type="button"
                    onClick={() =>
                        router.push(
                            "/nexora-ai/booking/configuracoes"
                        )
                    }
                    className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold text-slate-200 transition hover:border-slate-500"
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
}