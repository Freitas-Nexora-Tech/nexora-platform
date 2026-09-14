"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
    profissionalId: string;
    ativo: boolean;
};

export default function AlterarEstadoProfissionalButton({
    profissionalId,
    ativo,
}: Props) {
    const router = useRouter();

    const [aAlterar, setAAlterar] = useState(false);
    const [erro, setErro] = useState("");

    async function alterarEstado() {
        setAAlterar(true);
        setErro("");

        try {
            const response = await fetch(
                `/api/booking/profissionais/${profissionalId}/estado`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        ativo: !ativo,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                setErro(
                    result.error ||
                        "Não foi possível alterar o estado do profissional."
                );
                return;
            }

            router.refresh();
        } catch {
            setErro(
                "Ocorreu um erro ao alterar o estado do profissional."
            );
        } finally {
            setAAlterar(false);
        }
    }

    return (
        <div className="flex flex-col items-end gap-2">
            <button
                type="button"
                onClick={alterarEstado}
                disabled={aAlterar}
                className={`inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    ativo
                        ? "border-red-400/30 bg-red-400/10 text-red-400 hover:bg-red-400/20"
                        : "border-emerald-400/30 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20"
                }`}
            >
                {aAlterar
                    ? "A alterar..."
                    : ativo
                      ? "Desativar"
                      : "Ativar"}
            </button>

            {erro && (
                <p className="text-xs text-red-400">
                    {erro}
                </p>
            )}
        </div>
    );
}