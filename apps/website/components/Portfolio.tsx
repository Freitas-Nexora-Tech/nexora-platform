import { projetos } from "@/data/projetos";
import PortfolioCard from "./PortfolioCard";

export default function Portfolio() {
    



return (
  <section className="max-w-7xl mx-auto px-6 py-20">
    <h2 className="text-4xl font-bold text-center mb-12">
      O nosso Portfólio
    </h2>

    <div className="grid md:grid-cols-3 gap-8">
      {projetos.map((projeto) => (
        <PortfolioCard
          key={projeto.titulo}
          titulo={projeto.titulo}
          descricao={projeto.descricao}
          tecnologias={projeto.tecnologias}
          imagem={projeto.imagem}
          slug={projeto.slug}
        />
))}
    </div>
  </section>
);
}