
import { projetos } from "@/data/projetos";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
type PortfolioPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PortfolioDetalhe({
  params,
}: PortfolioPageProps) {
  const { slug } = await params;

  const projeto = projetos.find(
    (projeto) => projeto.slug === slug
  );

  if (!projeto) {
    notFound();
  }
  const indiceAtual = projetos.findIndex(
  (projeto) => projeto.slug === slug
  );

  const projetoAnterior =
   indiceAtual > 0 ? projetos[indiceAtual - 1] : null;

  const proximoProjeto =
   indiceAtual < projetos.length - 1
    ? projetos[indiceAtual + 1]
    : null;

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-24">
      <div className="max-w-6xl mx-auto grid gap-12 lg:grid-cols-2 items-center">

  <div>
    <Image
      src={projeto.imagem}
      alt={projeto.titulo}
      width={1200}
      height={700}
      className="w-full rounded-2xl object-cover border border-slate-800 shadow-2xl"
    />
  </div>

  <div>

    <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
      {projeto.titulo}
    </h1>

    <p className="mt-6 text-slate-300 text-lg">
      {projeto.descricao}
    </p>

    <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
        Tecnologias utilizadas
      </h2>

      <p className="mt-3 text-lg font-semibold text-cyan-400">
        {projeto.tecnologias}
      </p>
    </div>

    <Link
      href="/portfolio"
      className="
        inline-flex
        items-center
        gap-2
        mt-10
        px-6
        py-3
        rounded-xl
        bg-cyan-500
        text-slate-950
        font-semibold
        transition-all
        duration-300
        hover:bg-cyan-400
        hover:-translate-x-1
        hover:shadow-lg
        hover:shadow-cyan-500/30"
     >
      ← Voltar ao Portfólio
    </Link>
    <div className="mt-16 flex items-center justify-between gap-4 border-t border-slate-800 pt-8">

      {projetoAnterior ? (
     <Link
       href={`/portfolio/${projetoAnterior.slug}`}
       className="group"
      >
      <span className="block text-sm text-slate-500">
        Projeto anterior
      </span>

      <span className="mt-1 block font-semibold text-white transition-colors group-hover:text-cyan-400">
        ← {projetoAnterior.titulo}
      </span>
     </Link>
     ) : (
    <div />
  )}

  {proximoProjeto ? (
    <Link
      href={`/portfolio/${proximoProjeto.slug}`}
      className="group text-right"
    >
      <span className="block text-sm text-slate-500">
        Próximo projeto
      </span>

      <span className="mt-1 block font-semibold text-white transition-colors group-hover:text-cyan-400">
        {proximoProjeto.titulo} →
      </span>
    </Link>
  ) : (
    <div />
  )}

</div>

  </div>

</div>
    </main>
  );
}