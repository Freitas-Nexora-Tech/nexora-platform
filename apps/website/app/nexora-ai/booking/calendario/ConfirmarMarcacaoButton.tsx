"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
    agendamentoId: string;
};

export default function ConfirmarMarcacaoButton({
    agendamentoId,
}: Props) {
    const router = useRouter();
    const [aConfirmar, setAConfirmar] = useState(false);
    const [erro, setErro] = useState("");

    async function confirmar() {
        setAConfirmar(true);
        setErro("");

        try {
            const response = await fetch(
                `/api/booking/agendamentos/${agendamentoId}/estado`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        estado: "confirmado",
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                setErro(
                    result.error ||
                        "Não foi possível confirmar a marcação."
                );
                return;
            }

            router.refresh();
        } catch {
            setErro(
                "Ocorreu um erro ao confirmar a marcação."
            );
        } finally {
            setAConfirmar(false);
        }
    }

    return (
        <div className="flex flex-col items-end gap-2">
            <button
                type="button"
                onClick={confirmar}
                disabled={aConfirmar}
                className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {aConfirmar
                    ? "A confirmar..."
                    : "✓ Aceitar marcação"}
            </button>

            {erro && (
                <p className="text-xs text-red-400">
                    {erro}
                </p>
            )}
        </div>
    );
}