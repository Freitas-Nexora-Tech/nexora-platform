"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function NovoServicoForm() {
    const router = useRouter();

    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");
    const [duracao, setDuracao] = useState("60");
    const [preco, setPreco] = useState("");
    const [ativo, setAtivo] = useState(true);

    const [aGuardar, setAGuardar] = useState(false);
    const [erro, setErro] = useState("");

    async function criarServico(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setErro("");
        setAGuardar(true);

        try {
            const response = await fetch("/api/booking/servicos", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nome,
                    descricao,
                    duracao_minutos: Number(duracao),
                    preco: Number(preco),
                    ativo,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                setErro(
                    result.error ||
                        "Não foi possível criar o serviço."
                );
                return;
            }

            router.push("/nexora-ai/booking/servicos");
            router.refresh();
        } catch {
            setErro(
                "Ocorreu um erro ao criar o serviço."
            );
        } finally {
            setAGuardar(false);
        }
    }

    return (
        <form
            onSubmit={criarServico}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-black/10"
        >
            <div className="space-y-6">
                <div>
                    <label
                        htmlFor="nome"
                        className="mb-2 block text-sm font-semibold text-slate-200"
                    >
                        Nome do serviço
                    </label>

                    <input
                        id="nome"
                        type="text"
                        value={nome}
                        onChange={(event) =>
                            setNome(event.target.value)
                        }
                        placeholder="Ex.: Massagem Relaxante"
                        required
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                    />
                </div>

                <div>
                    <label
                        htmlFor="descricao"
                        className="mb-2 block text-sm font-semibold text-slate-200"
                    >
                        Descrição
                    </label>

                    <textarea
                        id="descricao"
                        value={descricao}
                        onChange={(event) =>
                            setDescricao(event.target.value)
                        }
                        placeholder="Descreva brevemente o serviço..."
                        rows={4}
                        className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                    />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                        <label
                            htmlFor="duracao"
                            className="mb-2 block text-sm font-semibold text-slate-200"
                        >
                            Duração
                        </label>

                        <div className="relative">
                            <input
                                id="duracao"
                                type="number"
                                min="5"
                                step="5"
                                value={duracao}
                                onChange={(event) =>
                                    setDuracao(event.target.value)
                                }
                                required
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-14 text-white outline-none transition focus:border-cyan-400"
                            />

                            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                                min
                            </span>
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="preco"
                            className="mb-2 block text-sm font-semibold text-slate-200"
                        >
                            Preço
                        </label>

                        <div className="relative">
                            <input
                                id="preco"
                                type="number"
                                min="0"
                                step="0.01"
                                value={preco}
                                onChange={(event) =>
                                    setPreco(event.target.value)
                                }
                                placeholder="50.00"
                                required
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-10 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                            />

                            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                                €
                            </span>
                        </div>
                    </div>
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <input
                        type="checkbox"
                        checked={ativo}
                        onChange={(event) =>
                            setAtivo(event.target.checked)
                        }
                        className="h-4 w-4 accent-cyan-400"
                    />

                    <span>
                        <span className="block text-sm font-semibold text-slate-200">
                            Serviço ativo
                        </span>

                        <span className="mt-1 block text-xs text-slate-500">
                            O serviço poderá ser utilizado nas marcações.
                        </span>
                    </span>
                </label>

                {erro && (
                    <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-400">
                        {erro}
                    </div>
                )}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={() =>
                            router.push(
                                "/nexora-ai/booking/servicos"
                            )
                        }
                        className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        disabled={aGuardar}
                        className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {aGuardar
                            ? "A criar..."
                            : "✓ Criar serviço"}
                    </button>
                </div>
            </div>
        </form>
    );
}