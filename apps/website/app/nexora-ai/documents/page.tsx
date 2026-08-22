"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Documento = {
  id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
};

export default function NexoraAIDocumentsPage() {
  const [ficheiro, setFicheiro] =
    useState<File | null>(null);

  const [documento, setDocumento] =
    useState<Documento | null>(null);

  const [aCarregar, setACarregar] =
    useState(false);

  const [aExtrair, setAExtrair] =
    useState(false);

  const [mensagem, setMensagem] =
    useState("");

  const [erro, setErro] =
    useState("");

  const [textoExtraido, setTextoExtraido] =
    useState("");

  async function enviarDocumento() {
    if (!ficheiro || aCarregar) {
      return;
    }

    setACarregar(true);
    setMensagem("");
    setErro("");
    setTextoExtraido("");
    setDocumento(null);

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

      setDocumento(
        data.documento
      );

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

  async function extrairTexto() {
    if (!documento || aExtrair) {
      return;
    }

    setAExtrair(true);
    setMensagem("");
    setErro("");
    setTextoExtraido("");

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

      /*
       * Nesta primeira versão a API guarda
       * o texto no Supabase, mas não o devolve.
       *
       * Isto é intencional.
       * Na próxima etapa vamos criar a leitura
       * dos documentos pela Nexora AI.
       */
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

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-20">
        <div className="absolute left-1/2 top-20 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl">
          {/* Cabeçalho */}

          <div className="text-center">
            <span className="font-semibold uppercase tracking-[0.3em] text-cyan-400">
              Nexora AI
            </span>

            <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">
              Documentos da empresa
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-400">
              Carregue documentos para que
              a Nexora AI possa utilizar
              esse conhecimento.
            </p>
          </div>

          {/* Área principal */}

          <div className="mt-14 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl md:p-10">

            {/* Upload */}

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

                    setDocumento(null);
                    setMensagem("");
                    setErro("");
                    setTextoExtraido("");
                  }}
                />
              </label>
            </div>

            {/* Ficheiro selecionado */}

            {ficheiro && (
              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm font-semibold text-cyan-400">
                  Documento selecionado
                </p>

                <p className="mt-2 break-all text-slate-300">
                  {ficheiro.name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {(
                    ficheiro.size /
                    1024 /
                    1024
                  ).toFixed(2)}{" "}
                  MB
                </p>
              </div>
            )}

            {/* Botão upload */}

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

            {/* Documento carregado */}

            {documento && (
              <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-6">
                <p className="text-sm font-semibold text-cyan-400">
                  Documento carregado
                </p>

                <p className="mt-2 break-all font-medium text-slate-200">
                  {documento.file_name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  ID: {documento.id}
                </p>

                {/* Extração */}

                <div className="mt-6 border-t border-slate-800 pt-6">
                  <p className="text-sm text-slate-400">
                    O documento já está guardado
                    de forma privada. Agora
                    podemos extrair o texto para
                    a Nexora AI.
                  </p>

                  <button
                    type="button"
                    onClick={
                      extrairTexto
                    }
                    disabled={
                      aExtrair ||
                      documento.mime_type !==
                        "application/pdf"
                    }
                    className="mt-5 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-6 py-3 font-bold text-cyan-400 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {aExtrair
                      ? "A extrair texto..."
                      : "Extrair texto do PDF"}
                  </button>

                  {documento.mime_type !==
                    "application/pdf" && (
                    <p className="mt-3 text-xs text-slate-500">
                      A extração nesta etapa
                      está disponível apenas
                      para PDFs.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Mensagem de sucesso */}

            {mensagem && (
              <p className="mt-6 text-center font-medium text-cyan-400">
                {mensagem}
              </p>
            )}

            {/* Erro */}

            {erro && (
              <p className="mt-6 text-center font-medium text-red-400">
                {erro}
              </p>
            )}

            {/* Privacidade */}

            <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm font-semibold text-slate-300">
                🔐 Privacidade
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Os documentos são
                armazenados num espaço
                privado e associados à
                empresa autenticada. Outras
                empresas não têm acesso a
                estes ficheiros.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}