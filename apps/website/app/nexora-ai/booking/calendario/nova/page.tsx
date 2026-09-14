import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import NovaMarcacaoForm from "@/components/booking/NovaMarcacaoForm";

type Cliente = {
    id: string;
    nome: string;
    email: string | null;
    telefone: string | null;
};

type Servico = {
    id: string;
    nome: string;
    duracao_minutos: number;
    preco: number;
};

type Profissional = {
    id: string;
    nome: string;
};

export default async function NovaMarcacaoPage() {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/nexora-ai/login");
    }

    // Empresa associada ao utilizador
    const { data: membro, error: membroError } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

    if (membroError || !membro) {
        redirect("/nexora-ai/login");
    }

    // Dados da empresa
    const { data: empresa, error: empresaError } = await supabase
        .from("companies")
        .select("id, name")
        .eq("id", membro.company_id)
        .single();

    if (empresaError || !empresa) {
        redirect("/nexora-ai/login");
    }

    // Configuração do Booking
    const { data: configuracao } = await supabase
        .from("configuracoes_agendamento")
        .select("agendamento_ativo, fuso_horario")
        .eq("empresa_id", empresa.id)
        .maybeSingle();

    // Clientes
    const { data: clientes } = await supabase
        .from("clientes")
        .select("id, nome, email, telefone")
        .eq("empresa_id", empresa.id)
        .order("nome", {
            ascending: true,
        });

    // Serviços
    const { data: servicos } = await supabase
        .from("servicos")
        .select("id, nome, duracao_minutos, preco")
        .eq("empresa_id", empresa.id)
        .eq("ativo", true)
        .order("nome", {
            ascending: true,
        });

    // Profissionais
    const { data: profissionais } = await supabase
        .from("profissionais")
        .select("id, nome")
        .eq("empresa_id", empresa.id)
        .eq("ativo", true)
        .order("nome", {
            ascending: true,
        });

    const listaClientes = (clientes ?? []) as Cliente[];
    const listaServicos = (servicos ?? []) as Servico[];
    const listaProfissionais = (profissionais ?? []) as Profissional[];

    return (
        <main className="min-h-screen bg-slate-950 text-white">
            <section className="relative min-h-screen overflow-hidden px-6 py-12">
                <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

                <div className="relative z-10 mx-auto max-w-5xl">

                    {/* Cabeçalho */}

                    <div className="mb-10">
                        <Link
                            href="/nexora-ai/booking/calendario"
                            className="mb-6 inline-block text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
                        >
                            ← Voltar ao Calendário
                        </Link>

                        <span className="block text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
                            Nexora Booking
                        </span>

                        <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">
                            Nova marcação
                        </h1>

                        <p className="mt-3 max-w-2xl text-slate-400">
                            Crie uma nova marcação para a sua empresa.
                        </p>
                    </div>

                    {/* Empresa */}

                    <div className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-xl">
                        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                                    Empresa
                                </p>

                                <h2 className="mt-2 text-3xl font-bold">
                                    {empresa.name}
                                </h2>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-5 py-4">
                                <p className="text-xs uppercase tracking-wider text-slate-500">
                                    Fuso horário
                                </p>

                                <p className="mt-1 font-semibold text-slate-200">
                                    {configuracao?.fuso_horario ||
                                        "Europe/Lisbon"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Formulário */}

                    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-xl">

                        <div className="mb-8">
                            <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                                Dados da marcação
                            </p>

                            <h2 className="mt-2 text-2xl font-bold">
                                Preencha os dados
                            </h2>

                            <p className="mt-2 text-sm text-slate-500">
                                Escolha o cliente, serviço, profissional e data da marcação.
                            </p>
                        </div>

                        {!configuracao?.agendamento_ativo ? (
                            <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6">
                                <p className="font-semibold text-red-400">
                                    O Booking está suspenso.
                                </p>

                                <p className="mt-2 text-sm text-slate-500">
                                    Não é possível criar novas marcações enquanto os agendamentos estiverem suspensos.
                                </p>
                            </div>
                        ) : (
                            <NovaMarcacaoForm
                                clientes={listaClientes}
                                servicos={listaServicos}
                                profissionais={listaProfissionais}
                            />
                        )}

                    </div>

                </div>
            </section>
        </main>
    );
}