"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const PERMISSOES = [
  { id: "agenda", label: "Agenda" },
  { id: "clientes", label: "Clientes" },
  { id: "marcacoes", label: "Marcações" },
  { id: "servicos", label: "Serviços" },
  { id: "profissionais", label: "Profissionais" },
  { id: "disponibilidade", label: "Disponibilidade" },
  { id: "bloqueios", label: "Bloqueios" },
  { id: "financeiro", label: "Financeiro" },
  { id: "configuracoes", label: "Configurações" },
] as const;

export default function NovoProfissionalForm() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [ativo, setAtivo] = useState(true);

  const [temAcessoBooking, setTemAcessoBooking] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [permissoes, setPermissoes] = useState<string[]>([]);

  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState("");

  function alternarPermissao(permission: string) {
    setPermissoes((atual) =>
      atual.includes(permission)
        ? atual.filter((item) => item !== permission)
        : [...atual, permission],
    );
  }

  async function criarProfissional(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");

    if (!nome.trim()) {
      setErro("Indique o nome do profissional.");
      return;
    }

    if (temAcessoBooking) {
      if (!username.trim()) {
        setErro("Indique o username do profissional.");
        return;
      }

      if (password.length < 8) {
        setErro("A palavra-passe deve ter pelo menos 8 caracteres.");
        return;
      }

      if (password !== confirmarPassword) {
        setErro("As palavras-passe não coincidem.");
        return;
      }

      if (permissoes.length === 0) {
        setErro("Selecione pelo menos uma permissão.");
        return;
      }
    }

    setAGuardar(true);

    let profissionalId = "";

    try {
      const response = await fetch("/api/booking/profissionais", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nome.trim(),
          ativo,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErro(
          result.error || "Não foi possível criar o profissional.",
        );
        return;
      }

      profissionalId = result.id;

      if (temAcessoBooking) {
        const acessoResponse = await fetch(
          `/api/booking/profissionais/${profissionalId}/acesso`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: username.trim().toLowerCase(),
              password,
              confirmarPassword,
              permissions: permissoes,
            }),
          },
        );

        const acessoResult = await acessoResponse.json();

        if (!acessoResponse.ok) {
          setErro(
            acessoResult.error ||
              "O profissional foi criado, mas não foi possível criar o acesso ao Booking.",
          );
          return;
        }
      }

      router.push("/nexora-ai/booking/profissionais");
      router.refresh();
    } catch {
      setErro("Ocorreu um erro ao criar o profissional.");
    } finally {
      setAGuardar(false);
    }
  }

  return (
    <form onSubmit={criarProfissional} className="space-y-6">
      <div>
        <label
          htmlFor="nome"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Nome
        </label>

        <input
          id="nome"
          type="text"
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          disabled={aGuardar}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
          placeholder="Nome do profissional"
        />
      </div>

      <label className="flex items-center gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={ativo}
          onChange={(event) => setAtivo(event.target.checked)}
          disabled={aGuardar}
          className="h-4 w-4"
        />
        Profissional ativo
      </label>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Acesso ao Booking
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Pode criar o profissional sem acesso ao sistema ou criar já a
            conta de acesso.
          </p>
        </div>

        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={temAcessoBooking}
            onChange={(event) => {
              setTemAcessoBooking(event.target.checked);
              setErro("");
            }}
            disabled={aGuardar}
            className="h-4 w-4"
          />
          Este profissional terá acesso ao Booking
        </label>

        {temAcessoBooking && (
          <div className="mt-5 space-y-5">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Username
              </label>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value.toLowerCase())
                }
                disabled={aGuardar}
                autoComplete="off"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-500"
                placeholder="ex.: deise"
              />

              <p className="mt-1 text-xs text-slate-500">
                3 a 40 caracteres. Pode usar letras, números, ponto,
                underscore e hífen.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Palavra-passe inicial
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={aGuardar}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-500"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmarPassword"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Confirmar palavra-passe
                </label>

                <input
                  id="confirmarPassword"
                  type="password"
                  value={confirmarPassword}
                  onChange={(event) =>
                    setConfirmarPassword(event.target.value)
                  }
                  disabled={aGuardar}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-500"
                  placeholder="Repita a palavra-passe"
                />
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-slate-700">
                Permissões
              </p>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {PERMISSOES.map((permission) => (
                  <label
                    key={permission.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:border-slate-300"
                  >
                    <input
                      type="checkbox"
                      checked={permissoes.includes(permission.id)}
                      onChange={() =>
                        alternarPermissao(permission.id)
                      }
                      disabled={aGuardar}
                      className="h-4 w-4"
                    />

                    {permission.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {erro && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() =>
            router.push("/nexora-ai/booking/profissionais")
          }
          disabled={aGuardar}
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={aGuardar}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {aGuardar ? "A guardar..." : "Criar profissional"}
        </button>
      </div>
    </form>
  );
}