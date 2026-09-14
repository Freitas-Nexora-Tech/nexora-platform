"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Cliente = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  notas: string | null;
};

type Props = {
  cliente: Cliente;
};

export default function EditarClienteForm({ cliente }: Props) {
  const router = useRouter();

  const [nome, setNome] = useState(cliente.nome);
  const [email, setEmail] = useState(cliente.email ?? "");
  const [telefone, setTelefone] = useState(cliente.telefone ?? "");
  const [notas, setNotas] = useState(cliente.notas ?? "");

  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");
    setSucesso("");

    if (!nome.trim()) {
      setErro("O nome é obrigatório.");
      return;
    }

    setAGuardar(true);

    try {
      const response = await fetch(`/api/booking/clientes/${cliente.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim(),
          telefone: telefone.trim(),
          notas: notas.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.erro || "Não foi possível atualizar o cliente.");
      }

      setSucesso("Cliente atualizado com sucesso.");

      setTimeout(() => {
        router.push("/nexora-ai/booking/clientes");
        router.refresh();
      }, 700);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao atualizar o cliente.",
      );
    } finally {
      setAGuardar(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="nome"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Nome *
        </label>

        <input
          id="nome"
          type="text"
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
          placeholder="Nome do cliente"
          required
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Email
        </label>

        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
          placeholder="cliente@email.com"
        />
      </div>

      <div>
        <label
          htmlFor="telefone"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Telefone
        </label>

        <input
          id="telefone"
          type="tel"
          value={telefone}
          onChange={(event) => setTelefone(event.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
          placeholder="+351 912 345 678"
        />
      </div>

      <div>
        <label
          htmlFor="notas"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Notas
        </label>

        <textarea
          id="notas"
          value={notas}
          onChange={(event) => setNotas(event.target.value)}
          rows={5}
          className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
          placeholder="Notas sobre o cliente..."
        />
      </div>

      {erro && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {sucesso}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={aGuardar}
          className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {aGuardar ? "A guardar..." : "Guardar alterações"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/nexora-ai/booking/clientes")}
          className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold text-slate-200 transition hover:border-slate-500"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}