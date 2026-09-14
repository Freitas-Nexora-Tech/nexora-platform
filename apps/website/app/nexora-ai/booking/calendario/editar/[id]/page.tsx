import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import EditarMarcacaoForm from "@/components/booking/EditarMarcacaoForm";

type Props = {
    params: Promise<{ id: string }>;
};

export default async function EditarMarcacaoPage({ params }: Props) {
    const { id } = await params;

    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
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

    const empresaId = membro.company_id;

    const { data: configuracao } = await supabase
        .from("configuracoes_agendamento")
        .select("agendamento_ativo, fuso_horario")
        .eq("empresa_id", empresaId)
        .maybeSingle();

    if (!configuracao?.agendamento_ativo) {
        redirect("/nexora-ai/booking");
    }

    const { data: agendamento } = await supabase
        .from("agendamentos")
        .select(
            "id, cliente_id, servico_id, profissional_id, inicio, fim, estado, notas"
        )
        .eq("id", id)
        .eq("empresa_id", empresaId)
        .maybeSingle();

    if (!agendamento) {
        redirect("/nexora-ai/booking/calendario");
    }

    if (agendamento.estado === "cancelado") {
        redirect(
            "/nexora-ai/booking/calendario?erro=marcacao-cancelada"
        );
    }

    const [{ data: clientes }, { data: servicos }, { data: profissionais }] =
        await Promise.all([
            supabase
                .from("clientes")
                .select("id, nome, email, telefone")
                .eq("empresa_id", empresaId)
                .order("nome"),

            supabase
                .from("servicos")
                .select("id, nome, duracao_minutos, preco")
                .eq("empresa_id", empresaId)
                .eq("ativo", true)
                .order("nome"),

            supabase
                .from("profissionais")
                .select("id, nome")
                .eq("empresa_id", empresaId)
                .eq("ativo", true)
                .order("nome"),
        ]);

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
            <div className="mx-auto max-w-3xl">
                <div className="mb-6">
                    <p className="text-sm font-semibold text-cyan-400">
                        Nexora Booking
                    </p>

                    <h1 className="mt-1 text-3xl font-extrabold text-white">
                        Editar marcação
                    </h1>

                    <p className="mt-2 text-sm text-slate-400">
                        Altere os dados da marcação e confirme as alterações.
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                        Fuso horário: {configuracao.fuso_horario}
                    </p>
                </div>

                <EditarMarcacaoForm
                    agendamento={agendamento}
                    clientes={clientes ?? []}
                    servicos={servicos ?? []}
                    profissionais={profissionais ?? []}
                />
            </div>
        </main>
    );
}
