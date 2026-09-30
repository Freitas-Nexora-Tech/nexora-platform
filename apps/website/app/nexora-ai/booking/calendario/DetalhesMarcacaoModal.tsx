"use client";

import { useEffect } from "react";
import ConfirmarMarcacaoButton from "./ConfirmarMarcacaoButton";
import CancelarMarcacaoButton from "./CancelarMarcacaoButton";
import ConcluirMarcacaoButton from "@/components/booking/ConcluirMarcacaoButton";

type Props = {
    aberto: boolean;
    onFechar: () => void;
    agendamentoId: string;
    cliente: string;
    servico: string;
    profissional: string;
    inicio: string;
    fim: string;
    estado: string;
    notas?: string | null;
    podeGerir: boolean;
    onEditar?: () => void;
};

function nomeEstado(estado: string) {
    switch (estado) {
        case "pendente":
            return "Pendente";
        case "confirmado":
            return "Confirmada";
        case "cancelado":
            return "Cancelada";
        case "concluido":
            return "Concluída";
        default:
            return estado;
    }
}

function classeEstado(estado: string) {
    switch (estado) {
        case "pendente":
            return "border-amber-300/30 bg-amber-400/10 text-amber-300";
        case "confirmado":
            return "border-emerald-300/30 bg-emerald-400/10 text-emerald-300";
        case "cancelado":
            return "border-red-300/30 bg-red-400/10 text-red-300";
        case "concluido":
            return "border-sky-300/30 bg-sky-400/10 text-sky-300";
        default:
            return "border-slate-700 bg-slate-800 text-slate-300";
    }
}

function formatarDataHora(data: string) {
    try {
        return new Intl.DateTimeFormat("pt-PT", {
            dateStyle: "full",
            timeStyle: "short",
            timeZone: "Europe/Lisbon",
        }).format(new Date(data));
    } catch {
        return data;
    }
}

function formatarHora(data: string) {
    try {
        return new Intl.DateTimeFormat("pt-PT", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Lisbon",
        }).format(new Date(data));
    } catch {
        return data;
    }
}

export default function DetalhesMarcacaoModal({
    aberto,
    onFechar,
    agendamentoId,
    cliente,
    servico,
    profissional,
    inicio,
    fim,
    estado,
    notas,
    podeGerir,
    onEditar,
}: Props) {
    useEffect(() => {
        if (!aberto) {
            return;
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onFechar();
            }
        };

        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener(
                "keydown",
                handleEscape,
            );
        };
    }, [aberto, onFechar]);

    if (!aberto) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onFechar();
                }
            }}
        >
            <div
                className="w-full max-w-lg max-h-[90vh] overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 text-white shadow-2xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="detalhes-marcacao-titulo"
            >
                <div className="flex items-start justify-between border-b border-slate-800 px-6 py-5">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
                            Detalhes da marcação
                        </p>

                        <h2
                            id="detalhes-marcacao-titulo"
                            className="mt-2 break-words text-2xl font-bold text-white"
                        >
                            {cliente}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onFechar}
                        className="ml-4 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-400 transition hover:border-slate-600 hover:text-white"
                        aria-label="Fechar"
                    >
                        ✕
                    </button>
                </div>

                <div className="max-h-[62vh] space-y-5 overflow-y-auto px-6 py-5">
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Estado
                        </p>

                        <span
                            className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${classeEstado(
                                estado,
                            )}`}
                        >
                            {nomeEstado(estado)}
                        </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Cliente
                            </p>
                            <p className="mt-1 break-words font-semibold text-slate-100">
                                {cliente}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Serviço
                            </p>
                            <p className="mt-1 break-words font-semibold text-slate-100">
                                {servico}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Profissional
                            </p>
                            <p className="mt-1 break-words font-semibold text-slate-100">
                                {profissional}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Horário
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-100">
                                {formatarDataHora(inicio)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                até {formatarHora(fim)}
                            </p>
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Notas
                        </p>

                        <div className="min-h-[70px] rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                            {notas ? (
                                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-300">
                                    {notas}
                                </p>
                            ) : (
                                <p className="text-sm italic text-slate-600">
                                    Sem notas registadas.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-800 bg-slate-950/60 px-6 py-4">
                    {podeGerir ? (
                        <div className="flex flex-wrap gap-2">
                            {onEditar && (
                                <button
                                    type="button"
                                    onClick={onEditar}
                                    className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:border-cyan-400/50 hover:text-cyan-400"
                                >
                                    ✎ Editar
                                </button>
                            )}

                            {estado === "pendente" && (
                                <ConfirmarMarcacaoButton
                                    agendamentoId={agendamentoId}
                                />
                            )}

                            {(estado === "pendente" ||
                                estado === "confirmado") && (
                                <CancelarMarcacaoButton
                                    agendamentoId={agendamentoId}
                                />
                            )}

                            {estado === "confirmado" && (
                                <ConcluirMarcacaoButton
                                    agendamentoId={agendamentoId}
                                />
                            )}

                            <button
                                type="button"
                                onClick={onFechar}
                                className="ml-auto rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                            >
                                Fechar
                            </button>
                        </div>
                    ) : (
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={onFechar}
                                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                            >
                                Fechar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
