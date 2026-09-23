import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import AlterarEstadoProfissionalButton from "@/components/booking/AlterarEstadoProfissionalButton";

export default async function ProfissionaisPage() {
    const supabase = await createSupabaseServerClient();

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

    let temProfissionais = membro.role === "admin";

    if (!temProfissionais) {
        const { data: permissaoProfissionais } =
            await supabase
                .from("company_member_permissions")
                .select("permission")
                .eq("member_id", membro.id)
                .eq("permission", "profissionais")
                .maybeSingle();

        temProfissionais = !!permissaoProfissionais;
    }

    if (!temProfissionais) {
        redirect("/nexora-ai/booking");
    }

    const { data: empresa } = await supabase
        .from("companies")
        .select("id, name")
        .eq("id", membro.company_id)
        .single();

    const { data: profissionais, error } = await supabase
        .from("profissionais")
        .select("id, nome, ativo")
        .eq("empresa_id", membro.company_id)
        .order("nome", { ascending: true });

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
                            Profissionais
                        </h1>

                        <p className="mt-2 text-slate-400">
                            Gerencie os profissionais que realizam os seus serviços.
                        </p>

                        {empresa?.name && (
                            <p className="mt-3 text-sm text-slate-500">
                                Empresa: {empresa.name}
                            </p>
                        )}
                    </div>

                    <Link
                        href="/nexora-ai/booking/profissionais/novo"
                        className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                    >
                        + Novo profissional
                    </Link>
                </div>

                <div className="mt-8">
                    {error ? (
                        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-sm text-red-400">
                            Não foi possível carregar os profissionais.
                        </div>
                    ) : profissionais && profissionais.length > 0 ? (
                        <div className="space-y-4">
                            {profissionais.map((profissional) => (
                                <div
                                    key={profissional.id}
                                    className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/10 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h2 className="text-lg font-bold text-white">
                                                {profissional.nome}
                                            </h2>

                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    profissional.ativo
                                                        ? "bg-emerald-400/10 text-emerald-400"
                                                        : "bg-slate-800 text-slate-500"
                                                }`}
                                            >
                                                {profissional.ativo
                                                    ? "Ativo"
                                                    : "Inativo"}
                                            </span>
                                        </div>

                                        <p className="mt-2 text-sm text-slate-500">
                                            Profissional do Nexora Booking
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Link
                                            href={`/nexora-ai/booking/profissionais/${profissional.id}/editar`}
                                            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-400"
                                        >
                                            ✎ Editar
                                        </Link>

                                        <AlterarEstadoProfissionalButton
                                            profissionalId={profissional.id}
                                            ativo={profissional.ativo}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center">
                            <h2 className="text-lg font-bold text-slate-200">
                                Ainda não existem profissionais
                            </h2>

                            <p className="mt-2 text-sm text-slate-500">
                                Adicione o primeiro profissional para começar a configurar a agenda.
                            </p>

                            <Link
                                href="/nexora-ai/booking/profissionais/novo"
                                className="mt-5 inline-flex items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                            >
                                + Adicionar profissional
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}