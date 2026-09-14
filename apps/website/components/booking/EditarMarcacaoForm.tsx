"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Cliente = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
};

type Servico = {
  id: string;
  nome: string;
  duracao_minutos: number;
  preco: number;
};

type Profissional = {
  id: string;
  nome: string;
};

type Agendamento = {
  id: string;
  cliente_id: string;
  servico_id: string;
  profissional_id: string;
  inicio: string;
  fim: string;
  estado: string;
  notas: string | null;
};

type Props = {
  agendamento: Agendamento;
  clientes: Cliente[];
  servicos: Servico[];
  profissionais: Profissional[];
};

function formatarDataParaInput(data: string) {
  const d = new Date(data);

  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function formatarHoraParaInput(data: string) {
  const d = new Date(data);

  const horas = String(d.getHours()).padStart(2, "0");
  const minutos = String(d.getMinutes()).padStart(2, "0");

  return `${horas}:${minutos}`;
}

export default function EditarMarcacaoForm({
  agendamento,
  clientes,
  servicos,
  profissionais,
}: Props) {
  const router = useRouter();

  const [clienteId, setClienteId] = useState(agendamento.cliente_id);
  const [servicoId, setServicoId] = useState(agendamento.servico_id);
  const [profissionalId, setProfissionalId] = useState(
    agendamento.profissional_id
  );

  const [data, setData] = useState(
    formatarDataParaInput(agendamento.inicio)
  );

  const [hora, setHora] = useState(
    formatarHoraParaInput(agendamento.inicio)
  );

  const [notas, setNotas] = useState(agendamento.notas ?? "");

  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const [aCarregarHorarios, setACarregarHorarios] = useState(false);

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [aGuardar, setAGuardar] = useState(false);

  const servicoSelecionado = useMemo(
    () => servicos.find((servico) => servico.id === servicoId),
    [servicos, servicoId]
  );

  const clienteSelecionado = useMemo(
    () => clientes.find((cliente) => cliente.id === clienteId),
    [clientes, clienteId]
  );

  useEffect(() => {
    async function carregarDisponibilidade() {
      if (!servicoId || !profissionalId || !data) {
        setHorariosDisponiveis([]);
        return;
      }

      try {
        setACarregarHorarios(true);

        const resposta = await fetch("/api/booking/disponibilidade", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            profissional_id: profissionalId,
            servico_id: servicoId,
            data,
            agendamento_id: agendamento.id,
          }),
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
          throw new Error(
            resultado?.error ||
              "Não foi possível carregar os horários disponíveis."
          );
        }

        setHorariosDisponiveis(resultado.horarios ?? []);
      } catch (error) {
        console.error(error);
        setHorariosDisponiveis([]);
      } finally {
        setACarregarHorarios(false);
      }
    }

    carregarDisponibilidade();
  }, [servicoId, profissionalId, data, agendamento.id]);

  useEffect(() => {
    setErro("");
    setMensagem("");
  }, [clienteId, servicoId, profissionalId, data, hora, notas]);

  async function guardarAlteracoes(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setErro("");
    setMensagem("");

    if (!clienteId || !servicoId || !profissionalId || !data || !hora) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }

    if (!servicoSelecionado) {
      setErro("Serviço inválido.");
      return;
    }

    try {
      setAGuardar(true);

      const inicio = new Date(`${data}T${hora}:00`);

      if (Number.isNaN(inicio.getTime())) {
        setErro("A data ou hora selecionada é inválida.");
        return;
      }

      const fim = new Date(
        inicio.getTime() + servicoSelecionado.duracao_minutos * 60 * 1000
      );

      const resposta = await fetch(
        `/api/booking/agendamentos/${agendamento.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cliente_id: clienteId,
            servico_id: servicoId,
            profissional_id: profissionalId,
            inicio: inicio.toISOString(),
            fim: fim.toISOString(),
            notas: notas.trim() || null,
          }),
        }
      );

      const resultado = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        throw new Error(
          resultado?.error || "Não foi possível guardar as alterações."
        );
      }

      setMensagem("Marcação atualizada com sucesso.");

      setTimeout(() => {
        router.push("/nexora-ai/booking/calendario");
        router.refresh();
      }, 500);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao atualizar a marcação."
      );
    } finally {
      setAGuardar(false);
    }
  }

  return (
    <form
      onSubmit={guardarAlteracoes}
      className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-xl"
    >
      <div>
        <label
          htmlFor="cliente"
          className="mb-2 block text-sm font-semibold text-slate-300"
        >
          Cliente
        </label>

        <select
          id="cliente"
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
          required
        >
          <option value="">Selecionar cliente</option>

          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nome}
              {cliente.telefone ? ` — ${cliente.telefone}` : ""}
            </option>
          ))}
        </select>

        {clienteSelecionado?.email && (
          <p className="mt-2 text-xs text-slate-500">
            {clienteSelecionado.email}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="servico"
          className="mb-2 block text-sm font-semibold text-slate-300"
        >
          Serviço
        </label>

        <select
          id="servico"
          value={servicoId}
          onChange={(e) => setServicoId(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
          required
        >
          <option value="">Selecionar serviço</option>

          {servicos.map((servico) => (
            <option key={servico.id} value={servico.id}>
              {servico.nome} — {servico.duracao_minutos} min —{" "}
              {Number(servico.preco).toFixed(2)} €
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="profissional"
          className="mb-2 block text-sm font-semibold text-slate-300"
        >
          Profissional
        </label>

        <select
          id="profissional"
          value={profissionalId}
          onChange={(e) => setProfissionalId(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
          required
        >
          <option value="">Selecionar profissional</option>

          {profissionais.map((profissional) => (
            <option key={profissional.id} value={profissional.id}>
              {profissional.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="data"
            className="mb-2 block text-sm font-semibold text-slate-300"
          >
            Data
          </label>

          <input
            id="data"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
            required
          />
        </div>

        <div>
          <label
            htmlFor="hora"
            className="mb-2 block text-sm font-semibold text-slate-300"
          >
            Hora
          </label>

          {aCarregarHorarios ? (
            <div className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-500">
              A carregar horários disponíveis...
            </div>
          ) : horariosDisponiveis.length === 0 ? (
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-amber-400">
              Não existem horários disponíveis para esta data.
            </div>
          ) : (
            <select
              id="hora"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
              required
            >
              <option value="">Selecionar horário</option>

              {horariosDisponiveis.map((horario) => (
                <option key={horario} value={horario}>
                  {horario}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="notas"
          className="mb-2 block text-sm font-semibold text-slate-300"
        >
          Observações
        </label>

        <textarea
          id="notas"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={4}
          placeholder="Observações sobre a marcação..."
          className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
        />
      </div>

      {mensagem && (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-400">
          {mensagem}
        </div>
      )}

      {erro && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-400">
          {erro}
        </div>
      )}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push("/nexora-ai/booking/calendario")}
          className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={aGuardar}
          className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-bold text-cyan-400 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {aGuardar ? "A confirmar..." : "✓ Confirmar alterações"}
        </button>
      </div>
    </form>
  );
}