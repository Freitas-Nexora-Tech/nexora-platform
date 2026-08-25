"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NexoraAILoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [aCarregar, setACarregar] = useState(false);

  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const supabase = createSupabaseBrowserClient();

  async function entrar(event: React.FormEvent) {
    event.preventDefault();

    setErro("");
    setMensagem("");
    setACarregar(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setACarregar(false);

    if (error) {
      setErro("Email ou palavra-passe incorretos.");
      return;
    }

    await supabase.auth.getUser();

    router.replace("/nexora-ai/dashboard");
    router.refresh();
  }

  async function criarConta() {
    setErro("");
    setMensagem("");

    if (!email || !password) {
      setErro("Preencha o email e a palavra-passe.");
      return;
    }

    setACarregar(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setACarregar(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setMensagem(
      "Conta criada. Verifique o seu email para confirmar a conta."
    );
  }

  async function recuperarPassword() {
    setErro("");
    setMensagem("");

    if (!email) {
      setErro("Introduza o seu email para recuperar a palavra-passe.");
      return;
    }

    setACarregar(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nexora-ai/reset-password`,
    });

    setACarregar(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setMensagem(
      "Enviámos um email para recuperar a palavra-passe. Verifique a sua caixa de entrada."
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section className="flex min-h-[75vh] items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">

          <div className="mb-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-400/30 bg-cyan-400/10 text-4xl">
              🤖
            </div>

            <h1 className="mt-6 text-4xl font-extrabold">
              Entrar na Nexora
              <span className="text-cyan-400"> AI</span>
            </h1>

            <p className="mt-3 text-slate-400">
              Aceda ao painel da sua empresa.
            </p>
          </div>

          <form
            onSubmit={entrar}
            className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl"
          >
            <label className="block text-sm font-semibold text-slate-300">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@empresa.pt"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              required
            />

            <label className="mt-5 block text-sm font-semibold text-slate-300">
              Palavra-passe
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              required
              minLength={6}
            />

            {erro && (
              <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {erro}
              </p>
            )}

            {mensagem && (
              <p className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-sm text-cyan-400">
                {mensagem}
              </p>
            )}

            <button
              type="submit"
              disabled={aCarregar}
              className="mt-6 w-full rounded-xl bg-cyan-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
            >
              {aCarregar ? "A entrar..." : "Entrar"}
            </button>

            <button
              type="button"
              onClick={criarConta}
              disabled={aCarregar}
              className="mt-3 w-full rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400 disabled:opacity-50"
            >
              Criar conta
            </button>

            <button
              type="button"
              onClick={recuperarPassword}
              disabled={aCarregar}
              className="mt-5 w-full text-sm text-slate-400 transition hover:text-cyan-400 disabled:opacity-50"
            >
              Esqueci-me da palavra-passe
            </button>
          </form>

        </div>
      </section>

      <Footer />
    </main>
  );
}