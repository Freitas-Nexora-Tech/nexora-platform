"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
    agendamentoId: string;
};

export default function ConcluirMarcacaoButton({
    agendamentoId,
}: Props) {
    const router = useRouter();

    const [aConcluir, setAConcluir] = useState(false);
    const [erro, setErro] = useState("");

    async function concluirMarcacao() {
        const confirmar = window.confirm(
            "Tem a certeza de que pretende marcar esta marcação como concluída?"
        );

        if (!confirmar) {
            return;
        }

        try {
            setAConcluir(true);
            setErro("");

            const resposta = await fetch(
                `/api/booking/agendamentos/${agendamentoId}/concluir`,
                {
                    method: "PATCH",
                }
            );

            const resultado =
                await resposta.json().catch(() => null);

            if (!resposta.ok) {
                throw new Error(
                    resultado?.error ||
                        "Não foi possível concluir a marcação."
                );
            }

            router.refresh();
        } catch (error) {
            setErro(
                error instanceof Error
                    ? error.message
                    : "Ocorreu um erro ao concluir a marcação."
            );
        } finally {
            setAConcluir(false);
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <button
                type="button"
                onClick={concluirMarcacao}
                disabled={aConcluir}
                className="inline-flex w-fit items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {aConcluir
                    ? "A concluir..."
                    : "✓ Marcar como concluída"}
            </button>

            {erro && (
                <p className="text-xs text-red-400">
                    {erro}
                </p>
            )}
        </div>
    );
}