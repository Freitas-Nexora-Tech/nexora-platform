"use client";

import { useEffect } from "react";

type DetalhesMarcacaoModalProps = {
    aberto: boolean;
    onFechar: () => void;
    cliente: string;
    servico: string;
    profissional: string;
    inicio: string;
    fim: string;
    estado: string;
    notas?: string | null;
    podeGerir: boolean;
    onEditar?: () => void;
    onConfirmar?: () => void;
    onCancelar?: () => void;
    onConcluir?: () => void;
};

function nomeEstado(estado: string) {
    switch (estado) {
        case "pendente":
            return "Pendente";
        case "confirmado":
            return "Confirmado";
        case "cancelado":
            return "Cancelado";
        case "concluido":
            return "Concluído";
        default:
            return estado;
    }
}

function classeEstado(estado: string) {
    switch (estado) {
        case "pendente":
            return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "confirmado":
            return "bg-blue-100 text-blue-800 border-blue-200";
        case "cancelado":
            return "bg-red-100 text-red-800 border-red-200";
        case "concluido":
            return "bg-green-100 text-green-800 border-green-200";
        default:
            return "bg-gray-100 text-gray-800 border-gray-200";
    }
}

function formatarDataHora(data: string) {
    try {
        return new Intl.DateTimeFormat("pt-PT", {
            dateStyle: "full",
            timeStyle: "short",
        }).format(new Date(data));
    } catch {
        return data;
    }
}

export default function DetalhesMarcacaoModal({
    aberto,
    onFechar,
    cliente,
    servico,
    profissional,
    inicio,
    fim,
    estado,
    notas,
    podeGerir,
    onEditar,
    onConfirmar,
    onCancelar,
    onConcluir,
}: DetalhesMarcacaoModalProps) {
    useEffect(() => {
        if (!aberto) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onFechar();
            }
        };

        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [aberto, onFechar]);

    if (!aberto) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onFechar();
                }
            }}
        >
            <div
                
                className="w-full max-w-md max-h-[85vh] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="detalhes-marcacao-titulo"
            >
                {/* Cabeçalho */}
                <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Detalhes da marcação
                        </p>

                        <h2
                            id="detalhes-marcacao-titulo"
                            className="mt-1 text-lg font-bold text-gray-900"
                        >
                            {cliente}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onFechar}
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                        aria-label="Fechar"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                </div>

                {/* Conteúdo */}
               <div className="max-h-[60vh] space-y-4 overflow-y-auto px-5 py-4">
                    {/* Estado */}
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Estado
                        </p>

                        <span
                            className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${classeEstado(
                                estado
                            )}`}
                        >
                            {nomeEstado(estado)}
                        </span>
                    </div>

                    {/* Informações */}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Cliente
                            </p>
                            <p className="mt-1 break-words font-semibold text-gray-900">
                                {cliente}
                            </p>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Serviço
                            </p>
                            <p className="mt-1 break-words font-semibold text-gray-900">
                                {servico}
                            </p>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Profissional
                            </p>
                            <p className="mt-1 break-words font-semibold text-gray-900">
                                {profissional}
                            </p>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Horário
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-900">
                                {formatarDataHora(inicio)}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                                até{" "}
                                {new Intl.DateTimeFormat("pt-PT", {
                                    timeStyle: "short",
                                }).format(new Date(fim))}
                            </p>
                        </div>
                    </div>

                    {/* Notas */}
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Notas
                        </p>

                        <div className="min-h-[60px] rounded-xl border border-gray-200 bg-gray-50 p-3">
                            {notas ? (
                                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700">
                                    {notas}
                                </p>
                            ) : (
                                <p className="text-sm italic text-gray-400">
                                    Sem notas registadas.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Ações */}
                {podeGerir && (
                    <div className="border-t border-gray-200 bg-gray-50 px-5 py-3">
                        <div className="flex flex-wrap gap-2">
                            {onEditar && (
                                <button
                                    type="button"
                                    onClick={onEditar}
                                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                                >
                                    Editar
                                </button>
                            )}

                            {estado === "pendente" && onConfirmar && (
                                <button
                                    type="button"
                                    onClick={onConfirmar}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                                >
                                    Confirmar
                                </button>
                            )}

                            {estado !== "cancelado" &&
                                estado !== "concluido" &&
                                onCancelar && (
                                    <button
                                        type="button"
                                        onClick={onCancelar}
                                        className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                                    >
                                        Cancelar
                                    </button>
                                )}

                            {estado === "confirmado" && onConcluir && (
                                <button
                                    type="button"
                                    onClick={onConcluir}
                                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                                >
                                    Concluir
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={onFechar}
                                className="ml-auto rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                )}

                {!podeGerir && (
                    <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-6 py-4">
                        <button
                            type="button"
                            onClick={onFechar}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                        >
                            Fechar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}