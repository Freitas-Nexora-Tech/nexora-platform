"use client";

import { FormEvent, useState } from "react";

export default function Contact() {
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);

  const dados = {
    nome: formData.get("nome"),
    email: formData.get("email"),
    empresa: formData.get("empresa"),
    mensagem: formData.get("mensagem"),
  };

  try {
    const resposta = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dados),
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      throw new Error(resultado.error || "Erro ao enviar mensagem.");
    }

    setEnviado(true);
    form.reset();

    setTimeout(() => {
      setEnviado(false);
    }, 5000);

  } catch (erro) {
    console.error(erro);

    alert(
      "Não foi possível enviar a mensagem. Tente novamente dentro de alguns instantes."
    );
  }
}

  return (
    <section
      id="contacto"
      className="bg-slate-950 text-white py-24 px-6"
    >
      <div className="max-w-6xl mx-auto">

        {/* Cabeçalho */}
        <div className="max-w-3xl">
          <span className="text-cyan-400 font-semibold uppercase tracking-widest">
            Contacto
          </span>

          <h2 className="text-4xl font-bold mt-4">
            Vamos transformar a sua ideia em realidade.
          </h2>

          <p className="mt-6 text-slate-400 leading-7">
            Tem um projeto em mente ou procura uma solução tecnológica
            para a sua empresa? Fale connosco e vamos encontrar a melhor
            solução para o seu negócio.
          </p>
        </div>

        {/* Conteúdo */}
        <div className="grid md:grid-cols-2 gap-12 mt-16">

          {/* Informações */}
          <div className="space-y-6">

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-cyan-500 transition">
              <div className="text-cyan-400 text-2xl mb-3">
                ✉️
              </div>

              <h3 className="text-xl font-semibold">
                Email
              </h3>

              <p className="text-slate-400 mt-2">
                Entre em contacto connosco por email.
              </p>

              <a
                href="mailto:contacto@nexoratech.pt"
                className="inline-block mt-4 text-cyan-400 hover:text-cyan-300 transition"
              >
                contacto@nexoratech.pt
              </a>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-cyan-500 transition">
              <div className="text-cyan-400 text-2xl mb-3">
                ☎️
              </div>

              <h3 className="text-xl font-semibold">
                WhatsApp
              </h3>

              <p className="text-slate-400 mt-2">
                Fale diretamente connosco pelo WhatsApp.
              </p>

              <a
                href="https://wa.me/351933932739"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-cyan-400 hover:text-cyan-300 transition"
              >
                Enviar mensagem
              </a>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-cyan-500 transition">
              <div className="text-cyan-400 text-2xl mb-3">
                ⚡
              </div>

              <h3 className="text-xl font-semibold">
                Resposta rápida
              </h3>

              <p className="text-slate-400 mt-2">
                Analisamos o seu pedido e procuramos responder
                rapidamente.
              </p>
            </div>

          </div>

          {/* Formulário */}
          <form
            onSubmit={handleSubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-8"
          >

            <div className="grid md:grid-cols-2 gap-6">

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nome
                </label>

                <input
                  type="text"
                  name="nome"
                  required
                  placeholder="O seu nome"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500 transition"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  required
                  placeholder="seu@email.com"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500 transition"
                />
              </div>

            </div>

            {/* Empresa */}
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">
                Empresa
              </label>

              <input
                type="text"
                name="empresa"
                placeholder="Nome da empresa (opcional)"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500 transition"
              />
            </div>

            {/* Mensagem */}
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">
                Mensagem
              </label>

              <textarea
                name="mensagem"
                required
                rows={6}
                placeholder="Conte-nos um pouco sobre o seu projeto..."
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500 transition"
              />
            </div>

            {/* Botão */}
            <button
              type="submit"
              className="mt-6 w-full rounded-xl bg-cyan-500 px-6 py-4 font-bold text-slate-950 hover:bg-cyan-400 transition"
            >
              Enviar mensagem
            </button>

            {/* Mensagem de sucesso */}
            {enviado && (
              <div className="mt-5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-4 text-center text-cyan-300">
                ✅ Mensagem recebida!
                <br />
                Obrigado pelo contacto. Entraremos em contacto consigo
                brevemente.
              </div>
            )}

          </form>

        </div>
      </div>
    </section>
  );
}