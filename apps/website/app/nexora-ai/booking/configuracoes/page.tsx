import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function ConfiguracoesBookingPage() {
    const supabase =
        await createSupabaseServerClient();

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

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
            <div className="mx-auto max-w-5xl">
                <Link
                    href="/nexora-ai/booking"
                    className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
                >
                    ← Voltar ao Booking
                </Link>

                <div className="mt-6">
                    <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                        Nexora Booking
                    </p>

                    <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                        Configurações
                    </h1>

                    <p className="mt-2 text-slate-400">
                        Configure o funcionamento geral da agenda da sua empresa.
                    </p>

                    {empresa?.name && (
                        <p className="mt-3 text-sm text-slate-500">
                            Empresa: {empresa.name}
                        </p>
                    )}
                </div>

                {!configuracao ? (
                    <div className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-6">
                        <h2 className="text-lg font-bold text-amber-300">
                            Configuração ainda não disponível
                        </h2>

                        <p className="mt-2 text-sm text-amber-200/70">
                            Ainda não existe uma configuração de Booking para esta empresa.
                        </p>
                    </div>
                ) : (
                    <div className="mt-8 space-y-6">
                        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                            <h2 className="text-lg font-bold">
                                Funcionamento da agenda
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Defina como os horários disponíveis são apresentados.
                            </p>

                            <div className="mt-6 grid gap-5 sm:grid-cols-2">
                                <div>
                                    <p className="text-sm text-slate-400">
                                        Agendamento
                                    </p>

                                    <p className="mt-1 font-semibold">
                                        {configuracao.agendamento_ativo
                                            ? "Ativo"
                                            : "Inativo"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-slate-400">
                                        Fuso horário
                                    </p>

                                    <p className="mt-1 font-semibold">
                                        {configuracao.fuso_horario}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-slate-400">
                                        Intervalo entre horários
                                    </p>

                                    <p className="mt-1 font-semibold">
                                        {configuracao.intervalo_marcacao_minutos} minutos
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-slate-400">
                                        Capacidade por horário
                                    </p>

                                    <p className="mt-1 font-semibold">
                                        {configuracao.capacidade_por_horario}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                            <h2 className="text-lg font-bold">
                                Antecedência dos agendamentos
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Controle com quanta antecedência os clientes podem marcar.
                            </p>

                            <div className="mt-6 grid gap-5 sm:grid-cols-2">
                                <div>
                                    <p className="text-sm text-slate-400">
                                        Antecedência mínima
                                    </p>

                                    <p className="mt-1 font-semibold">
                                        {configuracao.antecedencia_minima_minutos} minutos
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-slate-400">
                                        Antecedência máxima
                                    </p>

                                    <p className="mt-1 font-semibold">
                                        {configuracao.antecedencia_maxima_dias} dias
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                            <h2 className="text-lg font-bold">
                                Cancelamentos
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Defina as regras gerais para cancelamento de marcações.
                            </p>

                            <div className="mt-6 grid gap-5 sm:grid-cols-2">
                                <div>
                                    <p className="text-sm text-slate-400">
                                        Cancelamento
                                    </p>

                                    <p className="mt-1 font-semibold">
                                        {configuracao.cancelamento_ativo
                                            ? "Ativo"
                                            : "Inativo"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-slate-400">
                                        Prazo mínimo
                                    </p>

                                    <p className="mt-1 font-semibold">
                                        {configuracao.prazo_cancelamento_minutos} minutos
                                    </p>
                                </div>
                            </div>
                        </section>

                        <div className="flex justify-end">
                            <Link
                                href="/nexora-ai/booking/configuracoes/editar"
                                className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                            >
                                ✎ Editar configurações
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}