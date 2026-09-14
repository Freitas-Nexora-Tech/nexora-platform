import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import EditarServicoForm from "../../../../../../components/booking/EditarServicoForm";

type Props = {
    params: Promise<{
        id: string;
    }>;
};

export default async function EditarServicoPage({
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

    const { data: servico, error } = await supabase
        .from("servicos")
        .select(
            "id, nome, descricao, duracao_minutos, preco, ativo"
        )
        .eq("id", id)
        .eq("empresa_id", membro.company_id)
        .single();

    if (error || !servico) {
        notFound();
    }

    const { data: profissionais } = await supabase
        .from("profissionais")
        .select("id, nome, ativo")
        .eq("empresa_id", membro.company_id)
        .eq("ativo", true)
        .order("nome", { ascending: true });

    const { data: associacoes } = await supabase
        .from("profissionais_servicos")
        .select("profissional_id")
        .eq("empresa_id", membro.company_id)
        .eq("servico_id", id);

    const profissionaisAssociados =
        associacoes?.map(
            (associacao) => associacao.profissional_id
        ) ?? [];

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
            <div className="mx-auto max-w-3xl">
                <Link
                    href="/nexora-ai/booking/servicos"
                    className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
                >
                    ← Voltar aos serviços
                </Link>

                <div className="mt-6">
                    <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                        Nexora Booking
                    </p>

                    <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                        Editar serviço
                    </h1>

                    <p className="mt-2 text-slate-400">
                        Atualize as informações deste serviço.
                    </p>

                    {empresa?.name && (
                        <p className="mt-3 text-sm text-slate-500">
                            Empresa: {empresa.name}
                        </p>
                    )}
                </div>

                <div className="mt-8">
                    <EditarServicoForm
                        servico={servico}
                        profissionais={profissionais ?? []}
                        profissionaisAssociados={
                            profissionaisAssociados
                        }
                    />
                </div>
            </div>
        </main>
    );
}