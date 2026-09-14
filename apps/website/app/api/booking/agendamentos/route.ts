import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type CriarAgendamentoBody = {
    cliente_id: string;
    servico_id: string;
    profissional_id: string;
    inicio: string;
    fim: string;
    notas?: string | null;
};

export async function POST(request: Request) {
    try {
        const supabase = await createSupabaseServerClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                {
                    error: "Não autenticado.",
                },
                {
                    status: 401,
                }
            );
        }

        const body =
            (await request.json()) as CriarAgendamentoBody;

        if (
            !body.cliente_id ||
            !body.servico_id ||
            !body.profissional_id ||
            !body.inicio ||
            !body.fim
        ) {
            return NextResponse.json(
                {
                    error: "Cliente, serviço, profissional, início e fim são obrigatórios.",
                },
                {
                    status: 400,
                }
            );
        }

        // Empresa associada ao utilizador
        const { data: membro, error: membroError } =
            await supabase
                .from("company_members")
                .select("company_id")
                .eq("user_id", user.id)
                .limit(1)
                .single();

        if (membroError || !membro) {
            return NextResponse.json(
                {
                    error: "Não foi encontrada uma empresa associada ao utilizador.",
                },
                {
                    status: 403,
                }
            );
        }

        const empresaId = membro.company_id;

        // Verifica se o Booking está ativo
        const { data: configuracao, error: configuracaoError } =
            await supabase
                .from("configuracoes_agendamento")
                .select("agendamento_ativo")
                .eq("empresa_id", empresaId)
                .maybeSingle();

        if (configuracaoError) {
            return NextResponse.json(
                {
                    error: "Não foi possível verificar a configuração do Booking.",
                },
                {
                    status: 500,
                }
            );
        }

        if (!configuracao?.agendamento_ativo) {
            return NextResponse.json(
                {
                    error: "O Booking está suspenso para esta empresa.",
                },
                {
                    status: 403,
                }
            );
        }

        // Confirma que cliente, serviço e profissional pertencem à empresa
        const { data: cliente } = await supabase
            .from("clientes")
            .select("id")
            .eq("id", body.cliente_id)
            .eq("empresa_id", empresaId)
            .maybeSingle();

        if (!cliente) {
            return NextResponse.json(
                {
                    error: "Cliente inválido.",
                },
                {
                    status: 400,
                }
            );
        }

        const { data: servico } = await supabase
            .from("servicos")
            .select("id")
            .eq("id", body.servico_id)
            .eq("empresa_id", empresaId)
            .eq("ativo", true)
            .maybeSingle();

        if (!servico) {
            return NextResponse.json(
                {
                    error: "Serviço inválido ou inativo.",
                },
                {
                    status: 400,
                }
            );
        }

        const { data: profissional } = await supabase
            .from("profissionais")
            .select("id")
            .eq("id", body.profissional_id)
            .eq("empresa_id", empresaId)
            .eq("ativo", true)
            .maybeSingle();

        if (!profissional) {
            return NextResponse.json(
                {
                    error: "Profissional inválido ou inativo.",
                },
                {
                    status: 400,
                }
            );
        }

        // A validação final de disponibilidade, duração,
        // antecedência, bloqueios e capacidade é feita
        // pela função PostgreSQL criar_agendamento().
        const { data, error } = await supabase.rpc(
            "criar_agendamento",
            {
                p_empresa_id: empresaId,
                p_cliente_id: body.cliente_id,
                p_servico_id: body.servico_id,
                p_profissional_id: body.profissional_id,
                p_inicio: body.inicio,
                p_fim: body.fim,
                p_notas: body.notas ?? null,
            }
        );

        if (error) {
            return NextResponse.json(
                {
                    error:
                        error.message ||
                        "Não foi possível criar a marcação.",
                },
                {
                    status: 400,
                }
            );
        }

        return NextResponse.json(
            {
                success: true,
                agendamento: data,
            },
            {
                status: 201,
            }
        );
    } catch (error) {
        console.error(
            "Erro ao criar agendamento:",
            error
        );

        return NextResponse.json(
            {
                error: "Ocorreu um erro interno ao criar a marcação.",
            },
            {
                status: 500,
            }
        );
    }
}