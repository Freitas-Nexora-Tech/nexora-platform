"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
    bloqueioId: string;
};

export default function EliminarBloqueioButton({
    bloqueioId,
}: Props) {
    const router = useRouter();

    const [aEliminar, setAEliminar] =
        useState(false);
    const [erro, setErro] = useState("");

    async function eliminarBloqueio() {
        const confirmado = window.confirm(
            "Tem a certeza de que pretende eliminar este bloqueio?"
        );

        if (!confirmado) {
            return;
        }

        setErro("");
        setAEliminar(true);

        try {
            const response = await fetch(
                `/api/booking/bloqueios/${bloqueioId}`,
                {
                    method: "DELETE",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setErro(
                    data?.error ||
                        "Não foi possível eliminar o bloqueio."
                );
                return;
            }

            router.refresh();
        } catch {
            setErro(
                "Ocorreu um erro ao eliminar o bloqueio."
            );
        } finally {
            setAEliminar(false);
        }
    }

    return (
        <div>
            <button
                type="button"
                onClick={eliminarBloqueio}
                disabled={aEliminar}
                className="inline-flex items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:border-red-400/40 hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {aEliminar
                    ? "A eliminar..."
                    : "Eliminar"}
            </button>

            {erro && (
                <p className="mt-2 text-xs text-red-400">
                    {erro}
                </p>
            )}
        </div>
    );
}