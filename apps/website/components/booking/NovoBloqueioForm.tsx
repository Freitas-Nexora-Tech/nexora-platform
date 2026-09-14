"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Profissional = {
    id: string;
    nome: string;
    ativo: boolean;
};

type Props = {
    profissionais: Profissional[];
};

export default function NovoBloqueioForm({
    profissionais,
}: Props) {
    const router = useRouter();

    const [profissionalId, setProfissionalId] =
        useState("");

    const [inicio, setInicio] = useState("");
    const [fim, setFim] = useState("");
    const [motivo, setMotivo] = useState("");

    const [erro, setErro] = useState("");
    const [aGuardar, setAGuardar] = useState(false);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setErro("");

        if (!profissionalId) {
            setErro("Selecione um profissional.");
            return;
        }

        if (!inicio || !fim) {
            setErro(
                "Preencha a data e hora de início e de fim."
            );
            return;
        }

        if (new Date(inicio) >= new Date(fim)) {
            setErro(
                "A data/hora de fim deve ser posterior ao início."
            );
            return;
        }

        setAGuardar(true);

        try {
            const response = await fetch(
                "/api/booking/bloqueios",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        profissional_id: profissionalId,
                        inicio,
                        fim,
                        motivo: motivo.trim() || null,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setErro(
                    data?.error ||
                        "Não foi possível criar o bloqueio."
                );
                return;
            }

            router.push(
                "/nexora-ai/booking/bloqueios"
            );

            router.refresh();
        } catch {
            setErro(
                "Ocorreu um erro ao criar o bloqueio."
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
            <div>
                <label
                    htmlFor="profissional"
                    className="mb-2 block text-sm font-semibold text-slate-300"
                >
                    Profissional
                </label>

                <select
                    id="profissional"
                    value={profissionalId}
                    onChange={(event) =>
                        setProfissionalId(
                            event.target.value
                        )
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                    required
                >
                    <option value="">
                        Selecione um profissional
                    </option>

                    {profissionais.map(
                        (profissional) => (
                            <option
                                key={profissional.id}
                                value={profissional.id}
                            >
                                {profissional.nome}
                            </option>
                        )
                    )}
                </select>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
                <div>
                    <label
                        htmlFor="inicio"
                        className="mb-2 block text-sm font-semibold text-slate-300"
                    >
                        Início
                    </label>

                    <input
                        id="inicio"
                        type="datetime-local"
                        value={inicio}
                        onChange={(event) =>
                            setInicio(
                                event.target.value
                            )
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                        required
                    />
                </div>

                <div>
                    <label
                        htmlFor="fim"
                        className="mb-2 block text-sm font-semibold text-slate-300"
                    >
                        Fim
                    </label>

                    <input
                        id="fim"
                        type="datetime-local"
                        value={fim}
                        onChange={(event) =>
                            setFim(
                                event.target.value
                            )
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                        required
                    />
                </div>
            </div>

            <div>
                <label
                    htmlFor="motivo"
                    className="mb-2 block text-sm font-semibold text-slate-300"
                >
                    Motivo
                </label>

                <textarea
                    id="motivo"
                    value={motivo}
                    onChange={(event) =>
                        setMotivo(event.target.value)
                    }
                    rows={4}
                    placeholder="Ex.: Férias, consulta, indisponibilidade..."
                    className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                />
            </div>

            {erro && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-400">
                    {erro}
                </div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={() =>
                        router.push(
                            "/nexora-ai/booking/bloqueios"
                        )
                    }
                    className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white"
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    disabled={
                        aGuardar ||
                        profissionais.length === 0
                    }
                    className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {aGuardar
                        ? "A guardar..."
                        : "Criar bloqueio"}
                </button>
            </div>
        </form>
    );
}