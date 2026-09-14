"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function NovoClienteForm() {
    const router = useRouter();

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [telefone, setTelefone] = useState("");
    const [notas, setNotas] = useState("");

    const [aGuardar, setAGuardar] = useState(false);
    const [erro, setErro] = useState("");

    async function criarCliente(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setErro("");
        setAGuardar(true);

        try {
            const response = await fetch(
                "/api/booking/clientes",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        nome,
                        email,
                        telefone,
                        notas,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                setErro(
                    result.error ||
                        "Não foi possível criar o cliente."
                );
                return;
            }

            router.push(
                "/nexora-ai/booking/clientes"
            );
            router.refresh();
        } catch {
            setErro(
                "Ocorreu um erro ao criar o cliente."
            );
        } finally {
            setAGuardar(false);
        }
    }

    return (
        <form
            onSubmit={criarCliente}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-black/10"
        >
            <div className="space-y-6">
                <div>
                    <label
                        htmlFor="nome"
                        className="mb-2 block text-sm font-semibold text-slate-200"
                    >
                        Nome do cliente
                    </label>

                    <input
                        id="nome"
                        type="text"
                        value={nome}
                        onChange={(event) =>
                            setNome(event.target.value)
                        }
                        required
                        placeholder="Nome completo"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                    />
                </div>

                <div>
                    <label
                        htmlFor="email"
                        className="mb-2 block text-sm font-semibold text-slate-200"
                    >
                        Email
                    </label>

                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) =>
                            setEmail(event.target.value)
                        }
                        placeholder="cliente@email.com"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                    />
                </div>

                <div>
                    <label
                        htmlFor="telefone"
                        className="mb-2 block text-sm font-semibold text-slate-200"
                    >
                        Telefone
                    </label>

                    <input
                        id="telefone"
                        type="tel"
                        value={telefone}
                        onChange={(event) =>
                            setTelefone(event.target.value)
                        }
                        placeholder="+351 9XX XXX XXX"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                    />
                </div>

                <div>
                    <label
                        htmlFor="notas"
                        className="mb-2 block text-sm font-semibold text-slate-200"
                    >
                        Notas
                    </label>

                    <textarea
                        id="notas"
                        value={notas}
                        onChange={(event) =>
                            setNotas(event.target.value)
                        }
                        rows={4}
                        placeholder="Informações adicionais sobre o cliente..."
                        className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                    />
                </div>

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
                                "/nexora-ai/booking/clientes"
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
                            : "✓ Criar cliente"}
                    </button>
                </div>
            </div>
        </form>
    );
}