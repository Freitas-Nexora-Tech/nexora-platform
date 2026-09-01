"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NexoraAISetupPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [aVerificar, setAVerificar] = useState(true);
  const [aGuardar, setAGuardar] = useState(false);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");

  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    async function verificarConta() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/nexora-ai/login");
        return;
      }

      // Verificar se é administrador Nexora
      const { data: admin } = await supabase
        .from("nexora_admins")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (admin) {
        router.replace("/nexora-admin");
        return;
      }

      // Verificar se já possui empresa
      const { data: membro } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membro) {
        router.replace("/nexora-ai/dashboard");
        return;
      }

      setAVerificar(false);
    }

    verificarConta();
  }, [router, supabase]);

  async function criarEmpresa(event: React.FormEvent) {
    event.preventDefault();

    setErro("");
    setMensagem("");

    const nomeLimpo = nome.trim();
    const descricaoLimpa = descricao.trim();

    if (!nomeLimpo) {
      setErro("Introduza o nome da empresa.");
      return;
    }

    if (nomeLimpo.length < 2) {
      setErro(
        "O nome da empresa deve ter pelo menos 2 caracteres."
      );
      return;
    }

    if (descricaoLimpa.length > 300) {
      setErro(
        "A descrição da empresa deve ter no máximo 300 caracteres."
      );
      return;
    }

    setAGuardar(true);

    try {
      const response = await fetch(
        "/api/onboarding/company",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: nomeLimpo,
            descricao: descricaoLimpa,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Não foi possível configurar a empresa."
        );
      }

      setMensagem(
        "Empresa configurada com sucesso. A preparar o seu dashboard..."
      );

      setTimeout(() => {
        router.replace("/nexora-ai/dashboard");
        router.refresh();
      }, 800);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro inesperado."
      );

      setAGuardar(false);
    }
  }

  if (aVerificar) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <Navbar />

        <section className="flex min-h-[75vh] items-center justify-center px-6 py-16">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-3xl">
              🤖
            </div>

            <p className="mt-5 text-slate-400">
              A verificar a sua conta...
            </p>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section className="flex min-h-[75vh] items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl">

          <div className="mb-8 text-center">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-400/30 bg-cyan-400/10 text-4xl">
              🤖
            </div>

            <h1 className="mt-6 text-4xl font-extrabold md:text-5xl">
              Vamos configurar a sua
              <span className="text-cyan-400">
                {" "}Nexora AI
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              Antes de entrar no dashboard, precisamos
              de algumas informações básicas sobre a sua
              empresa.
            </p>

          </div>

          <form
            onSubmit={criarEmpresa}
            className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl md:p-10"
          >

            <div>
              <label className="block text-sm font-semibold text-slate-300">
                Nome da empresa
              </label>

              <input
                type="text"
                value={nome}
                onChange={(e) =>
                  setNome(e.target.value)
                }
                placeholder="Ex.: Flor & Cura"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                required
                minLength={2}
                maxLength={150}
              />

              <p className="mt-2 text-xs text-slate-600">
                Este será o nome apresentado no seu
                dashboard da Nexora AI.
              </p>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-4">
                <label className="block text-sm font-semibold text-slate-300">
                  Descrição curta da empresa
                </label>

                <span className="text-xs text-slate-600">
                  {descricao.length}/300
                </span>
              </div>

              <textarea
                value={descricao}
                onChange={(e) =>
                  setDescricao(e.target.value)
                }
                placeholder="Ex.: Empresa especializada em soluções de bem-estar e terapias."
                rows={4}
                maxLength={300}
                className="mt-2 w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              />

              <p className="mt-2 text-xs leading-5 text-slate-600">
                Faça uma apresentação breve da empresa.
                Poderá adicionar posteriormente serviços,
                produtos e informações detalhadas no
                Conhecimento da empresa.
              </p>
            </div>

            {erro && (
              <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-sm text-red-400">
                  {erro}
                </p>
              </div>
            )}

            {mensagem && (
              <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="text-sm text-emerald-400">
                  {mensagem}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={aGuardar}
              className="mt-8 w-full rounded-xl bg-cyan-500 px-6 py-4 font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {aGuardar
                ? "A configurar a empresa..."
                : "Continuar →"}
            </button>

            <p className="mt-5 text-center text-xs leading-5 text-slate-600">
              Ao continuar, será criada a sua empresa,
              configurada a Nexora AI e iniciado o período
              experimental do plano Starter.
            </p>

          </form>

        </div>
      </section>

      <Footer />
    </main>
  );
}