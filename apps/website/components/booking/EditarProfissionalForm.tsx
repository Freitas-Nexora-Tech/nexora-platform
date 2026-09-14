"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Profissional = {
    id: string;
    nome: string;
    ativo: boolean;
};

type Servico = {
    id: string;
    nome: string;
    ativo: boolean;
};

type Props = {
    profissional: Profissional;
    servicos: Servico[];
    servicosAssociados: string[];
};

export default function EditarProfissionalForm({
    profissional,
    servicos,
    servicosAssociados,
}: Props) {
    const router = useRouter();

    const [nome, setNome] = useState(profissional.nome);
    const [ativo, setAtivo] = useState(profissional.ativo);

    const [associados, setAssociados] = useState<string[]>(
        servicosAssociados
    );

    const [alterandoServico, setAlterandoServico] =
        useState<string | null>(null);

    const [aGuardar, setAGuardar] = useState(false);
    const [erro, setErro] = useState("");

    async function alterarAssociacao(
        servicoId: string,
        associadoAtual: boolean
    ) {
        setErro("");
        setAlterandoServico(servicoId);

        try {
            const response = await fetch(
                `/api/booking/profissionais/${profissional.id}/servicos`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        servico_id: servicoId,
                        associado: !associadoAtual,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                setErro(
                    result.error ||
                        "Não foi possível alterar a associação."
                );
                return;
            }

            setAssociados((atuais) => {
                if (result.associado) {
                    return atuais.includes(servicoId)
                        ? atuais
                        : [...atuais, servicoId];
                }

                return atuais.filter(
                    (id) => id !== servicoId
                );
            });
        } catch {
            setErro(
                "Ocorreu um erro ao alterar a associação."
            );
        } finally {
            setAlterandoServico(null);
        }
    }

    async function guardarAlteracoes(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setErro("");
        setAGuardar(true);

        try {
            const response = await fetch(
                `/api/booking/profissionais/${profissional.id}`,
                {
                    method: "PATCH",
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
                        "Não foi possível atualizar o profissional."
                );
                return;
            }

            router.push("/nexora-ai/booking/profissionais");
            router.refresh();
        } catch {
            setErro(
                "Ocorreu um erro ao atualizar o profissional."
            );
        } finally {
            setAGuardar(false);
        }
    }

    return (
        <form
            onSubmit={guardarAlteracoes}
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
                        required
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                    />
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-200">
                            Serviços associados
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Escolha quais serviços este profissional pode realizar.
                        </p>
                    </div>

                    {servicos.length === 0 ? (
                        <p className="mt-4 text-sm text-slate-500">
                            Ainda não existem serviços nesta empresa.
                        </p>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {servicos.map((servico) => {
                                const associado =
                                    associados.includes(servico.id);

                                const alterando =
                                    alterandoServico ===
                                    servico.id;

                                return (
                                    <div
                                        key={servico.id}
                                        className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-slate-200">
                                                {servico.nome}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                {associado
                                                    ? "Pode realizar este serviço."
                                                    : "Não está associado a este serviço."}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                alterarAssociacao(
                                                    servico.id,
                                                    associado
                                                )
                                            }
                                            disabled={alterando}
                                            className={`inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                                associado
                                                    ? "border-red-400/30 bg-red-400/10 text-red-400 hover:bg-red-400/20"
                                                    : "border-emerald-400/30 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20"
                                            }`}
                                        >
                                            {alterando
                                                ? "A alterar..."
                                                : associado
                                                  ? "Desassociar"
                                                  : "Associar"}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
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
                            ? "A guardar..."
                            : "✓ Guardar alterações"}
                    </button>
                </div>
            </div>
        </form>
    );
}