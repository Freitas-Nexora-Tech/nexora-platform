"use client";

import { useState } from "react";

type AIControlProps = {
  companyId: string;
  aiEnabled: boolean;
};

export default function AIControl({
  companyId,
  aiEnabled,
}: AIControlProps) {
  const [estaAtiva, setEstaAtiva] = useState(aiEnabled);
  const [aCarregar, setACarregar] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function alterarEstado(ativar: boolean) {
    setErro("");
    setMensagem("");
    setACarregar(true);

    try {
      const response = await fetch(
        `/api/admin/clients/${companyId}/ai`,
        {
          method: ativar ? "POST" : "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Não foi possível alterar o estado da IA."
        );
      }

      setEstaAtiva(ativar);

      setMensagem(
        ativar
          ? "Nexora AI reativada com sucesso."
          : "Nexora AI suspensa com sucesso."
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro inesperado."
      );
    } finally {
      setACarregar(false);
    }
  }

  return (
    <div className="rounded-3xl border border-red-400/20 bg-slate-900">

      <div className="border-b border-slate-800 px-6 py-5">
        <h3 className="text-xl font-bold">
          Controlo da conta
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Controle o acesso deste cliente à Nexora AI.
        </p>
      </div>

      <div className="grid gap-4 p-6 md:grid-cols-2">

        {/* Suspender */}

        <div className="rounded-2xl border border-red-400/10 bg-red-400/5 p-5">

          <p className="font-bold text-red-400">
            🔒 Suspender Nexora AI
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Suspende temporariamente o acesso da empresa
            à inteligência artificial.
          </p>

          <button
            type="button"
            onClick={() => alterarEstado(false)}
            disabled={!estaAtiva || aCarregar}
            className="mt-5 rounded-xl border border-red-400/20 px-5 py-3 text-sm font-bold text-red-400 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {aCarregar && estaAtiva
              ? "A suspender..."
              : "Suspender IA"}
          </button>

        </div>

        {/* Reativar */}

        <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/5 p-5">

          <p className="font-bold text-emerald-400">
            ✓ Reativar Nexora AI
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Reativa o acesso à inteligência artificial
            quando a conta estiver regularizada.
          </p>

          <button
            type="button"
            onClick={() => alterarEstado(true)}
            disabled={estaAtiva || aCarregar}
            className="mt-5 rounded-xl border border-emerald-400/20 px-5 py-3 text-sm font-bold text-emerald-400 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {aCarregar && !estaAtiva
              ? "A reativar..."
              : "Reativar IA"}
          </button>

        </div>

      </div>

      {/* Estado atual */}

      <div className="border-t border-slate-800 px-6 py-5">

        <div className="flex flex-wrap items-center gap-3">

          <span className="text-sm text-slate-500">
            Estado atual da IA:
          </span>

          {estaAtiva ? (
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-400">
              ● Ativa
            </span>
          ) : (
            <span className="rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-bold text-red-400">
              🔒 Suspensa
            </span>
          )}

        </div>

        {mensagem && (
          <p className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3 text-sm text-cyan-400">
            {mensagem}
          </p>
        )}

        {erro && (
          <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-400">
            {erro}
          </p>
        )}

      </div>

    </div>
  );
}