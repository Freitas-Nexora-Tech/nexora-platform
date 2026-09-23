import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import EditarBloqueioForm from "@/components/booking/EditarBloqueioForm";

type Props = {
    params: Promise<{
        id: string;
    }>;
};

export default async function EditarBloqueioPage({
    params,
}: Props) {
    const { id } = await params;

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

    let temBloqueios = membro.role === "admin";

    if (!temBloqueios) {
        const { data: permissaoBloqueios } =
            await supabase
                .from("company_member_permissions")
                .select("permission")
                .eq("member_id", membro.id)
                .eq("permission", "bloqueios")
                .maybeSingle();

        temBloqueios = !!permissaoBloqueios;
    }

    if (!temBloqueios) {
        redirect("/nexora-ai/booking");
    }

    const { data: empresa } = await supabase
        .from("companies")
        .select("id, name")
        .eq("id", membro.company_id)
        .single();

    const { data: bloqueio } = await supabase
        .from("bloqueios")
        .select(
            `
            id,
            profissional_id,
            inicio,
            fim,
            motivo
            `
        )
        .eq("id", id)
        .eq("empresa_id", membro.company_id)
        .single();

    if (!bloqueio) {
        notFound();
    }

    const { data: profissionais } = await supabase
        .from("profissionais")
        .select("id, nome, ativo")
        .eq("empresa_id", membro.company_id)
        .order("nome", {
            ascending: true,
        });

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
            <div className="mx-auto max-w-2xl">
                <Link
                    href="/nexora-ai/booking/bloqueios"
                    className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
                >
                    ← Voltar aos bloqueios
                </Link>

                <div className="mt-6">
                    <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                        Nexora Booking
                    </p>

                    <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                        Editar bloqueio
                    </h1>

                    <p className="mt-2 text-slate-400">
                        Altere o profissional, período ou motivo do bloqueio.
                    </p>

                    {empresa?.name && (
                        <p className="mt-3 text-sm text-slate-500">
                            Empresa: {empresa.name}
                        </p>
                    )}
                </div>

                <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-black/10">
                    <EditarBloqueioForm
                        bloqueio={bloqueio}
                        profissionais={profissionais ?? []}
                    />
                </div>
            </div>
        </main>
    );
}