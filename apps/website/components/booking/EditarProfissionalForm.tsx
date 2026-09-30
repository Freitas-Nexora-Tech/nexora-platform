"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Profissional = {
  id: string;
  nome: string;
  ativo: boolean;
};

type Servico = {
  id: string;
  nome: string;
  ativo: boolean;
};

type Props = {
  profissional: Profissional;
  servicos: Servico[];
  servicosAssociados: string[];
};

type AcessoBooking = {
  existe: boolean;
  role?: "admin" | "employee";
  username?: string;
  is_active?: boolean;
  permissions?: string[];
};

const PERMISSOES = [
  {
    id: "agenda",
    nome: "Agenda",
    descricao: "Consultar e utilizar a agenda.",
  },
  {
    id: "clientes",
    nome: "Clientes",
    descricao: "Gerir clientes.",
  },
  {
    id: "marcacoes",
    nome: "Marcações",
    descricao: "Gerir marcações.",
  },
  {
    id: "servicos",
    nome: "Serviços",
    descricao: "Gerir serviços.",
  },
  {
    id: "profissionais",
    nome: "Profissionais",
    descricao: "Gerir profissionais.",
  },
  {
    id: "disponibilidade",
    nome: "Disponibilidade",
    descricao: "Gerir disponibilidade.",
  },
  {
    id: "bloqueios",
    nome: "Bloqueios",
    descricao: "Gerir bloqueios de agenda.",
  },
  {
    id: "financeiro",
    nome: "Financeiro",
    descricao: "Aceder à área financeira.",
  },
  {
    id: "configuracoes",
    nome: "Configurações",
    descricao: "Gerir configurações do Booking.",
  },
  {
    id: "equipa",
    nome: "Equipa",
    descricao: "Gerir equipa e acessos.",
  },
] as const;

export default function EditarProfissionalForm({
  profissional,
  servicos,
  servicosAssociados,
}: Props) {
  const router = useRouter();

  const [nome, setNome] = useState(profissional.nome);
  const [ativo, setAtivo] = useState(profissional.ativo);
  const [associados, setAssociados] =
    useState<string[]>(servicosAssociados);

  const [alterandoServico, setAlterandoServico] =
    useState<string | null>(null);

  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState("");

  const [acesso, setAcesso] = useState<AcessoBooking | null>(null);
  const [aCarregarAcesso, setACarregarAcesso] = useState(true);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  const [permissoes, setPermissoes] = useState<string[]>([
    "agenda",
    "marcacoes",
    "clientes",
  ]);

  const [aCriarAcesso, setACriarAcesso] = useState(false);
  const [aGuardarAcesso, setAGuardarAcesso] = useState(false);
  const [mensagemAcesso, setMensagemAcesso] = useState("");

  useEffect(() => {
    async function carregarAcesso() {
      try {
        const response = await fetch(
          `/api/booking/profissionais/${profissional.id}/acesso`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (response.status === 403) {
          setAcesso(null);
          return;
        }

        const result = await response.json();

        if (!response.ok) {
          setAcesso(null);
          return;
        }

        if (result.temAcesso === true && result.acesso) {
          setAcesso({
            existe: true,
            role: result.acesso.role,
            username: result.acesso.username,
            is_active: result.acesso.is_active,
            permissions: result.acesso.permissoes ?? [],
          });
        } else {
          setAcesso({
            existe: false,
          });
        }
      } catch {
        setAcesso(null);
      } finally {
        setACarregarAcesso(false);
      }
    }

    carregarAcesso();
  }, [profissional.id]);

  async function alterarAssociacao(
    servicoId: string,
    associadoAtual: boolean
  ) {
    setErro("");
    setAlterandoServico(servicoId);

    try {
      const response = await fetch(
        `/api/booking/profissionais/${profissional.id}/servicos`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            servico_id: servicoId,
            associado: !associadoAtual,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setErro(
          result.error ||
            "Não foi possível alterar a associação."
        );
        return;
      }

      setAssociados((atuais) => {
        if (result.associado) {
          return atuais.includes(servicoId)
            ? atuais
            : [...atuais, servicoId];
        }

        return atuais.filter((id) => id !== servicoId);
      });
    } catch {
      setErro(
        "Ocorreu um erro ao alterar a associação."
      );
    } finally {
      setAlterandoServico(null);
    }
  }

  async function guardarAlteracoes(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErro("");
    setAGuardar(true);

    try {
      const response = await fetch(
        `/api/booking/profissionais/${profissional.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome,
            ativo,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setErro(
          result.error ||
            "Não foi possível atualizar o profissional."
        );
        return;
      }

      router.push(
        "/nexora-ai/booking/profissionais"
      );
      router.refresh();
    } catch {
      setErro(
        "Ocorreu um erro ao atualizar o profissional."
      );
    } finally {
      setAGuardar(false);
    }
  }

  function alternarPermissao(permissao: string) {
    setPermissoes((atuais) =>
      atuais.includes(permissao)
        ? atuais.filter((item) => item !== permissao)
        : [...atuais, permissao]
    );
  }

  function alternarPermissaoAcesso(
    permissao: string
  ) {
    setAcesso((atual) => {
      if (!atual) {
        return atual;
      }

      const atuais = atual.permissions ?? [];

      return {
        ...atual,
        permissions: atuais.includes(permissao)
          ? atuais.filter((item) => item !== permissao)
          : [...atuais, permissao],
      };
    });
  }

  async function criarAcessoBooking() {
    setMensagemAcesso("");
    setErro("");

    const usernameNormalizado =
      username.trim().toLowerCase();

    if (!usernameNormalizado) {
      setMensagemAcesso(
        "O username é obrigatório."
      );
      return;
    }

    if (password.length < 8) {
      setMensagemAcesso(
        "A palavra-passe deve ter pelo menos 8 caracteres."
      );
      return;
    }

    if (password !== confirmarPassword) {
      setMensagemAcesso(
        "As palavras-passe não coincidem."
      );
      return;
    }

    if (permissoes.length === 0) {
      setMensagemAcesso(
        "Selecione pelo menos uma permissão."
      );
      return;
    }

    setACriarAcesso(true);

    try {
      const response = await fetch(
        `/api/booking/profissionais/${profissional.id}/acesso`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: usernameNormalizado,
            password,
            permissions: permissoes,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setMensagemAcesso(
          result.error ||
            "Não foi possível criar o acesso."
        );
        return;
      }

      const novoAcesso = result.acesso;

      setAcesso({
        existe: true,
        role: novoAcesso?.role ?? "employee",
        username:
          novoAcesso?.username ??
          usernameNormalizado,
        is_active:
          novoAcesso?.is_active ?? true,
        permissions:
          novoAcesso?.permissoes ?? permissoes,
      });

      setUsername("");
      setPassword("");
      setConfirmarPassword("");

      setMensagemAcesso(
        "Acesso ao Booking criado com sucesso."
      );
    } catch {
      setMensagemAcesso(
        "Ocorreu um erro ao criar o acesso."
      );
    } finally {
      setACriarAcesso(false);
    }
  }

  async function guardarAcessoBooking() {
    if (
      !acesso ||
      acesso.role !== "employee"
    ) {
      return;
    }

    setMensagemAcesso("");
    setAGuardarAcesso(true);

    try {
      const response = await fetch(
        `/api/booking/profissionais/${profissional.id}/acesso`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_active:
              acesso.is_active ?? true,
            permissions:
              acesso.permissions ?? [],
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setMensagemAcesso(
          result.error ||
            "Não foi possível atualizar o acesso."
        );
        return;
      }

      const acessoAtualizado =
        result.acesso;

      setAcesso({
        existe: true,
        role:
          acessoAtualizado?.role ??
          acesso.role,
        username:
          acessoAtualizado?.username ??
          acesso.username,
        is_active:
          acessoAtualizado?.is_active ??
          acesso.is_active ??
          true,
        permissions:
          acessoAtualizado?.permissoes ??
          acesso.permissions ??
          [],
      });

      setMensagemAcesso(
        "Acesso ao Booking atualizado."
      );
    } catch {
      setMensagemAcesso(
        "Ocorreu um erro ao atualizar o acesso."
      );
    } finally {
      setAGuardarAcesso(false);
    }
  }

  return (
    <form
      onSubmit={guardarAlteracoes}
      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-black/10"
    >
      <div className="space-y-6">
        <div>
          <label
            htmlFor="nome"
            className="mb-2 block text-sm font-semibold text-slate-200"
          >
            Nome do profissional
          </label>

          <input
            id="nome"
            type="text"
            value={nome}
            onChange={(event) =>
              setNome(event.target.value)
            }
            required
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
          />
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">
              Serviços associados
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Escolha quais serviços este profissional pode realizar.
            </p>
          </div>

          {servicos.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              Ainda não existem serviços nesta empresa.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {servicos.map((servico) => {
                const associado =
                  associados.includes(servico.id);

                const alterando =
                  alterandoServico === servico.id;

                return (
                  <div
                    key={servico.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        {servico.nome}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {associado
                          ? "Pode realizar este serviço."
                          : "Não está associado a este serviço."}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        alterarAssociacao(
                          servico.id,
                          associado
                        )
                      }
                      disabled={alterando}
                      className={`inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        associado
                          ? "border-red-400/30 bg-red-400/10 text-red-400 hover:bg-red-400/20"
                          : "border-emerald-400/30 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20"
                      }`}
                    >
                      {alterando
                        ? "A alterar..."
                        : associado
                          ? "Desassociar"
                          : "Associar"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(event) =>
              setAtivo(event.target.checked)
            }
            className="h-4 w-4 accent-cyan-400"
          />

          <span>
            <span className="block text-sm font-semibold text-slate-200">
              Profissional ativo
            </span>

            <span className="mt-1 block text-xs text-slate-500">
              O profissional poderá ser utilizado nas marcações.
            </span>
          </span>
        </label>

        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
          <div>
            <h2 className="text-base font-semibold text-white">
              Acesso ao Nexora Booking
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              O acesso ao Booking é opcional. Um profissional pode existir sem ter uma conta de acesso.
            </p>
          </div>

          {aCarregarAcesso ? (
            <p className="mt-4 text-sm text-slate-400">
              A verificar acesso...
            </p>
          ) : acesso?.existe &&
            acesso.role === "admin" ? (
            <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
              <p className="text-sm font-semibold text-amber-300">
                Administrador
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Username:{" "}
                <span className="font-semibold text-slate-200">
                  {acesso.username}
                </span>
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Este acesso pertence a um administrador da empresa e não pode ser alterado nesta área.
              </p>
            </div>
          ) : acesso?.existe &&
            acesso.role === "employee" ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-xs text-slate-500">
                  Username
                </p>

                <p className="mt-1 text-sm font-semibold text-white">
                  {acesso.username}
                </p>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
                <input
                  type="checkbox"
                  checked={
                    acesso.is_active ?? true
                  }
                  onChange={(event) =>
                    setAcesso((atual) =>
                      atual
                        ? {
                            ...atual,
                            is_active:
                              event.target.checked,
                          }
                        : atual
                    )
                  }
                  className="h-4 w-4 accent-cyan-400"
                />

                <span>
                  <span className="block text-sm font-semibold text-slate-200">
                    Acesso ativo
                  </span>

                  <span className="mt-1 block text-xs text-slate-500">
                    Desative para impedir o profissional de entrar no Booking.
                  </span>
                </span>
              </label>

              <div>
                <h3 className="text-sm font-semibold text-slate-200">
                  Permissões
                </h3>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {PERMISSOES.map((permissao) => {
                    const selecionada =
                      (
                        acesso.permissions ??
                        []
                      ).includes(
                        permissao.id
                      );

                    return (
                      <label
                        key={permissao.id}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4"
                      >
                        <input
                          type="checkbox"
                          checked={selecionada}
                          onChange={() =>
                            alternarPermissaoAcesso(
                              permissao.id
                            )
                          }
                          className="mt-1 h-4 w-4 accent-cyan-400"
                        />

                        <span>
                          <span className="block text-sm font-semibold text-slate-200">
                            {permissao.nome}
                          </span>

                          <span className="mt-1 block text-xs text-slate-500">
                            {permissao.descricao}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {mensagemAcesso && (
                <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm text-cyan-300">
                  {mensagemAcesso}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={
                    guardarAcessoBooking
                  }
                  disabled={aGuardarAcesso}
                  className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {aGuardarAcesso
                    ? "A guardar..."
                    : "Guardar acesso Booking"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-sm font-semibold text-slate-200">
                  Este profissional não tem acesso ao Booking.
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Pode criar agora uma conta de acesso e definir exatamente quais áreas poderá utilizar.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="booking-username"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    Username
                  </label>

                  <input
                    id="booking-username"
                    type="text"
                    value={username}
                    onChange={(event) =>
                      setUsername(
                        event.target.value
                      )
                    }
                    autoComplete="off"
                    placeholder="ex.: isabelle"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                  />

                  <p className="mt-1 text-xs text-slate-500">
                    O username será utilizado para entrar no Booking.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="booking-password"
                      className="mb-2 block text-sm font-semibold text-slate-200"
                    >
                      Palavra-passe inicial
                    </label>

                    <input
                      id="booking-password"
                      type="password"
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value
                        )
                      }
                      autoComplete="new-password"
                      minLength={8}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="booking-confirmar-password"
                      className="mb-2 block text-sm font-semibold text-slate-200"
                    >
                      Confirmar palavra-passe
                    </label>

                    <input
                      id="booking-confirmar-password"
                      type="password"
                      value={confirmarPassword}
                      onChange={(event) =>
                        setConfirmarPassword(
                          event.target.value
                        )
                      }
                      autoComplete="new-password"
                      minLength={8}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    Permissões iniciais
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Escolha as áreas que este profissional poderá utilizar.
                  </p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {PERMISSOES.map((permissao) => {
                      const selecionada =
                        permissoes.includes(
                          permissao.id
                        );

                      return (
                        <label
                          key={permissao.id}
                          className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4"
                        >
                          <input
                            type="checkbox"
                            checked={selecionada}
                            onChange={() =>
                              alternarPermissao(
                                permissao.id
                              )
                            }
                            className="mt-1 h-4 w-4 accent-cyan-400"
                          />

                          <span>
                            <span className="block text-sm font-semibold text-slate-200">
                              {permissao.nome}
                            </span>

                            <span className="mt-1 block text-xs text-slate-500">
                              {permissao.descricao}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {mensagemAcesso && (
                  <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm text-cyan-300">
                    {mensagemAcesso}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={
                      criarAcessoBooking
                    }
                    disabled={aCriarAcesso}
                    className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {aCriarAcesso
                      ? "A criar acesso..."
                      : "Criar acesso ao Booking"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {erro && (
          <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-400">
            {erro}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/nexora-ai/booking/profissionais"
              )
            }
            className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={aGuardar}
            className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {aGuardar
              ? "A guardar..."
              : "✓ Guardar alterações"}
          </button>
        </div>
      </div>
    </form>
  );
}