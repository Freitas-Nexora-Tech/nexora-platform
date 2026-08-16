"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NexoraAIKnowledgePage() {
  const [empresa, setEmpresa] = useState("");
  const [descricao, setDescricao] = useState("");
  const [servicos, setServicos] = useState("");
  const [produtos, setProdutos] = useState("");
  const [informacoes, setInformacoes] = useState("");
  const [guardado, setGuardado] = useState(false);

async function guardarConhecimento() {
  try {
    const response = await fetch("/api/knowledge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        empresa,
        descricao,
        servicos,
        produtos,
        informacoes,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Não foi possível guardar o conhecimento."
      );
    }

    setGuardado(true);

    setTimeout(() => {
      setGuardado(false);
    }, 4000);
  } catch (error) {
    console.error("Erro:", error);

    alert(
      "Não foi possível guardar o conhecimento. Tente novamente."
    );
  }
}

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-20">
        <div className="absolute left-1/2 top-20 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-5xl">

          {/* Cabeçalho */}
          <div className="text-center">
            <span className="font-semibold uppercase tracking-[0.3em] text-cyan-400">
              Nexora AI
            </span>

            <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">
              Conhecimento da empresa
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-400">
              Dê à Nexora AI as informações necessárias para compreender
              melhor a sua empresa e responder de forma mais precisa.
            </p>
          </div>

          {/* Formulário */}
          <div className="mt-14 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl md:p-10">

            <div className="grid gap-8">

              {/* Empresa */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-200">
                  Nome da empresa
                </label>

                <input
                  type="text"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  placeholder="Ex.: Nexora Tech"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-200">
                  Sobre a empresa
                </label>

                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
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
                  onChange={(e) => setServicos(e.target.value)}
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
                  onChange={(e) => setProdutos(e.target.value)}
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
                  onChange={(e) => setInformacoes(e.target.value)}
                  placeholder="Contactos, horários, políticas, perguntas frequentes, procedimentos, etc."
                  rows={6}
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60"
                />
              </div>

              {/* Botão */}
              <div className="flex flex-col items-center gap-4 pt-4">

                <button
                  type="button"
                  onClick={guardarConhecimento}
                  className="rounded-xl bg-cyan-500 px-8 py-4 font-bold text-slate-950 transition hover:bg-cyan-400"
                >
                  Guardar conhecimento
                </button>

                {guardado && (
                  <p className="text-sm font-medium text-cyan-400">
                    Conhecimento guardado com sucesso.
                  </p>
                )}

              </div>

            </div>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}