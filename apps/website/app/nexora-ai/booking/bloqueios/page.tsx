import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import EliminarBloqueioButton from "@/components/booking/EliminarBloqueioButton";

type Bloqueio = {
    id: string;
    profissional_id: string;
    inicio: string;
    fim: string;
    motivo: string | null;
    profissional: {
        nome: string;
    }[] | null;
};

export default async function BloqueiosPage() {
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

    const {
        data: bloqueios,
        error,
    } = await supabase
        .from("bloqueios")
        .select(
            `
            id,
            profissional_id,
            inicio,
            fim,
            motivo,
            profissional:profissionais (
                nome
            )
            `
        )
        .eq("empresa_id", membro.company_id)
        .order("inicio", {
            ascending: true,
        });

    const listaBloqueios =
        (bloqueios ?? []) as Bloqueio[];

    function formatarData(data: string) {
        return new Intl.DateTimeFormat(
            "pt-PT",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        ).format(new Date(data));
    }

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
            <div className="mx-auto max-w-5xl">
                <Link
                    href="/nexora-ai/booking"
                    className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
                >
                    ← Voltar ao Booking
                </Link>

                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                            Nexora Booking
                        </p>

                        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                            Bloqueios
                        </h1>

                        <p className="mt-2 text-slate-400">
                            Consulte e gerencie os períodos bloqueados na agenda.
                        </p>

                        {empresa?.name && (
                            <p className="mt-3 text-sm text-slate-500">
                                Empresa: {empresa.name}
                            </p>
                        )}
                    </div>

                    <Link
                        href="/nexora-ai/booking/bloqueios/novo"
                        className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                    >
                        + Novo bloqueio
                    </Link>
                </div>

                <div className="mt-8">
                    {error ? (
                        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-sm text-red-400">
                            Não foi possível carregar os bloqueios.
                        </div>
                    ) : listaBloqueios.length > 0 ? (
                        <div className="space-y-4">
                            {listaBloqueios.map(
                                (bloqueio) => (
                                    <div
                                        key={bloqueio.id}
                                        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/10"
                                    >
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h2 className="text-lg font-bold text-white">
                                                    {bloqueio.profissional?.[0]?.nome ??
                                                        "Profissional"}
                                                </h2>

                                                <div className="mt-2 space-y-1 text-sm text-slate-400">
                                                    <p>
                                                        <span className="text-slate-600">
                                                            Início:
                                                        </span>{" "}
                                                        {formatarData(
                                                            bloqueio.inicio
                                                        )}
                                                    </p>

                                                    <p>
                                                        <span className="text-slate-600">
                                                            Fim:
                                                        </span>{" "}
                                                        {formatarData(
                                                            bloqueio.fim
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2">
                                                <Link
                                                    href={`/nexora-ai/booking/bloqueios/${bloqueio.id}/editar`}
                                                    className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-400"
                                                >
                                                    ✎ Editar
                                                </Link>

                                                <EliminarBloqueioButton
                                                    bloqueioId={bloqueio.id}
                                                />
                                            </div>
                                        </div>

                                        {bloqueio.motivo && (
                                            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                                                <p className="text-xs uppercase tracking-wider text-slate-600">
                                                    Motivo
                                                </p>

                                                <p className="mt-1 text-sm text-slate-400">
                                                    {bloqueio.motivo}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center">
                            <div className="text-5xl">
                                🔒
                            </div>

                            <h2 className="mt-5 text-lg font-bold text-slate-200">
                                Ainda não existem bloqueios
                            </h2>

                            <p className="mt-2 text-sm text-slate-500">
                                Adicione um bloqueio para impedir marcações num determinado período.
                            </p>

                            <Link
                                href="/nexora-ai/booking/bloqueios/novo"
                                className="mt-5 inline-flex items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                            >
                                + Adicionar bloqueio
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}