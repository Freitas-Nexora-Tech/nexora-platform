"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Documento = {
  id: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
  processado: boolean;
};

export default function NexoraAIDocumentsPage() {
  const [ficheiro, setFicheiro] =
    useState<File | null>(null);

  const [documentos, setDocumentos] =
    useState<Documento[]>([]);

  const [aCarregar, setACarregar] =
    useState(false);

  const [aExtrair, setAExtrair] =
    useState(false);

  const [aEliminar, setAEliminar] =
    useState(false);

  const [aCarregarLista, setACarregarLista] =
    useState(true);

  const [mensagem, setMensagem] =
    useState("");

  const [erro, setErro] =
    useState("");

  async function carregarDocumentos() {
    try {
      setACarregarLista(true);
      setErro("");

      const response = await fetch(
        "/api/documents",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Não foi possível carregar os documentos."
        );
      }

      setDocumentos(
        data.documentos || []
      );
    } catch (error) {
      console.error(
        "Erro ao carregar documentos:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os documentos."
      );
    } finally {
      setACarregarLista(false);
    }
  }

  useEffect(() => {
    carregarDocumentos();
  }, []);

  async function enviarDocumento() {
    if (!ficheiro || aCarregar) {
      return;
    }

    setACarregar(true);
    setMensagem("");
    setErro("");

    try {
      const formData = new FormData();

      formData.append(
        "file",
        ficheiro
      );

      const response = await fetch(
        "/api/documents",
        {
          method: "POST",
          body: formData,
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Não foi possível carregar o documento."
        );
      }

      setMensagem(
        "Documento carregado com sucesso."
      );

      setFicheiro(null);

      const input =
        document.getElementById(
          "documento"
        ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }

      await carregarDocumentos();
    } catch (error) {
      console.error(
        "Erro ao carregar documento:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao carregar o documento."
      );
    } finally {
      setACarregar(false);
    }
  }

  async function extrairTexto(
    documento: Documento
  ) {
    if (
      aExtrair ||
      documento.mime_type !==
        "application/pdf"
    ) {
      return;
    }

    setAExtrair(true);
    setMensagem("");
    setErro("");

    try {
      const response = await fetch(
        "/api/documents/extract",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            documentId:
              documento.id,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Não foi possível extrair o texto."
        );
      }

      setMensagem(
        `Texto extraído com sucesso. ${data.characters} caracteres encontrados.`
      );

      await carregarDocumentos();
    } catch (error) {
      console.error(
        "Erro ao extrair texto:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao extrair o texto."
      );
    } finally {
      setAExtrair(false);
    }
  }

  async function eliminarDocumento(
    documento: Documento
  ) {
    const confirmar =
      window.confirm(
        `Tem a certeza que pretende eliminar "${documento.file_name}"?`
      );

    if (!confirmar) {
      return;
    }

    setAEliminar(true);
    setMensagem("");
    setErro("");

    try {
      const response = await fetch(
        "/api/documents",
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            documentId:
              documento.id,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Não foi possível eliminar o documento."
        );
      }

      setMensagem(
        "Documento eliminado com sucesso."
      );

      await carregarDocumentos();
    } catch (error) {
      console.error(
        "Erro ao eliminar documento:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao eliminar o documento."
      );
    } finally {
      setAEliminar(false);
    }
  }

  function formatarTamanho(
    tamanho: number | null
  ) {
    if (!tamanho) {
      return "Tamanho desconhecido";
    }

    if (tamanho < 1024) {
      return `${tamanho} B`;
    }

    if (tamanho < 1024 * 1024) {
      return `${(
        tamanho / 1024
      ).toFixed(1)} KB`;
    }

    return `${(
      tamanho /
      1024 /
      1024
    ).toFixed(2)} MB`;
  }

  function formatarData(
    data: string
  ) {
    return new Date(
      data
    ).toLocaleDateString(
      "pt-PT",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-20">
        <div className="absolute left-1/2 top-20 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-5xl">

          {/* Cabeçalho */}

          <div className="text-center">
            <span className="font-semibold uppercase tracking-[0.3em] text-cyan-400">
              Nexora AI
            </span>

            <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">
              Documentos da empresa
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-400">
              Faça a gestão dos documentos
              que alimentam o conhecimento
              da Nexora AI.
            </p>
          </div>

          {/* Upload */}

          <div className="mt-14 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl md:p-10">

            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-8">
              <label
                htmlFor="documento"
                className="block cursor-pointer text-center"
              >
                <div className="text-5xl">
                  📄
                </div>

                <p className="mt-4 text-lg font-semibold text-slate-200">
                  Selecionar documento
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  PDF, TXT ou DOCX até 10 MB
                </p>

                <input
                  id="documento"
                  type="file"
                  accept=".pdf,.txt,.docx"
                  className="mt-6 block w-full text-sm text-slate-400 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-500 file:px-5 file:py-3 file:font-bold file:text-slate-950 hover:file:bg-cyan-400"
                  onChange={(event) => {
                    const selecionado =
                      event.target.files?.[0] ||
                      null;

                    setFicheiro(
                      selecionado
                    );

                    setMensagem("");
                    setErro("");
                  }}
                />
              </label>
            </div>

            {ficheiro && (
              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm font-semibold text-cyan-400">
                  Documento selecionado
                </p>

                <p className="mt-2 break-all text-slate-300">
                  {ficheiro.name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {formatarTamanho(
                    ficheiro.size
                  )}
                </p>
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={
                  enviarDocumento
                }
                disabled={
                  !ficheiro ||
                  aCarregar
                }
                className="rounded-xl bg-cyan-500 px-8 py-4 font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {aCarregar
                  ? "A carregar..."
                  : "Carregar documento"}
              </button>
            </div>

            {mensagem && (
              <p className="mt-6 text-center font-medium text-cyan-400">
                {mensagem}
              </p>
            )}

            {erro && (
              <p className="mt-6 text-center font-medium text-red-400">
                {erro}
              </p>
            )}
          </div>

          {/* Lista de documentos */}

          <div className="mt-10">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Documentos da empresa
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Documentos privados associados
                  à tua empresa.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  carregarDocumentos
                }
                disabled={
                  aCarregarLista
                }
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-400 disabled:opacity-50"
              >
                Atualizar
              </button>
            </div>

            {aCarregarLista ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-500">
                A carregar documentos...
              </div>
            ) : documentos.length ===
              0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
                <p className="text-slate-400">
                  Ainda não existem
                  documentos carregados.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {documentos.map(
                  (documento) => (
                    <div
                      key={
                        documento.id
                      }
                      className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700"
                    >
                      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-2xl">
                            📄
                          </div>

                          <div className="min-w-0">
                            <p className="break-all font-semibold text-slate-200">
                              {
                                documento.file_name
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                documento.mime_type ||
                                "Tipo desconhecido"
                              }
                              {" · "}
                              {formatarTamanho(
                                documento.file_size
                              )}
                              {" · "}
                              {formatarData(
                                documento.created_at
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-3">

                          {documento.processado ? (
                            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-400">
                              ✓ Texto extraído
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                extrairTexto(
                                  documento
                                )
                              }
                              disabled={
                                aExtrair ||
                                aEliminar ||
                                documento.mime_type !==
                                  "application/pdf"
                              }
                              className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-400 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {aExtrair
                                ? "A extrair..."
                                : "Extrair texto"}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              eliminarDocumento(
                                documento
                              )
                            }
                            disabled={
                              aEliminar ||
                              aExtrair
                            }
                            className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {aEliminar
                              ? "A eliminar..."
                              : "Eliminar"}
                          </button>

                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Privacidade */}

          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm font-semibold text-slate-300">
              🔐 Privacidade
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Os documentos são armazenados
              num espaço privado e associados
              à empresa autenticada. A Nexora
              só disponibiliza à IA documentos
              pertencentes à empresa do
              utilizador autenticado.
            </p>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}