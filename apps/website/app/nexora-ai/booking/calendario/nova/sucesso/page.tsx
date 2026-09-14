import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type SucessoPageProps = {
    searchParams: Promise<{
        id?: string;
    }>;
};

export default async function SucessoPage({
    searchParams,
}: SucessoPageProps) {
    const params = await searchParams;
    const agendamentoId = params.id;

    if (!agendamentoId) {
        return (
            <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
                <div className="mx-auto max-w-2xl">
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center">
                        <h1 className="text-2xl font-bold">
                            Marcação criada com sucesso!
                        </h1>

                        <p className="mt-3 text-slate-400">
                            A marcação foi registada no Nexora Booking.
                        </p>

                        <Link
                            href="/nexora-ai/booking/calendario"
                            className="mt-8 inline-block rounded-xl bg-cyan-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
                        >
                            Ver calendário
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    const supabase =
        await createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    const {
        data: membro,
    } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

    if (!membro) {
        return null;
    }

    const { data: agendamento } =
        await supabase
            .from("agendamentos")
            .select(`
                id,
                inicio,
                fim,
                estado,
                notas,
                clientes (
                    nome,
                    email,
                    telefone
                ),
                servicos (
                    nome,
                    duracao_minutos,
                    preco
                ),
                profissionais (
                    nome
                )
            `)
            .eq("id", agendamentoId)
            .eq("empresa_id", membro.company_id)
            .maybeSingle();

    if (!agendamento) {
        return (
            <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
                <div className="mx-auto max-w-2xl">
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center">
                        <h1 className="text-2xl font-bold">
                            Marcação criada com sucesso!
                        </h1>

                        <p className="mt-3 text-slate-400">
                            A marcação foi registada, mas não foi possível carregar os seus detalhes.
                        </p>

                        <Link
                            href="/nexora-ai/booking/calendario"
                            className="mt-8 inline-block rounded-xl bg-cyan-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
                        >
                            Ver calendário
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    const cliente = Array.isArray(agendamento.clientes)
        ? agendamento.clientes[0]
        : agendamento.clientes;

    const servico = Array.isArray(agendamento.servicos)
        ? agendamento.servicos[0]
        : agendamento.servicos;

    const profissional = Array.isArray(
        agendamento.profissionais
    )
        ? agendamento.profissionais[0]
        : agendamento.profissionais;

    const inicio = new Date(
        agendamento.inicio
    );

    const fim = new Date(
        agendamento.fim
    );

    const dataFormatada =
        inicio.toLocaleDateString(
            "pt-PT",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }
        );

    const horaInicio =
        inicio.toLocaleTimeString(
            "pt-PT",
            {
                hour: "2-digit",
                minute: "2-digit",
            }
        );

    const horaFim =
        fim.toLocaleTimeString(
            "pt-PT",
            {
                hour: "2-digit",
                minute: "2-digit",
            }
        );

    return (
        <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
            <div className="mx-auto max-w-2xl">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">

                    <div className="text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-3xl text-emerald-400">
                            ✓
                        </div>

                        <h1 className="mt-6 text-3xl font-bold">
                            Marcação criada com sucesso!
                        </h1>

                        <p className="mt-3 text-slate-400">
                            A marcação foi registada no Nexora Booking.
                        </p>
                    </div>

                    <div className="mt-8 space-y-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-6">

                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Cliente
                            </p>

                            <p className="mt-1 text-lg font-semibold text-white">
                                {cliente?.nome ?? "—"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Serviço
                            </p>

                            <p className="mt-1 text-lg font-semibold text-white">
                                {servico?.nome ?? "—"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Profissional
                            </p>

                            <p className="mt-1 text-lg font-semibold text-white">
                                {profissional?.nome ?? "—"}
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">

                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Data
                                </p>

                                <p className="mt-1 text-lg font-semibold text-white">
                                    {dataFormatada}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Horário
                                </p>

                                <p className="mt-1 text-lg font-semibold text-white">
                                    {horaInicio} – {horaFim}
                                </p>
                            </div>

                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">

                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Duração
                                </p>

                                <p className="mt-1 text-lg font-semibold text-white">
                                    {servico?.duracao_minutos ?? "—"} min
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Estado
                                </p>

                                <p className="mt-1 text-lg font-semibold capitalize text-amber-400">
                                    {agendamento.estado}
                                </p>
                            </div>

                        </div>

                    </div>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">

                        <Link
                            href="/nexora-ai/booking/calendario"
                            className="rounded-xl bg-cyan-500 px-6 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
                        >
                            Ver calendário
                        </Link>

                        <Link
                            href="/nexora-ai/booking/calendario/nova"
                            className="rounded-xl border border-slate-700 bg-slate-950 px-6 py-3 text-center text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white"
                        >
                            Nova marcação
                        </Link>

                    </div>

                </div>
            </div>
        </main>
    );
}