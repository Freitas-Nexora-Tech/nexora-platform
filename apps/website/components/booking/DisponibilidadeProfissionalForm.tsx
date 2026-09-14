"use client";

import { useState } from "react";

type Horario = {
    dia_semana: number;
    hora_inicio: string;
    hora_fim: string;
    ativo: boolean;
};

type Props = {
    profissionalId: string;
    disponibilidade: Horario[];
};

const diasSemana = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
];

function criarHorariosIniciais(
    disponibilidade: Horario[]
): Horario[] {
    const resultado: Horario[] = [];

    for (let dia = 0; dia <= 6; dia++) {
        const horariosDoDia = disponibilidade.filter(
            (horario) => horario.dia_semana === dia
        );

        if (horariosDoDia.length > 0) {
            resultado.push(
                ...horariosDoDia.map((horario) => ({
                    dia_semana: dia,
                    hora_inicio: horario.hora_inicio.slice(0, 5),
                    hora_fim: horario.hora_fim.slice(0, 5),
                    ativo: horario.ativo,
                }))
            );
        } else {
            resultado.push({
                dia_semana: dia,
                hora_inicio: "09:00",
                hora_fim: "13:00",
                ativo: false,
            });
        }
    }

    return resultado;
}

export default function DisponibilidadeProfissionalForm({
    profissionalId,
    disponibilidade,
}: Props) {
    const [horarios, setHorarios] = useState<Horario[]>(
        criarHorariosIniciais(disponibilidade)
    );

    const [aGuardar, setAGuardar] = useState(false);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    function atualizarHorario(
        indice: number,
        campo: keyof Horario,
        valor: string | boolean
    ) {
        setHorarios((atuais) =>
            atuais.map((horario, index) =>
                index === indice
                    ? {
                          ...horario,
                          [campo]: valor,
                      }
                    : horario
            )
        );
    }

    function adicionarHorario(diaSemana: number) {
        setHorarios((atuais) => [
            ...atuais,
            {
                dia_semana: diaSemana,
                hora_inicio: "14:00",
                hora_fim: "18:00",
                ativo: true,
            },
        ]);
    }

    function removerHorario(indice: number) {
        setHorarios((atuais) =>
            atuais.filter((_, index) => index !== indice)
        );
    }

    async function guardarDisponibilidade() {
        setErro("");
        setSucesso("");
        setAGuardar(true);

        try {
            const response = await fetch(
                `/api/booking/profissionais/${profissionalId}/disponibilidade`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        horarios,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                setErro(
                    result.error ||
                        "Não foi possível guardar a disponibilidade."
                );
                return;
            }

            setSucesso(
                "Disponibilidade guardada com sucesso."
            );
        } catch {
            setErro(
                "Ocorreu um erro ao guardar a disponibilidade."
            );
        } finally {
            setAGuardar(false);
        }
    }

    return (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-black/10">
            <div>
                <h2 className="text-lg font-bold text-white">
                    Disponibilidade
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Defina os dias e horários em que este profissional
                    pode receber marcações.
                </p>
            </div>

            <div className="mt-6 space-y-4">
                {diasSemana.map((dia, diaSemana) => {
                    const horariosDoDia = horarios
                        .map((horario, indice) => ({
                            horario,
                            indice,
                        }))
                        .filter(
                            ({ horario }) =>
                                horario.dia_semana === diaSemana
                        );

                    const diaAtivo = horariosDoDia.some(
                        ({ horario }) => horario.ativo
                    );

                    return (
                        <div
                            key={diaSemana}
                            className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                        >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <label className="flex cursor-pointer items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={diaAtivo}
                                        onChange={(event) => {
                                            const ativo =
                                                event.target.checked;

                                            setHorarios((atuais) =>
                                                atuais.map(
                                                    (horario) =>
                                                        horario.dia_semana ===
                                                        diaSemana
                                                            ? {
                                                                  ...horario,
                                                                  ativo,
                                                              }
                                                            : horario
                                                )
                                            );
                                        }}
                                        className="h-4 w-4 accent-cyan-400"
                                    />

                                    <span className="text-sm font-semibold text-slate-200">
                                        {dia}
                                    </span>
                                </label>

                                <button
                                    type="button"
                                    onClick={() =>
                                        adicionarHorario(diaSemana)
                                    }
                                    className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-400"
                                >
                                    + Adicionar período
                                </button>
                            </div>

                            <div className="mt-4 space-y-3">
                                {horariosDoDia.map(
                                    ({ horario, indice }) => (
                                        <div
                                            key={indice}
                                            className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3 sm:flex-row sm:items-end"
                                        >
                                            <div className="flex-1">
                                                <label
                                                    htmlFor={`inicio-${indice}`}
                                                    className="mb-1 block text-xs font-medium text-slate-500"
                                                >
                                                    Início
                                                </label>

                                                <input
                                                    id={`inicio-${indice}`}
                                                    type="time"
                                                    value={
                                                        horario.hora_inicio
                                                    }
                                                    onChange={(event) =>
                                                        atualizarHorario(
                                                            indice,
                                                            "hora_inicio",
                                                            event.target.value
                                                        )
                                                    }
                                                    disabled={
                                                        !horario.ativo
                                                    }
                                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                                                />
                                            </div>

                                            <div className="flex-1">
                                                <label
                                                    htmlFor={`fim-${indice}`}
                                                    className="mb-1 block text-xs font-medium text-slate-500"
                                                >
                                                    Fim
                                                </label>

                                                <input
                                                    id={`fim-${indice}`}
                                                    type="time"
                                                    value={
                                                        horario.hora_fim
                                                    }
                                                    onChange={(event) =>
                                                        atualizarHorario(
                                                            indice,
                                                            "hora_fim",
                                                            event.target.value
                                                        )
                                                    }
                                                    disabled={
                                                        !horario.ativo
                                                    }
                                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removerHorario(indice)
                                                }
                                                className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-400/20"
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {erro && (
                <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-400">
                    {erro}
                </div>
            )}

            {sucesso && (
                <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-400">
                    {sucesso}
                </div>
            )}

            <div className="mt-6 flex justify-end">
                <button
                    type="button"
                    onClick={guardarDisponibilidade}
                    disabled={aGuardar}
                    className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {aGuardar
                        ? "A guardar..."
                        : "✓ Guardar disponibilidade"}
                </button>
            </div>
        </section>
    );
}