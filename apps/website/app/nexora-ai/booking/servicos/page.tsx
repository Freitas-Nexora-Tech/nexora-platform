import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import AlterarEstadoServicoButton from "../../../../components/booking/AlterarEstadoServicoButton";

type Servico = {
    id: string;
    nome: string;
    descricao: string | null;
    duracao_minutos: number;
    preco: number;
    ativo: boolean;
};

export default async function ServicosPage() {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/nexora-ai/login");
    }

    const { data: membro } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

    if (!membro?.company_id) {
        redirect("/nexora-ai/booking");
    }

    const { data: empresa } = await supabase
        .from("companies")
        .select("id, name")
        .eq("id", membro.company_id)
        .single();

    const { data: servicos, error } = await supabase
        .from("servicos")
        .select(
            "id, nome, descricao, duracao_minutos, preco, ativo"
        )
        .eq("empresa_id", membro.company_id)
        .order("nome", { ascending: true });

    if (error) {
        console.error("Erro ao carregar serviços:", error);
    }

    const lista: Servico[] = servicos ?? [];

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <Link
                            href="/nexora-ai/booking"
                            className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
                        >
                            ← Voltar ao Booking
                        </Link>

                        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
                            Serviços
                        </h1>

                        <p className="mt-2 text-slate-400">
                            Gerencie os serviços disponibilizados pela sua empresa.
                        </p>

                        {empresa?.name && (
                            <p className="mt-2 text-sm text-slate-500">
                                {empresa.name}
                            </p>
                        )}
                    </div>

                    <Link
                        href="/nexora-ai/booking/servicos/novo"
                        className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                    >
                        + Novo serviço
                    </Link>
                </div>

                {lista.length === 0 ? (
                    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
                        <div className="mx-auto max-w-md">
                            <div className="text-4xl">🛠️</div>

                            <h2 className="mt-4 text-xl font-bold">
                                Ainda não existem serviços
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-slate-400">
                                Crie o primeiro serviço para começar a utilizar
                                o sistema de agendamento.
                            </p>

                            <Link
                                href="/nexora-ai/booking/servicos/novo"
                                className="mt-6 inline-flex items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-400 transition hover:bg-cyan-400/20"
                            >
                                + Criar primeiro serviço
                            </Link>
                        </div>
                    </section>
                ) : (
                    <section className="space-y-4">
                        {lista.map((servico) => (
                            <article
                                key={servico.id}
                                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-lg shadow-black/10 transition hover:border-cyan-400/30"
                            >
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h2 className="text-xl font-bold text-white">
                                                {servico.nome}
                                            </h2>

                                            <span
                                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${servico.ativo
                                                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                                                        : "border-slate-700 bg-slate-800 text-slate-400"
                                                    }`}
                                            >
                                                {servico.ativo
                                                    ? "Ativo"
                                                    : "Inativo"}
                                            </span>
                                        </div>

                                        {servico.descricao && (
                                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                                                {servico.descricao}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-center">
                                            <p className="text-xs text-slate-500">
                                                Duração
                                            </p>
                                            <p className="mt-1 font-semibold text-slate-200">
                                                {servico.duracao_minutos} min
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-center">
                                            <p className="text-xs text-slate-500">
                                                Preço
                                            </p>
                                            <p className="mt-1 font-semibold text-cyan-400">
                                                {Number(servico.preco).toFixed(2)} €
                                            </p>
                                        </div>

                                        <Link
                                            href={`/nexora-ai/booking/servicos/${servico.id}/editar`}
                                            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-400"
                                        >
                                            ✎ Editar
                                        </Link>
                                        <AlterarEstadoServicoButton
                                            servicoId={servico.id}
                                            ativo={servico.ativo}
                                        />
                                    </div>
                                </div>
                            </article>
                        ))}
                    </section>
                )}
            </div>
        </main>
    );
}