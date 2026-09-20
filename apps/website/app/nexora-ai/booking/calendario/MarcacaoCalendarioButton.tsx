"use client";

import { useState } from "react";
import Link from "next/link";
import DetalhesMarcacaoModal from "./DetalhesMarcacaoModal";

type MarcacaoCalendarioButtonProps = {
    id: string;
    cliente: string;
    servico: string;
    profissional: string;
    inicio: string;
    fim: string;
    estado: string;
    notas: string | null;
    podeGerir: boolean;
    children: React.ReactNode;
};

export default function MarcacaoCalendarioButton({
    id,
    cliente,
    servico,
    profissional,
    inicio,
    fim,
    estado,
    notas,
    podeGerir,
    children,
}: MarcacaoCalendarioButtonProps) {
    const [aberto, setAberto] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setAberto(true)}
                className="block h-full w-full cursor-pointer text-left"
                aria-label={`Ver detalhes da marcação de ${cliente}`}
            >
                {children}
            </button>

            <DetalhesMarcacaoModal
                aberto={aberto}
                onFechar={() => setAberto(false)}
                cliente={cliente}
                servico={servico}
                profissional={profissional}
                inicio={inicio}
                fim={fim}
                estado={estado}
                notas={notas}
                podeGerir={podeGerir}
                onEditar={
                    podeGerir
                        ? () => {
                              window.location.href = `/nexora-ai/booking/calendario/editar/${id}`;
                          }
                        : undefined
                }
            />
        </>
    );
}