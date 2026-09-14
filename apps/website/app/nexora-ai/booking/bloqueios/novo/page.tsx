import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import NovoBloqueioForm from "@/components/booking/NovoBloqueioForm";

export default async function NovoBloqueioPage() {
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

    const { data: profissionais } = await supabase
        .from("profissionais")
        .select("id, nome, ativo")
        .eq("empresa_id", membro.company_id)
        .eq("ativo", true)
        .order("nome", {
            ascending: true,
        });

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
            <div className="mx-auto max-w-2xl">
                <a
                    href="/nexora-ai/booking/bloqueios"
                    className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
                >
                    ← Voltar aos bloqueios
                </a>

                <div className="mt-6">
                    <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                        Nexora Booking
                    </p>

                    <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                        Novo bloqueio
                    </h1>

                    <p className="mt-2 text-slate-400">
                        Bloqueie um período da agenda de um profissional.
                    </p>

                    {empresa?.name && (
                        <p className="mt-3 text-sm text-slate-500">
                            Empresa: {empresa.name}
                        </p>
                    )}
                </div>

                <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-black/10">
                    <NovoBloqueioForm
                        profissionais={profissionais ?? []}
                    />
                </div>
            </div>
        </main>
    );
}