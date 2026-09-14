"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
    clienteId: string;
    clienteNome: string;
};

export default function EliminarClienteButton({
    clienteId,
    clienteNome,
}: Props) {
    const router = useRouter();

    const [aEliminar, setAEliminar] = useState(false);
    const [erro, setErro] = useState("");

    async function handleEliminar() {
        const confirmar = window.confirm(
            `Tem a certeza que pretende eliminar o cliente "${clienteNome}"?`
        );

        if (!confirmar) {
            return;
        }

        setErro("");
        setAEliminar(true);

        try {
            const response = await fetch(
                `/api/booking/clientes/${clienteId}`,
                {
                    method: "DELETE",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.error ||
                        "Não foi possível eliminar o cliente."
                );
            }

            router.refresh();
        } catch (error) {
            setErro(
                error instanceof Error
                    ? error.message
                    : "Ocorreu um erro ao eliminar o cliente."
            );
        } finally {
            setAEliminar(false);
        }
    }

    return (
        <div className="flex flex-col items-end gap-2">
            <button
                type="button"
                onClick={handleEliminar}
                disabled={aEliminar}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300 transition hover:border-red-400/50 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {aEliminar ? "A eliminar..." : "Eliminar"}
            </button>

            {erro && (
                <p className="max-w-xs text-right text-xs text-red-300">
                    {erro}
                </p>
            )}
        </div>
    );
}