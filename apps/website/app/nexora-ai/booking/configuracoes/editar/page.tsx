import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import EditarConfiguracoesBookingForm from "@/components/booking/EditarConfiguracoesBookingForm";

export default async function EditarConfiguracoesBookingPage() {
    const supabase =
        await createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/booking/login");
    }

    const { data: membro } = await supabase
        .from("company_members")
        .select(
            "id, company_id, role, is_active, must_change_password"
        )
        .eq("user_id", user.id)
        .limit(1)
        .single();

    if (
        !membro?.company_id ||
        !membro.is_active
    ) {
        redirect("/booking/login");
    }

    if (membro.must_change_password) {
        redirect("/booking/alterar-password");
    }

    let temConfiguracoes = membro.role === "admin";

    if (!temConfiguracoes) {
        const { data: permissaoConfiguracoes } =
            await supabase
                .from("company_member_permissions")
                .select("permission")
                .eq("member_id", membro.id)
                .eq("permission", "configuracoes")
                .maybeSingle();

        temConfiguracoes = !!permissaoConfiguracoes;
    }

    if (!temConfiguracoes) {
        redirect("/nexora-ai/booking");
    }

    const { data: empresa } = await supabase
        .from("companies")
        .select("id, name")
        .eq("id", membro.company_id)
        .single();

    const { data: configuracao } = await supabase
        .from("configuracoes_agendamento")
        .select(
            `
            id,
            agendamento_ativo,
            fuso_horario,
            intervalo_marcacao_minutos,
            antecedencia_minima_minutos,
            antecedencia_maxima_dias,
            cancelamento_ativo,
            prazo_cancelamento_minutos,
            capacidade_por_horario
            `
        )
        .eq("empresa_id", membro.company_id)
        .maybeSingle();

    if (!configuracao) {
        redirect("/nexora-ai/booking/configuracoes");
    }

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
            <div className="mx-auto max-w-5xl">
                <Link
                    href="/nexora-ai/booking/configuracoes"
                    className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
                >
                    ← Voltar às configurações
                </Link>

                <div className="mt-6">
                    <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                        Nexora Booking
                    </p>

                    <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                        Editar configurações
                    </h1>

                    <p className="mt-2 text-slate-400">
                        Ajuste as regras gerais de funcionamento da sua agenda.
                    </p>

                    {empresa?.name && (
                        <p className="mt-3 text-sm text-slate-500">
                            Empresa: {empresa.name}
                        </p>
                    )}
                </div>

                <div className="mt-8">
                    <EditarConfiguracoesBookingForm
                        configuracao={configuracao}
                    />
                </div>
            </div>
        </main>
    );
}