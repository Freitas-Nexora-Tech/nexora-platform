"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
    agendamentoId: string;
};

export default function CancelarMarcacaoButton({
    agendamentoId,
}: Props) {
    const router = useRouter();

    const [aCancelar, setACancelar] =
        useState(false);
    const [erro, setErro] = useState("");

    async function cancelar() {
        const confirmar =
            window.confirm(
                "Tem a certeza de que pretende cancelar esta marcação?"
            );

        if (!confirmar) {
            return;
        }

        setACancelar(true);
        setErro("");

        try {
            const response = await fetch(
                `/api/booking/agendamentos/${agendamentoId}/cancelar`,
                {
                    method: "PATCH",
                }
            );

            const result =
                await response.json();

            if (!response.ok) {
                setErro(
                    result.error ||
                        "Não foi possível cancelar a marcação."
                );
                return;
            }

            router.refresh();
        } catch {
            setErro(
                "Ocorreu um erro ao cancelar a marcação."
            );
        } finally {
            setACancelar(false);
        }
    }

    return (
        <div className="flex flex-col items-end gap-2">
            <button
                type="button"
                onClick={cancelar}
                disabled={aCancelar}
                className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {aCancelar
                    ? "A cancelar..."
                    : "✕ Cancelar marcação"}
            </button>

            {erro && (
                <p className="text-xs text-red-400">
                    {erro}
                </p>
            )}
        </div>
    );
}