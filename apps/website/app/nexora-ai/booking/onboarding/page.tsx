"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const planos = [
  {
    id: "starter",
    nome: "Starter",
    preco: "15",
    profissionais: 2,
    descricao: "Ideal para pequenos negócios.",
  },
  {
    id: "professional",
    nome: "Professional",
    preco: "29",
    profissionais: 5,
    descricao: "Para negócios em crescimento.",
  },
  {
    id: "business",
    nome: "Business",
    preco: "49",
    profissionais: 15,
    descricao: "Para equipas maiores.",
  },
];

export default function BookingOnboardingPage() {
  const router = useRouter();

  const [planoSelecionado, setPlanoSelecionado] = useState("starter");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [aProcessar, setAProcessar] = useState(false);
  const [erro, setErro] = useState("");

  async function continuar() {
  setErro("");

  if (!nomeEmpresa.trim()) {
    setErro("Indica o nome da empresa.");
    return;
  }

  setAProcessar(true);

  try {
    // 1. Criar ou reutilizar a empresa
    const companyResponse = await fetch(
      "/api/booking/onboarding/company",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nomeEmpresa.trim(),
          descricao: null,
        }),
      }
    );

    const companyData = await companyResponse.json();

    if (!companyResponse.ok) {
      throw new Error(
        companyData.error ||
          "Não foi possível preparar a empresa."
      );
    }

    const companyId = companyData.company_id;

    if (!companyId) {
      throw new Error(
        "Não foi possível identificar a empresa."
      );
    }

    // 2. Ativar o Booking nessa empresa
    const bookingResponse = await fetch(
      "/api/booking/onboarding",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          empresa_id: companyId,
          plano: planoSelecionado,
        }),
      }
    );

    const bookingData = await bookingResponse.json();

    if (!bookingResponse.ok) {
      throw new Error(
        bookingData.error ||
          "Não foi possível ativar o Nexora Booking."
      );
    }

    // 3. Tudo concluído
    router.push("/nexora-ai/booking");
  } catch (error) {
    console.error("Erro no onboarding Booking:", error);

    setErro(
      error instanceof Error
        ? error.message
        : "Ocorreu um erro inesperado."
    );
  } finally {
    setAProcessar(false);
  }
}

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-zinc-400">
            Nexora Booking
          </p>

          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Comece a gerir a sua agenda
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
            Configure o seu negócio e comece gratuitamente durante 14 dias.
          </p>
        </div>

        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <label
              htmlFor="nomeEmpresa"
              className="block text-sm font-medium text-zinc-300"
            >
              Nome da empresa
            </label>

            <input
              id="nomeEmpresa"
              type="text"
              value={nomeEmpresa}
              onChange={(event) => setNomeEmpresa(event.target.value)}
              placeholder="Ex.: Flor & Cura"
              className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500"
            />
          </div>

          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold">
              Escolha o seu plano
            </h2>

            <div className="grid gap-4 md:grid-cols-3">
              {planos.map((plano) => {
                const selecionado = planoSelecionado === plano.id;

                return (
                  <button
                    key={plano.id}
                    type="button"
                    onClick={() => setPlanoSelecionado(plano.id)}
                    className={`rounded-2xl border p-5 text-left transition ${
                      selecionado
                        ? "border-white bg-white text-black"
                        : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold">{plano.nome}</h3>

                      {selecionado && (
                        <span className="rounded-full bg-black px-2 py-1 text-[10px] font-semibold text-white">
                          Escolhido
                        </span>
                      )}
                    </div>

                    <div className="mt-5">
                      <span className="text-3xl font-bold">
                        €{plano.preco}
                      </span>

                      <span
                        className={`text-sm ${
                          selecionado
                            ? "text-zinc-600"
                            : "text-zinc-500"
                        }`}
                      >
                        /mês
                      </span>
                    </div>

                    <p
                      className={`mt-3 text-sm ${
                        selecionado
                          ? "text-zinc-600"
                          : "text-zinc-400"
                      }`}
                    >
                      {plano.descricao}
                    </p>

                    <p
                      className={`mt-4 text-sm ${
                        selecionado
                          ? "text-zinc-800"
                          : "text-zinc-300"
                      }`}
                    >
                      Até{" "}
                      <strong>
                        {plano.profissionais} profissionais
                      </strong>
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">14 dias grátis</p>
                <p className="mt-1 text-sm text-zinc-400">
                  Teste o Nexora Booking sem compromisso.
                </p>
              </div>

              <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
                Sem comissões
              </span>
            </div>

            {erro && (
              <div className="mt-5 rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-400">
                {erro}
              </div>
            )}

            <button
              type="button"
              onClick={continuar}
              disabled={aProcessar}
              className="mt-6 w-full rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {aProcessar ? "A preparar..." : "Continuar"}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push("/booking")}
              className="text-sm text-zinc-500 transition hover:text-white"
            >
              ← Voltar ao Nexora Booking
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}