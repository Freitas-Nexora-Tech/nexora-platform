import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import EditarProfissionalForm from "@/components/booking/EditarProfissionalForm";
import DisponibilidadeProfissionalForm from "@/components/booking/DisponibilidadeProfissionalForm";

type Props = {
    params: Promise<{
        id: string;
    }>;
};

export default async function EditarProfissionalPage({
    params,
}: Props) {
    const { id } = await params;

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

    const { data: profissional, error } = await supabase
        .from("profissionais")
        .select("id, nome, ativo")
        .eq("id", id)
        .eq("empresa_id", membro.company_id)
        .single();

    if (error || !profissional) {
        notFound();
    }

    const { data: servicos } = await supabase
        .from("servicos")
        .select("id, nome, ativo")
        .eq("empresa_id", membro.company_id)
        .order("nome", { ascending: true });

    const { data: associacoes } = await supabase
        .from("profissionais_servicos")
        .select("servico_id")
        .eq("empresa_id", membro.company_id)
        .eq("profissional_id", id);

    const servicosAssociados =
        associacoes?.map(
            (associacao) => associacao.servico_id
        ) ?? [];
    const { data: disponibilidade } = await supabase
        .from("disponibilidade")
        .select(
            "dia_semana, hora_inicio, hora_fim, ativo"
        )
        .eq("empresa_id", membro.company_id)
        .eq("profissional_id", id)
        .order("dia_semana", { ascending: true })
        .order("hora_inicio", { ascending: true });

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
            <div className="mx-auto max-w-3xl">
                <Link
                    href="/nexora-ai/booking/profissionais"
                    className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
                >
                    ← Voltar aos profissionais
                </Link>

                <div className="mt-6">
                    <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                        Nexora Booking
                    </p>

                    <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                        Editar profissional
                    </h1>

                    <p className="mt-2 text-slate-400">
                        Atualize as informações deste profissional.
                    </p>

                    {empresa?.name && (
                        <p className="mt-3 text-sm text-slate-500">
                            Empresa: {empresa.name}
                        </p>
                    )}
                </div>

                <div className="mt-8">
                    <EditarProfissionalForm
                        profissional={profissional}
                        servicos={servicos ?? []}
                        servicosAssociados={servicosAssociados}
                    />
                </div>
                <div className="mt-6">
                    <DisponibilidadeProfissionalForm
                        profissionalId={profissional.id}
                        disponibilidade={disponibilidade ?? []}
                    />
                </div>
            </div>
        </main>
    );
}