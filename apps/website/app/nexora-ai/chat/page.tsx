"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Fonte = {
  numero: number;
  titulo: string;
  url: string;
};

type Mensagem = {
  role: "user" | "assistant";
  content: string;
  fontes?: Fonte[];
};

export default function NexoraAIChatPage() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [aCarregar, setACarregar] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(
    null
  );

  const searchParams = useSearchParams();
  const conversationIdFromUrl =
    searchParams.get("conversation");

  useEffect(() => {
    if (!conversationIdFromUrl) return;

    async function carregarConversa() {
      try {
        setACarregar(true);

        const response = await fetch(
          `/api/ai?conversationId=${conversationIdFromUrl}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Não foi possível carregar a conversa."
          );
        }

        setConversationId(
          conversationIdFromUrl
        );

        setMensagens(
          data.mensagens.map(
            (item: {
              role: "user" | "assistant";
              content: string;
            }) => ({
              role: item.role,
              content: item.content,
            })
          )
        );
      } catch (error) {
        console.error(
          "Erro ao carregar conversa:",
          error
        );
      } finally {
        setACarregar(false);
      }
    }

    carregarConversa();
  }, [conversationIdFromUrl]);

  async function enviarMensagem() {
    if (!mensagem.trim() || aCarregar) {
      return;
    }

    const pergunta = mensagem.trim();

    const novaMensagem: Mensagem = {
      role: "user",
      content: pergunta,
    };

    const conversaAtualizada = [
      ...mensagens,
      novaMensagem,
    ];

    setMensagens(conversaAtualizada);
    setMensagem("");
    setACarregar(true);

    try {
      const response = await fetch(
        "/api/ai",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mensagens: conversaAtualizada,
            conversationId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Erro ao comunicar com a Nexora AI."
        );
      }

      if (data.conversationId) {
        setConversationId(
          data.conversationId
        );
      }

      const respostaAI: Mensagem = {
        role: "assistant",
        content: data.resposta,
        fontes:
          Array.isArray(data.fontes) &&
          data.fontes.length > 0
            ? data.fontes
            : undefined,
      };

      setMensagens(
        (mensagensAtuais) => [
          ...mensagensAtuais,
          respostaAI,
        ]
      );
    } catch (error) {
      console.error(error);

      const mensagemErro: Mensagem = {
        role: "assistant",
        content:
          "Desculpe, ocorreu um problema ao comunicar com a Nexora AI. Tente novamente.",
      };

      setMensagens(
        (mensagensAtuais) => [
          ...mensagensAtuais,
          mensagemErro,
        ]
      );
    } finally {
      setACarregar(false);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      enviarMensagem();
    }
  }

  function novaConversa() {
    setMensagens([]);
    setMensagem("");
    setConversationId(null);
  }

  function obterNomeFonte(url: string) {
    try {
      return new URL(url).hostname.replace(
        /^www\./,
        ""
      );
    } catch {
      return "Fonte";
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section className="relative min-h-[75vh] overflow-hidden px-6 py-16">
        <div className="absolute left-1/2 top-20 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center">
          {/* Cabeçalho */}
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-400/30 bg-cyan-400/10 text-4xl shadow-lg shadow-cyan-500/10">
              🤖
            </div>

            <h1 className="mt-6 text-4xl font-extrabold md:text-5xl">
              Nexora
              <span className="text-cyan-400">
                {" "}
                AI
              </span>
            </h1>

            <p className="mt-4 text-lg text-slate-400">
              O assistente inteligente da sua empresa.
            </p>
          </div>

          {/* Chat */}
          <div className="mt-12 w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl">
            {/* Barra superior */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />

                <span className="text-sm font-medium text-slate-300">
                  Nexora AI
                </span>
              </div>

              <button
                type="button"
                onClick={novaConversa}
                className="text-xs text-slate-500 transition hover:text-cyan-400"
              >
                Nova conversa
              </button>
            </div>

            {/* Área da conversa */}
            <div className="min-h-[350px] space-y-5 p-6">
              {/* Mensagem inicial */}
              {mensagens.length === 0 && (
                <div className="max-w-2xl rounded-2xl rounded-tl-sm border border-slate-800 bg-slate-950 p-5">
                  <p className="text-sm font-semibold text-cyan-400">
                    Nexora AI
                  </p>

                  <p className="mt-2 leading-7 text-slate-300">
                    Olá! 👋 Sou a Nexora AI.
                  </p>

                  <p className="mt-2 leading-7 text-slate-400">
                    Estou aqui para ajudar a sua empresa a encontrar
                    soluções, automatizar processos e utilizar a
                    Inteligência Artificial de forma mais eficiente.
                  </p>
                </div>
              )}

              {/* Histórico */}
              {mensagens.map(
                (item, index) => (
                  <div
                    key={`${item.role}-${index}`}
                    className={
                      item.role === "user"
                        ? "ml-auto max-w-3xl rounded-2xl rounded-tr-sm bg-cyan-500 p-5 text-slate-950"
                        : "max-w-3xl rounded-2xl rounded-tl-sm border border-slate-800 bg-slate-950 p-5"
                    }
                  >
                    <p
                      className={
                        item.role === "user"
                          ? "text-sm font-bold"
                          : "text-sm font-semibold text-cyan-400"
                      }
                    >
                      {item.role === "user"
                        ? "Você"
                        : "Nexora AI"}
                    </p>

                    <p className="mt-2 whitespace-pre-wrap leading-7">
                      {item.content}
                    </p>

                    {/* Fontes da pesquisa web */}
                    {item.role ===
                      "assistant" &&
                      item.fontes &&
                      item.fontes.length >
                        0 && (
                        <div className="mt-6 border-t border-slate-800 pt-5">
                          <div className="mb-3 flex items-center gap-2">
                            <span className="text-lg">
                              🔎
                            </span>

                            <p className="text-sm font-semibold text-slate-300">
                              Fontes consultadas
                            </p>
                          </div>

                          <div className="space-y-3">
                            {item.fontes.map(
                              (fonte) => (
                                <a
                                  key={`${fonte.numero}-${fonte.url}`}
                                  href={fonte.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group block rounded-xl border border-slate-800 bg-slate-900 p-4 transition hover:border-cyan-400/40 hover:bg-slate-900/80"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-sm font-bold text-cyan-400">
                                      {fonte.numero}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium text-slate-200 transition group-hover:text-cyan-400">
                                        {fonte.titulo ||
                                          "Fonte consultada"}
                                      </p>

                                      <p className="mt-1 truncate text-xs text-slate-500">
                                        {obterNomeFonte(
                                          fonte.url
                                        )}
                                      </p>

                                      <p className="mt-2 text-xs text-cyan-400">
                                        Abrir fonte ↗
                                      </p>
                                    </div>
                                  </div>
                                </a>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )
              )}

              {/* Estado de carregamento */}
              {aCarregar && (
                <div className="max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-sm text-cyan-400">
                    Nexora AI está a pensar...
                  </p>
                </div>
              )}
            </div>

            {/* Campo */}
            <div className="border-t border-slate-800 p-5">
              <div className="flex gap-3 rounded-2xl border border-slate-700 bg-slate-950 p-2 focus-within:border-cyan-400/60">
                <input
                  type="text"
                  value={mensagem}
                  onChange={(event) =>
                    setMensagem(
                      event.target.value
                    )
                  }
                  onKeyDown={handleKeyDown}
                  placeholder="Escreva a sua mensagem..."
                  disabled={aCarregar}
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-white outline-none placeholder:text-slate-600 disabled:opacity-50"
                />

                <button
                  type="button"
                  onClick={enviarMensagem}
                  disabled={
                    aCarregar ||
                    !mensagem.trim()
                  }
                  className="rounded-xl bg-cyan-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {aCarregar
                    ? "A responder..."
                    : "Enviar"}
                </button>
              </div>

              <p className="mt-3 text-center text-xs text-slate-600">
                Nexora AI • Inteligência para o seu negócio
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}