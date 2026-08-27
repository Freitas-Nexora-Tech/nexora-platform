"use client";

import { useState } from "react";

export default function NexoraAIDemo() {
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [perguntasRestantes, setPerguntasRestantes] = useState(3);
  const [erro, setErro] = useState("");

  async function enviarPergunta(event: React.FormEvent) {
    event.preventDefault();

    if (!pergunta.trim()) {
      setErro("Escreva uma pergunta.");
      return;
    }

    if (perguntasRestantes <= 0) {
      setErro(
        "Já utilizaste as 3 perguntas gratuitas. Cria uma conta para continuar."
      );
      return;
    }

    setErro("");
    setResposta("");
    setCarregando(true);

    try {
      const response = await fetch("/api/demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mensagem: pergunta,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Não foi possível obter uma resposta."
        );
      }
      console.log("RESPOSTA DEMO:", data);
      setResposta(data.resposta);
      setPerguntasRestantes(data.perguntasRestantes);
      setPergunta("");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro. Tente novamente."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <section
      id="nexora-ai-demo"
      className="border-y border-slate-800 bg-slate-950 px-6 py-20"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-3xl">
            🤖
          </div>

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Nexora AI
          </p>

          <h2 className="mt-3 text-3xl font-extrabold text-white md:text-5xl">
            Conheça a Nexora AI
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Faça uma pergunta e descubra como a inteligência artificial pode
            ajudar a sua empresa.
          </p>

          <p className="mt-3 text-sm font-semibold text-cyan-400">
            {perguntasRestantes} perguntas gratuitas · Sem registo
          </p>
        </div>

        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl md:p-8">
          <form onSubmit={enviarPergunta}>
            <textarea
              value={pergunta}
              onChange={(event) => setPergunta(event.target.value)}
              placeholder="Ex.: Como posso automatizar o atendimento da minha empresa?"
              disabled={carregando || perguntasRestantes <= 0}
              rows={4}
              className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            />

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                A demonstração não utiliza dados privados de empresas.
              </p>

              <button
                type="submit"
                disabled={
                  carregando ||
                  perguntasRestantes <= 0 ||
                  !pergunta.trim()
                }
                className="rounded-xl bg-cyan-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {carregando ? "A pensar..." : "Perguntar →"}
              </button>
            </div>
          </form>

          {erro && (
            <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {erro}
            </div>
          )}

          {resposta && (
            <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-slate-950 p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xl">🤖</span>

                <span className="text-sm font-bold text-cyan-400">
                  Nexora AI
                </span>
              </div>

              <div className="whitespace-pre-wrap leading-7 text-slate-300">
                {resposta}
              </div>
            </div>
          )}

          {perguntasRestantes === 0 && !carregando && (
            <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5 text-center">
              <h3 className="text-lg font-bold text-white">
                Gostaste de conhecer a Nexora AI?
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Cria a tua conta gratuitamente para continuar a conversar e
                desbloquear todas as funcionalidades.
              </p>

              <a
                href="/nexora-ai/login"
                className="mt-4 inline-block rounded-xl bg-cyan-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-400"
              >
                Criar conta
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}