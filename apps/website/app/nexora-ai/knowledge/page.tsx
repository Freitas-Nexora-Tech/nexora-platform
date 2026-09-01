"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type Conhecimento = {
  id?: string;
  empresa: string;
  descricao: string;
  servicos: string;
  produtos: string;
  informacoes: string;
};

export default function NexoraAIKnowledgePage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [empresa, setEmpresa] = useState("");
  const [descricao, setDescricao] = useState("");
  const [servicos, setServicos] = useState("");
  const [produtos, setProdutos] = useState("");
  const [informacoes, setInformacoes] = useState("");

  const [aCarregar, setACarregar] = useState(true);
  const [aGuardar, setAGuardar] = useState(false);

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarConhecimento() {
      try {
        setACarregar(true);
        setErro("");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/nexora-ai/login");
          return;
        }

        const { data: membro, error: membroError } =
          await supabase
            .from("company_members")
            .select("company_id")
            .eq("user_id", user.id)
            .limit(1)
            .maybeSingle();

        if (membroError || !membro) {
          router.replace("/nexora-ai/login");
          return;
        }

        // Obter nome oficial da empresa
        const { data: empresaData, error: empresaError } =
          await supabase
            .from("companies")
            .select("name")
            .eq("id", membro.company_id)
            .single();

        if (empresaError || !empresaData) {
          setErro(
            "Não foi possível identificar a empresa."
          );
          return;
        }

        setEmpresa(empresaData.name);

        // Obter conhecimento existente
        const response = await fetch(
          "/api/knowledge",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Não foi possível carregar o conhecimento."
          );
        }

        if (data.conhecimento) {
          const conhecimento: Conhecimento =
            data.conhecimento;

          setDescricao(
            conhecimento.descricao || ""
          );

          setServicos(
            conhecimento.servicos || ""
          );

          setProdutos(
            conhecimento.produtos || ""
          );

          setInformacoes(
            conhecimento.informacoes || ""
          );
        }
      } catch (error) {
        console.error(
          "Erro ao carregar conhecimento:",
          error
        );

        setErro(
          "Não foi possível carregar o conhecimento da empresa."
        );
      } finally {
        setACarregar(false);
      }
    }

    carregarConhecimento();
  }, [router, supabase]);

  async function guardarConhecimento() {
    setMensagem("");
    setErro("");

    setAGuardar(true);

    try {
      const response = await fetch(
        "/api/knowledge",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            descricao,
            servicos,
            produtos,
            informacoes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Não foi possível guardar o conhecimento."
        );
      }

      setMensagem(
        "Conhecimento guardado com sucesso."
      );

      setTimeout(() => {
        setMensagem("");
      }, 4000);
    } catch (error) {
      console.error(
        "Erro ao guardar conhecimento:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível guardar o conhecimento."
      );
    } finally {
      setAGuardar(false);
    }
  }

  if (aCarregar) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <Navbar />

        <section className="flex min-h-[75vh] items-center justify-center px-6 py-16">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-5 text-sm text-cyan-400">
            A carregar o conhecimento da empresa...
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-20">

        <div className="absolute left-1/2 top-20 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-5xl">

          {/* Voltar */}

          <div className="mb-8">
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

            <span className="font-semibold uppercase tracking-[0.3em] text-cyan-400">
              Nexora AI
            </span>

            <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">
              Conhecimento da empresa
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-400">
              Dê à Nexora AI as informações necessárias
              para compreender melhor a sua empresa e
              responder de forma mais precisa.
            </p>

          </div>

          {/* Empresa */}

          <div className="mt-10 rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-5">

            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Empresa
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
              {empresa}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Esta empresa é determinada automaticamente
              pela conta autenticada.
            </p>

          </div>

          {/* Formulário */}

          <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl md:p-10">

            <div className="grid gap-8">

              {/* Descrição */}

              <div>

                <label className="mb-3 block text-sm font-semibold text-slate-200">
                  Sobre a empresa
                </label>

                <textarea
                  value={descricao}
                  onChange={(e) =>
                    setDescricao(e.target.value)
                  }
                  placeholder="Explique brevemente o que a empresa faz..."
                  rows={5}
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60"
                />

              </div>

              {/* Serviços */}

              <div>

                <label className="mb-3 block text-sm font-semibold text-slate-200">
                  Serviços
                </label>

                <textarea
                  value={servicos}
                  onChange={(e) =>
                    setServicos(e.target.value)
                  }
                  placeholder="Liste os principais serviços da empresa..."
                  rows={5}
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60"
                />

              </div>

              {/* Produtos */}

              <div>

                <label className="mb-3 block text-sm font-semibold text-slate-200">
                  Produtos
                </label>

                <textarea
                  value={produtos}
                  onChange={(e) =>
                    setProdutos(e.target.value)
                  }
                  placeholder="Liste os produtos, soluções ou ofertas..."
                  rows={5}
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60"
                />

              </div>

              {/* Informações */}

              <div>

                <label className="mb-3 block text-sm font-semibold text-slate-200">
                  Informações importantes
                </label>

                <textarea
                  value={informacoes}
                  onChange={(e) =>
                    setInformacoes(e.target.value)
                  }
                  placeholder="Contactos, horários, políticas, perguntas frequentes, procedimentos, etc."
                  rows={6}
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60"
                />

              </div>

              {/* Mensagens */}

              {erro && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-400">
                  {erro}
                </div>
              )}

              {mensagem && (
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm font-medium text-emerald-400">
                  ✓ {mensagem}
                </div>
              )}

              {/* Botão */}

              <div className="flex justify-center pt-2">

                <button
                  type="button"
                  onClick={guardarConhecimento}
                  disabled={aGuardar}
                  className="rounded-xl bg-cyan-500 px-8 py-4 font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {aGuardar
                    ? "A guardar..."
                    : "Guardar conhecimento"}
                </button>

              </div>

            </div>

          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}