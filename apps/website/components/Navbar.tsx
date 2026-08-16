"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function Navbar() {
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function verificarSessao() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setAutenticado(!!user);
    }

    verificarSessao();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAutenticado(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function sair() {
    const supabase = createSupabaseBrowserClient();

    await supabase.auth.signOut();

    window.location.href = "/";
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* Logo Nexora */}
        <a
          href="/"
          className="transition duration-300 hover:scale-105"
        >
          <Image
            src="/images/logo_navbar_escura.png"
            alt="Nexora Tech"
            width={180}
            height={60}
            className="h-auto w-[150px] md:w-[180px]"
            priority
          />
        </a>

        {/* Menu */}
        <div className="hidden items-center gap-8 md:flex">

          <a
            href="/"
            className="text-sm font-medium text-slate-300 transition hover:text-cyan-400"
          >
            Início
          </a>

          <a
            href="/#servicos"
            className="text-sm font-medium text-slate-300 transition hover:text-cyan-400"
          >
            Serviços
          </a>

          <a
            href="/nexora-ai"
            className="text-sm font-medium text-slate-300 transition hover:text-cyan-400"
          >
            Nexora AI
          </a>

          <a
            href="/portfolio"
            className="text-sm font-medium text-slate-300 transition hover:text-cyan-400"
          >
            Portfólio
          </a>

          <a
            href="/#contacto"
            className="text-sm font-medium text-slate-300 transition hover:text-cyan-400"
          >
            Contacto
          </a>

        </div>

        {/* Área de autenticação */}
        {autenticado ? (
          <div className="flex items-center gap-3">

            <a
              href="/nexora-ai/dashboard"
              className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition duration-300 hover:scale-105 hover:bg-cyan-400"
            >
              Dashboard
            </a>

            <button
              onClick={sair}
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-red-400 hover:text-red-400"
            >
              Sair
            </button>

          </div>
        ) : (
          <a
            href="/nexora-ai/login"
            className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition duration-300 hover:scale-105 hover:bg-cyan-400"
          >
            Entrar
          </a>
        )}

      </div>
    </nav>
  );
}