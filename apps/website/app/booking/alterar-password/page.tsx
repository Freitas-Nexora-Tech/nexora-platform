"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AlterarPasswordPage() {
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();

    const [password, setPassword] = useState("");
    const [confirmarPassword, setConfirmarPassword] = useState("");
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [aCarregar, setACarregar] = useState(false);

    async function alterarPassword(event: React.FormEvent) {
        event.preventDefault();

        setErro("");
        setSucesso("");

        if (password.length < 8) {
            setErro("A palavra-passe deve ter pelo menos 8 caracteres.");
            return;
        }

        if (password !== confirmarPassword) {
            setErro("As palavras-passe não coincidem.");
            return;
        }

        setACarregar(true);

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                setErro("A sessão expirou. Volte a iniciar sessão.");
                return;
            }

            const { error: passwordError } =
                await supabase.auth.updateUser({
                    password,
                });

            if (passwordError) {
                setErro(
                    passwordError.message ||
                        "Não foi possível alterar a palavra-passe."
                );
                return;
            }

            const response = await fetch(
                "/api/booking/complete-first-login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error(
                    "Erro ao concluir primeiro acesso:",
                    data
                );

                setErro(
                    "A palavra-passe foi alterada, mas não foi possível concluir a ativação do acesso. Contacte o administrador."
                );
                return;
            }

            if (!data?.success) {
                setErro(
                    "Não foi possível concluir o primeiro acesso. Contacte o administrador."
                );
                return;
            }

            setSucesso("Palavra-passe alterada com sucesso.");

            setTimeout(() => {
                router.replace("/nexora-ai/booking");
                router.refresh();
            }, 1000);
        } catch (error) {
            console.error(
                "Erro inesperado ao concluir primeiro acesso:",
                error
            );

            setErro(
                "Ocorreu um erro ao concluir o primeiro acesso. Tente novamente."
            );
        } finally {
            setACarregar(false);
        }
    }

    async function sair() {
        await supabase.auth.signOut();
        router.replace("/booking/login");
        router.refresh();
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-400/30 bg-cyan-400/10 text-4xl">
                        🔐
                    </div>

                    <h1 className="mt-6 text-3xl font-extrabold">
                        Primeiro acesso
                    </h1>

                    <p className="mt-3 text-slate-400">
                        Por motivos de segurança, deve definir uma nova
                        palavra-passe antes de continuar.
                    </p>
                </div>

                <form
                    onSubmit={alterarPassword}
                    className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl"
                >
                    <label className="block text-sm font-semibold text-slate-300">
                        Nova palavra-passe
                    </label>

                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                        required
                        minLength={8}
                        disabled={aCarregar}
                    />

                    <label className="mt-5 block text-sm font-semibold text-slate-300">
                        Confirmar palavra-passe
                    </label>

                    <input
                        type="password"
                        value={confirmarPassword}
                        onChange={(e) =>
                            setConfirmarPassword(e.target.value)
                        }
                        placeholder="Repita a nova palavra-passe"
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                        required
                        minLength={8}
                        disabled={aCarregar}
                    />

                    {erro && (
                        <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                            {erro}
                        </p>
                    )}

                    {sucesso && (
                        <p className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
                            {sucesso}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={aCarregar}
                        className="mt-6 w-full rounded-xl bg-cyan-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
                    >
                        {aCarregar
                            ? "A alterar..."
                            : "Definir nova palavra-passe"}
                    </button>

                    <button
                        type="button"
                        onClick={sair}
                        disabled={aCarregar}
                        className="mt-4 w-full rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-50"
                    >
                        Sair
                    </button>
                </form>
            </div>
        </main>
    );
}