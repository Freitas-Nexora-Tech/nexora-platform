"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function NexoraAIAuthPage() {
  const router = useRouter();

  const [mensagem, setMensagem] = useState(
    "A confirmar a sua conta..."
  );

  const [erro, setErro] = useState("");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function confirmarConta() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error(
          "Erro ao confirmar sessão:",
          error
        );

        setErro(
          "Não foi possível confirmar a sua conta."
        );

        return;
      }

      if (!session) {
        setMensagem(
          "Conta confirmada. Pode agora iniciar sessão."
        );

        setTimeout(() => {
          router.replace("/nexora-ai/login");
        }, 1500);

        return;
      }

      // Verificar se já existe empresa
      const { data: membro } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", session.user.id)
        .limit(1)
        .maybeSingle();

      if (membro) {
        setMensagem(
          "Conta confirmada. A entrar no seu dashboard..."
        );

        setTimeout(() => {
          router.replace("/nexora-ai/dashboard");
          router.refresh();
        }, 800);

        return;
      }

      // Cliente novo
      setMensagem(
        "Conta confirmada. Vamos configurar a sua empresa..."
      );

      setTimeout(() => {
        router.replace("/nexora-ai/setup");
        router.refresh();
      }, 800);
    }

    confirmarConta();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="w-full max-w-md text-center">

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-400/30 bg-cyan-400/10 text-4xl">
          🤖
        </div>

        <h1 className="mt-6 text-3xl font-extrabold">
          Nexora
          <span className="text-cyan-400">
            {" "}AI
          </span>
        </h1>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          {erro ? (
            <p className="text-red-400">
              {erro}
            </p>
          ) : (
            <p className="text-slate-400">
              {mensagem}
            </p>
          )}

        </div>

      </div>
    </main>
  );
}