import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type EditarAgendamentoBody = {
    cliente_id: string;
    servico_id: string;
    profissional_id: string;
    inicio: string;
    fim: string;
    notas?: string | null;
};

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export async function PATCH(
    request: Request,
    context: RouteContext
) {
    try {
        const supabase =
            await createSupabaseServerClient();

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

        const { id } = await context.params;

        const body =
            (await request.json()) as EditarAgendamentoBody;

        if (
            !body.cliente_id ||
            !body.servico_id ||
            !body.profissional_id ||
            !body.inicio ||
            !body.fim
        ) {
            return NextResponse.json(
                {
                    error:
                        "Cliente, serviço, profissional, início e fim são obrigatórios.",
                },
                {
                    status: 400,
                }
            );
        }

        const {
            data: membro,
            error: membroError,
        } = await supabase
            .from("company_members")
            .select("id, company_id, role")
            .eq("user_id", user.id)
            .limit(1)
            .single();

        if (membroError || !membro) {
            return NextResponse.json(
                {
                    error:
                        "Não foi encontrada uma empresa associada ao utilizador.",
                },
                {
                    status: 403,
                }
            );
        }

        const empresaId = membro.company_id;

        /*
         * Verificar permissão para editar marcações.
         *
         * Administradores têm acesso total.
         * Funcionários precisam da permissão "marcacoes".
         */
        if (membro.role !== "admin") {
            const {
                data: permissao,
                error: permissaoError,
            } = await supabase
                .from("company_member_permissions")
                .select("id")
                .eq("member_id", membro.id)
                .eq("permission", "marcacoes")
                .limit(1)
                .maybeSingle();

            if (permissaoError) {
                console.error(
                    "Erro ao verificar permissão de marcações:",
                    permissaoError
                );

                return NextResponse.json(
                    {
                        error:
                            "Não foi possível verificar as permissões do utilizador.",
                    },
                    {
                        status: 500,
                    }
                );
            }

            if (!permissao) {
                return NextResponse.json(
                    {
                        error:
                            "Não tem permissão para gerir marcações.",
                    },
                    {
                        status: 403,
                    }
                );
            }
        }

        const {
            data: agendamento,
            error: agendamentoError,
        } = await supabase
            .from("agendamentos")
            .select("id, estado")
            .eq("id", id)
            .eq("empresa_id", empresaId)
            .maybeSingle();

        if (agendamentoError) {
            return NextResponse.json(
                {
                    error:
                        "Não foi possível consultar a marcação.",
                },
                {
                    status: 500,
                }
            );
        }

        if (!agendamento) {
            return NextResponse.json(
                {
                    error: "Marcação não encontrada.",
                },
                {
                    status: 404,
                }
            );
        }

        if (agendamento.estado === "cancelado") {
            return NextResponse.json(
                {
                    error:
                        "Não é possível editar uma marcação cancelada.",
                },
                {
                    status: 400,
                }
            );
        }

        const {
            data,
            error,
        } = await supabase.rpc(
            "editar_agendamento",
            {
                p_agendamento_id: id,
                p_empresa_id: empresaId,
                p_cliente_id:
                    body.cliente_id,
                p_servico_id:
                    body.servico_id,
                p_profissional_id:
                    body.profissional_id,
                p_inicio: body.inicio,
                p_fim: body.fim,
                p_notas:
                    body.notas ?? null,
            }
        );

        if (error) {
            return NextResponse.json(
                {
                    error:
                        error.message ||
                        "Não foi possível editar a marcação.",
                },
                {
                    status: 400,
                }
            );
        }

        return NextResponse.json({
            success: true,
            agendamento: data,
        });
    } catch (error) {
        console.error(
            "Erro ao editar agendamento:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Ocorreu um erro interno ao editar a marcação.",
            },
            {
                status: 500,
            }
        );
    }
}