"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

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

function NexoraAIChat() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = createSupabaseBrowserClient();

  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [aCarregar, setACarregar] = useState(false);

  const [conversationId, setConversationId] =
    useState<string | null>(null);

  const [aiAtiva, setAiAtiva] = useState(true);
  const [aVerificarIA, setAVerificarIA] = useState(true);

  const [erroIA, setErroIA] = useState("");

  const conversationIdFromUrl =
    searchParams.get("conversation");

  // Verificar autenticação e estado da IA
  useEffect(() => {
    async function verificarAcesso() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/nexora-ai/login");
          return;
        }

        const { data: membro } = await supabase
          .from("company_members")
          .select("company_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (!membro) {
          router.replace("/nexora-ai/login");
          return;
        }

        const { data: subscricao } = await supabase
          .from("company_subscriptions")
          .select("ai_enabled")
          .eq("company_id", membro.company_id)
          .maybeSingle();

        const ativa =
          subscricao?.ai_enabled ?? true;

        setAiAtiva(ativa);

        if (!ativa) {
          setErroIA(
            "A Nexora AI está temporariamente suspensa para esta empresa."
          );
        }
      } catch (error) {
        console.error(
          "Erro ao verificar estado da IA:",
          error
        );
      } finally {
        setAVerificarIA(false);
      }
    }

    verificarAcesso();
  }, [router, supabase]);

  // Carregar conversa existente
  useEffect(() => {
    if (!conversationIdFromUrl) return;
    if (aVerificarIA) return;
    if (!aiAtiva) return;

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
  }, [
    conversationIdFromUrl,
    aVerificarIA,
    aiAtiva,
  ]);

  async function enviarMensagem() {
    if (
      !aiAtiva ||
      !mensagem.trim() ||
      aCarregar
    ) {
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
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            mensagens:
              conversaAtualizada,
            conversationId,
          }),
        }
      );

      const data = await response.json();

      // IA suspensa
      if (
        response.status === 403 &&
        data.ai_enabled === false
      ) {
        setAiAtiva(false);

        setErroIA(
          "A Nexora AI está temporariamente suspensa para esta empresa."
        );

        setMensagens(
          (mensagensAtuais) =>
            mensagensAtuais.slice(
              0,
              -1
            )
        );

        return;
      }

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
    if (!aiAtiva) return;

    setMensagens([]);
    setMensagem("");
    setConversationId(null);

    router.replace("/nexora-ai/chat");
  }

  function obterNomeFonte(url: string) {
    try {
      return new URL(url)
        .hostname.replace(
          /^www\./,
          ""
        );
    } catch {
      return "Fonte";
    }
  }

  if (aVerificarIA) {
    return (
      <section className="flex min-h-[75vh] items-center justify-center px-6 py-16">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-5 text-sm text-cyan-400">
          A verificar o estado da Nexora AI...
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-[75vh] overflow-hidden px-6 py-16">
      <div className="absolute left-1/2 top-20 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center">

        {/* Voltar */}

        <div className="mb-6 w-full">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/nexora-ai/dashboard"
              )
            }
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-400 transition hover:border-cyan-400/50 hover:text-cyan-400"
          >
            ← Voltar ao Dashboard
          </button>
        </div>

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

        {/* Estado suspenso */}

        {!aiAtiva && (
          <div className="mt-8 w-full rounded-2xl border border-red-400/20 bg-red-400/5 p-5 text-center">
            <p className="text-lg font-bold text-red-400">
              🔒 Nexora AI suspensa
            </p>

            <p className="mt-2 text-sm text-slate-400">
              A utilização da inteligência artificial
              está temporariamente indisponível.
            </p>
          </div>
        )}

        {/* Chat */}

        <div className="mt-8 w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl">

          {/* Barra superior */}

          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">

            <div className="flex items-center gap-3">

              <div
                className={
                  aiAtiva
                    ? "h-3 w-3 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50"
                    : "h-3 w-3 rounded-full bg-red-400"
                }
              />

              <span className="text-sm font-medium text-slate-300">
                Nexora AI
              </span>

            </div>

            <button
              type="button"
              onClick={novaConversa}
              disabled={!aiAtiva}
              className="text-xs text-slate-500 transition hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Nova conversa
            </button>

          </div>

          {/* Área da conversa */}

          <div className="min-h-[350px] space-y-5 p-6">

            {!aiAtiva ? (
              <div className="mx-auto max-w-2xl rounded-2xl border border-red-400/20 bg-slate-950 p-6 text-center">

                <div className="text-4xl">
                  🔒
                </div>

                <p className="mt-4 text-lg font-bold text-red-400">
                  Nexora AI temporariamente suspensa
                </p>

                <p className="mt-2 leading-7 text-slate-400">
                  A inteligência artificial desta empresa
                  encontra-se temporariamente indisponível.
                </p>

                <p className="mt-4 text-sm text-slate-600">
                  Contacte o administrador da conta para
                  mais informações.
                </p>

              </div>
            ) : (
              <>
                {mensagens.length === 0 && (
                  <div className="max-w-2xl rounded-2xl rounded-tl-sm border border-slate-800 bg-slate-950 p-5">

                    <p className="text-sm font-semibold text-cyan-400">
                      Nexora AI
                    </p>

                    <p className="mt-2 leading-7 text-slate-300">
                      Olá! 👋 Sou a Nexora AI.
                    </p>

                    <p className="mt-2 leading-7 text-slate-400">
                      Estou aqui para ajudar a sua empresa
                      a encontrar soluções, automatizar
                      processos e utilizar a Inteligência
                      Artificial de forma mais eficiente.
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

                      {/* Fontes */}

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

                {/* Carregamento */}

                {aCarregar && (
                  <div className="max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-5">

                    <p className="text-sm text-cyan-400">
                      Nexora AI está a pensar...
                    </p>

                  </div>
                )}
              </>
            )}

          </div>

          {/* Campo */}

          <div className="border-t border-slate-800 p-5">

            {erroIA && !aiAtiva && (
              <p className="mb-4 text-center text-sm text-red-400">
                🔒 Nexora AI suspensa pelo administrador.
              </p>
            )}

            <div
              className={
                aiAtiva
                  ? "flex gap-3 rounded-2xl border border-slate-700 bg-slate-950 p-2 focus-within:border-cyan-400/60"
                  : "flex gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-2 opacity-50"
              }
            >

              <input
                type="text"
                value={mensagem}
                onChange={(event) =>
                  setMensagem(
                    event.target.value
                  )
                }
                onKeyDown={handleKeyDown}
                placeholder={
                  aiAtiva
                    ? "Escreva a sua mensagem..."
                    : "Nexora AI temporariamente suspensa"
                }
                disabled={
                  !aiAtiva ||
                  aCarregar
                }
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-white outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              />

              <button
                type="button"
                onClick={enviarMensagem}
                disabled={
                  !aiAtiva ||
                  aCarregar ||
                  !mensagem.trim()
                }
                className="rounded-xl bg-cyan-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-30"
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
  );
}

function ChatLoading() {
  return (
    <section className="flex min-h-[75vh] items-center justify-center px-6 py-16">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-5 text-sm text-cyan-400">
        A carregar a Nexora AI...
      </div>
    </section>
  );
}

export default function NexoraAIChatPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <Suspense fallback={<ChatLoading />}>
        <NexoraAIChat />
      </Suspense>

      <Footer />
    </main>
  );
}