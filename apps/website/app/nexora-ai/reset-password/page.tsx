"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [aCarregar, setACarregar] = useState(false);
  const [aVerificar, setAVerificar] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function verificarSessao() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setAutorizado(true);
      } else {
        setErro(
          "O link de recuperação é inválido ou expirou. Solicite um novo email."
        );
      }

      setAVerificar(false);
    }

    verificarSessao();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session?.user) {
        setAutorizado(true);
        setErro("");
        setAVerificar(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function alterarPassword(event: React.FormEvent) {
    event.preventDefault();

    setErro("");
    setMensagem("");

    if (password.length < 6) {
      setErro("A palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmarPassword) {
      setErro("As palavras-passe não coincidem.");
      return;
    }

    setACarregar(true);

    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setACarregar(false);

    if (error) {
      setErro(
        "Não foi possível alterar a palavra-passe. O link pode ter expirado."
      );
      return;
    }

    setMensagem(
      "Palavra-passe alterada com sucesso. Pode entrar na Nexora AI."
    );

    setPassword("");
    setConfirmarPassword("");

    await supabase.auth.signOut();

    setTimeout(() => {
      router.replace("/nexora-ai/login");
    }, 1500);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar isRecoveryMode={true} />

      <section className="flex min-h-[75vh] items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">

          <div className="mb-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-400/30 bg-cyan-400/10 text-4xl">
              🔐
            </div>

            <h1 className="mt-6 text-4xl font-extrabold">
              Nova palavra-passe
            </h1>

            <p className="mt-3 text-slate-400">
              Defina uma nova palavra-passe para a sua conta Nexora AI.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">

            {aVerificar ? (
              <p className="text-center text-slate-400">
                A validar o link de recuperação...
              </p>
            ) : autorizado ? (
              <form onSubmit={alterarPassword}>

                <label className="block text-sm font-semibold text-slate-300">
                  Nova palavra-passe
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

                <label className="mt-5 block text-sm font-semibold text-slate-300">
                  Confirmar palavra-passe
                </label>

                <input
                  type="password"
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
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
                  {aCarregar
                    ? "A alterar..."
                    : "Alterar palavra-passe"}
                </button>

              </form>
            ) : (
              <div>
                <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                  {erro}
                </p>

                <button
                  type="button"
                  onClick={() => router.push("/nexora-ai/login")}
                  className="mt-5 w-full rounded-xl bg-cyan-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-400"
                >
                  Voltar ao login
                </button>
              </div>
            )}

          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}