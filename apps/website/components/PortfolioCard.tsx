
   import Image from "next/image";
   import Link from "next/link";

type PortfolioCardProps = {
  titulo: string;
  descricao: string;
  tecnologias: string;
  imagem: string;
  slug: string;
};

export default function PortfolioCard({
  titulo,
  descricao,
  tecnologias,
  imagem,
  slug,
}: PortfolioCardProps) {
  return (
    <div className="group overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-cyan-500/20">
      
      <Image
        src={imagem}
        alt={titulo}
        width={600}
        height={400}
        className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105"
      />

      <div className="p-6">
        <h3 className="text-2xl font-bold text-white">
          {titulo}
        </h3>

        <p className="mt-3 text-slate-300">
          {descricao}
        </p>

       <div className="mt-4 flex flex-wrap gap-2">
          {tecnologias.split(" • ").map((tecnologia) => (
         <span
          key={tecnologia}
          className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-400"
          >
          {tecnologia}
          </span>
          ))}
       </div>

   <Link href={`/portfolio/${slug}`}  className=" mt-6
           block
           w-full
           rounded-xl
           bg-cyan-500
           py-3
           text-center
          font-semibold
          text-slate-950
          transition-all
          duration-300
           hover:bg-cyan-400
          hover:shadow-lg
           hover:shadow-cyan-500/40
            "
               >
               Ver Projeto →
</Link>
      </div>
    </div>
  );
}