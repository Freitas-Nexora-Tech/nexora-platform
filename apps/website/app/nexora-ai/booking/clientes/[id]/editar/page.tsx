import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import EditarClienteForm from "@/components/booking/EditarClienteForm";

type Props = {
    params: Promise<{
        id: string;
    }>;
};

export default async function EditarClientePage({
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

    let temClientes = membro.role === "admin";

    if (!temClientes) {
        const { data: permissaoClientes } =
            await supabase
                .from("company_member_permissions")
                .select("permission")
                .eq("member_id", membro.id)
                .eq("permission", "clientes")
                .maybeSingle();

        temClientes = !!permissaoClientes;
    }

    if (!temClientes) {
        redirect("/nexora-ai/booking");
    }

    const { data: empresa } = await supabase
        .from("companies")
        .select("id, name")
        .eq("id", membro.company_id)
        .single();

    const { data: cliente, error } = await supabase
        .from("clientes")
        .select(
            "id, nome, email, telefone, notas"
        )
        .eq("id", id)
        .eq("empresa_id", membro.company_id)
        .single();

    if (error || !cliente) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
            <div className="mx-auto max-w-3xl">
                <Link
                    href="/nexora-ai/booking/clientes"
                    className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
                >
                    ← Voltar aos clientes
                </Link>

                <div className="mt-6">
                    <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                        Nexora Booking
                    </p>

                    <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                        Editar cliente
                    </h1>

                    <p className="mt-2 text-slate-400">
                        Atualize as informações deste cliente.
                    </p>

                    {empresa?.name && (
                        <p className="mt-3 text-sm text-slate-500">
                            Empresa: {empresa.name}
                        </p>
                    )}
                </div>

                <div className="mt-8">
                    <EditarClienteForm
                        cliente={cliente}
                    />
                </div>
            </div>
        </main>
    );
}