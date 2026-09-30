"use client";

import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import DetalhesMarcacaoModal from "./DetalhesMarcacaoModal";

type Props = {
    id: string;
    cliente: string;
    servico: string;
    profissional: string;
    inicio: string;
    fim: string;
    estado: string;
    notas?: string | null;
    podeGerir: boolean;
    children: ReactNode;
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
}: Props) {
    const router = useRouter();
    const [aberto, setAberto] = useState(false);

    function abrirModal() {
        setAberto(true);
    }

    function fecharModal() {
        setAberto(false);
    }

    function editar() {
        setAberto(false);
        router.push(
            `/nexora-ai/booking/calendario/editar/${id}`,
        );
    }

    return (
        <>
            <button
                type="button"
                onClick={abrirModal}
                className="block h-full w-full cursor-pointer text-left"
                aria-label={`Abrir detalhes da marcação de ${cliente}`}
            >
                {children}
            </button>

            <DetalhesMarcacaoModal
                aberto={aberto}
                onFechar={fecharModal}
                agendamentoId={id}
                cliente={cliente}
                servico={servico}
                profissional={profissional}
                inicio={inicio}
                fim={fim}
                estado={estado}
                notas={notas}
                podeGerir={podeGerir}
                onEditar={editar}
            />
        </>
    );
}
