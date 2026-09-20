"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function BookingLoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [aCarregar, setACarregar] = useState(false);

  async function entrar(event: React.FormEvent) {
    event.preventDefault();

    setErro("");
    setACarregar(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      setACarregar(false);
      setErro("Email ou palavra-passe incorretos.");
      return;
    }

    const user = data.user;

    const { data: membro, error: membroError } = await supabase
      .from("company_members")
      .select(
        "company_id, role, username, is_active, must_change_password"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (membroError || !membro) {
      await supabase.auth.signOut();
      setACarregar(false);
      setErro(
        "Esta conta não está associada a uma empresa com acesso ao Nexora Booking."
      );
      return;
    }

    if (!membro.is_active) {
      await supabase.auth.signOut();
      setACarregar(false);
      setErro("O acesso desta conta está desativado.");
      return;
    }

    if (membro.must_change_password) {
      setACarregar(false);
      router.replace("/booking/alterar-password");
      router.refresh();
      return;
    }

    setACarregar(false);
    router.replace("/nexora-ai/booking");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-400/30 bg-cyan-400/10 text-4xl">
            📅
          </div>

          <h1 className="mt-6 text-4xl font-extrabold">
            Nexora <span className="text-cyan-400">Booking</span>
          </h1>

          <p className="mt-3 text-slate-400">
            Entre diretamente no sistema de marcações da sua empresa.
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

          <button
            type="submit"
            disabled={aCarregar}
            className="mt-6 w-full rounded-xl bg-cyan-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
          >
            {aCarregar ? "A entrar..." : "Entrar no Booking"}
          </button>

          <div className="mt-5 text-center">
            <a
              href="/nexora-ai/login"
              className="text-sm text-slate-500 transition hover:text-cyan-400"
            >
              Entrar na Nexora
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}