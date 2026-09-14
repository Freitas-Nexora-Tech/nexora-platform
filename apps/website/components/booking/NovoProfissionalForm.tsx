"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function NovoProfissionalForm() {
    const router = useRouter();

    const [nome, setNome] = useState("");
    const [ativo, setAtivo] = useState(true);

    const [aGuardar, setAGuardar] = useState(false);
    const [erro, setErro] = useState("");

    async function criarProfissional(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setErro("");
        setAGuardar(true);

        try {
            const response = await fetch(
                "/api/booking/profissionais",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        nome,
                        ativo,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                setErro(
                    result.error ||
                        "Não foi possível criar o profissional."
                );
                return;
            }

            router.push("/nexora-ai/booking/profissionais");
            router.refresh();
        } catch {
            setErro(
                "Ocorreu um erro ao criar o profissional."
            );
        } finally {
            setAGuardar(false);
        }
    }

    return (
        <form
            onSubmit={criarProfissional}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-black/10"
        >
            <div className="space-y-6">
                <div>
                    <label
                        htmlFor="nome"
                        className="mb-2 block text-sm font-semibold text-slate-200"
                    >
                        Nome do profissional
                    </label>

                    <input
                        id="nome"
                        type="text"
                        value={nome}
                        onChange={(event) =>
                            setNome(event.target.value)
                        }
                        placeholder="Ex.: João Silva"
                        required
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                    />
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
                            Profissional ativo
                        </span>

                        <span className="mt-1 block text-xs text-slate-500">
                            O profissional poderá ser utilizado nas marcações.
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
                                "/nexora-ai/booking/profissionais"
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
                            : "✓ Criar profissional"}
                    </button>
                </div>
            </div>
        </form>
    );
}