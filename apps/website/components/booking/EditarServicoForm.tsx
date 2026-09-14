"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Servico = {
    id: string;
    nome: string;
    descricao: string | null;
    duracao_minutos: number;
    preco: number;
    ativo: boolean;
};

type Profissional = {
    id: string;
    nome: string;
    ativo: boolean;
};

type Props = {
    servico: Servico;
    profissionais: Profissional[];
    profissionaisAssociados: string[];
};

export default function EditarServicoForm({
    servico,
    profissionais,
    profissionaisAssociados,
}: Props) {
    const router = useRouter();

    const [nome, setNome] = useState(servico.nome);
    const [descricao, setDescricao] = useState(
        servico.descricao ?? ""
    );
    const [duracao, setDuracao] = useState(
        String(servico.duracao_minutos)
    );
    const [preco, setPreco] = useState(
        String(servico.preco)
    );
    const [ativo, setAtivo] = useState(servico.ativo);

    const [associados, setAssociados] = useState<string[]>(
        profissionaisAssociados
    );

    const [alterandoProfissional, setAlterandoProfissional] =
        useState<string | null>(null);

    const [aGuardar, setAGuardar] = useState(false);
    const [erro, setErro] = useState("");

    async function alterarAssociacao(
        profissionalId: string,
        associadoAtual: boolean
    ) {
        setErro("");
        setAlterandoProfissional(profissionalId);

        try {
            const response = await fetch(
                `/api/booking/servicos/${servico.id}/profissionais`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        profissional_id: profissionalId,
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
                    return atuais.includes(profissionalId)
                        ? atuais
                        : [...atuais, profissionalId];
                }

                return atuais.filter(
                    (id) => id !== profissionalId
                );
            });
        } catch {
            setErro(
                "Ocorreu um erro ao alterar a associação."
            );
        } finally {
            setAlterandoProfissional(null);
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
                `/api/booking/servicos/${servico.id}`,
                {
                    method: "PATCH",
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
                }
            );

            const result = await response.json();

            if (!response.ok) {
                setErro(
                    result.error ||
                        "Não foi possível atualizar o serviço."
                );
                return;
            }

            router.push("/nexora-ai/booking/servicos");
            router.refresh();
        } catch {
            setErro(
                "Ocorreu um erro ao atualizar o serviço."
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
                        Nome do serviço
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
                                required
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-10 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                            />

                            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                                €
                            </span>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-200">
                            Profissionais associados
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Escolha quais profissionais podem realizar este serviço.
                        </p>
                    </div>

                    {profissionais.length === 0 ? (
                        <p className="mt-4 text-sm text-slate-500">
                            Não existem profissionais ativos nesta empresa.
                        </p>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {profissionais.map((profissional) => {
                                const associado =
                                    associados.includes(
                                        profissional.id
                                    );

                                const alterando =
                                    alterandoProfissional ===
                                    profissional.id;

                                return (
                                    <div
                                        key={profissional.id}
                                        className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-slate-200">
                                                {profissional.nome}
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
                                                    profissional.id,
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
                            ? "A guardar..."
                            : "✓ Guardar alterações"}
                    </button>
                </div>
            </div>
        </form>
    );
}