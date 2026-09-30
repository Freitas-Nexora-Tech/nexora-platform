"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

export default function BookingLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/booking/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data?.error ||
            "Nome de utilizador ou palavra-passe incorretos.",
        );
        return;
      }

      if (
        !data?.session?.access_token ||
        !data?.session?.refresh_token
      ) {
        setError(
          "Não foi possível estabelecer a sessão.",
        );
        return;
      }

      const supabase =
        createSupabaseBrowserClient();

      const { error: sessionError } =
        await supabase.auth.setSession({
          access_token:
            data.session.access_token,
          refresh_token:
            data.session.refresh_token,
        });

      if (sessionError) {
        console.error(
          "Erro ao estabelecer sessão:",
          sessionError,
        );

        setError(
          "Não foi possível estabelecer a sessão.",
        );

        return;
      }

      if (data.must_change_password) {
        router.replace("/booking/alterar-password");
        return;
      }

      router.replace("/nexora-ai/booking");
    } catch (error) {
      console.error(
        "Erro no login do Booking:",
        error,
      );

      setError(
        "Ocorreu um erro ao iniciar sessão. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
        <div className="w-full max-w-xl">
          <div className="overflow-hidden rounded-[28px] border border-slate-800 bg-slate-900 p-8 shadow-2xl sm:p-11">
            <div className="mb-8">
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-400">
                NEXORA
              </p>

              <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-[42px]">
                Nexora Booking
              </h1>

              <p className="mt-3 text-base font-medium text-slate-400">
                Entre na sua área de gestão.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-bold text-slate-200"
                >
                  Nome de utilizador
                </label>

                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) =>
                    setUsername(event.target.value)
                  }
                  placeholder="Nome de utilizador"
                  disabled={loading}
                  className="block w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-base font-medium text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-bold text-slate-200"
                >
                  Palavra-passe
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="A sua palavra-passe"
                  disabled={loading}
                  className="block w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-base font-medium text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  loading ||
                  !username.trim() ||
                  !password
                }
                className="w-full rounded-2xl bg-cyan-400 px-5 py-4 text-base font-extrabold text-slate-950 shadow-sm transition hover:bg-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "A entrar..." : "Entrar"}
              </button>
            </form>
          </div>

          <div className="mt-5 flex items-center justify-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-lg font-extrabold text-white shadow-lg">
              N
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}