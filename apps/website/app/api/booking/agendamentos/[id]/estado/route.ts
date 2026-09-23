import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type EstadoBody = {
    estado?: string;
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

        const { id } =
            await context.params;

        const body =
            (await request.json()) as EstadoBody;

        if (body?.estado !== "confirmado") {
            return NextResponse.json(
                {
                    error:
                        'O estado enviado deve ser "confirmado".',
                },
                {
                    status: 400,
                }
            );
        }

        // ---------------------------------------------------------
        // Membro, empresa e permissões
        // ---------------------------------------------------------

        const {
            data: membro,
            error: membroError,
        } = await supabase
            .from("company_members")
            .select(
                "id, company_id, role, is_active, must_change_password"
            )
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

        if (!membro.is_active) {
            return NextResponse.json(
                {
                    error:
                        "A sua conta está desativada.",
                },
                {
                    status: 403,
                }
            );
        }

        if (membro.must_change_password) {
            return NextResponse.json(
                {
                    error:
                        "É necessário alterar a password antes de continuar.",
                },
                {
                    status: 403,
                }
            );
        }

        const empresaId =
            membro.company_id;

        // Administradores têm acesso total.
        // Funcionários precisam da permissão "marcacoes".
        if (membro.role !== "admin") {
            const {
                data: permissao,
                error: permissaoError,
            } = await supabase
                .from("company_member_permissions")
                .select("id")
                .eq(
                    "member_id",
                    membro.id
                )
                .eq(
                    "permission",
                    "marcacoes"
                )
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

        // ---------------------------------------------------------
        // Procurar marcação da própria empresa
        // ---------------------------------------------------------

        const {
            data: agendamento,
            error: agendamentoError,
        } = await supabase
            .from("agendamentos")
            .select("*")
            .eq(
                "id",
                id
            )
            .eq(
                "empresa_id",
                empresaId
            )
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
                    error:
                        "Marcação não encontrada.",
                },
                {
                    status: 404,
                }
            );
        }

        // ---------------------------------------------------------
        // Só marcações pendentes podem ser confirmadas
        // ---------------------------------------------------------

        if (
            agendamento.estado !==
            "pendente"
        ) {
            return NextResponse.json(
                {
                    error:
                        "A marcação só pode ser confirmada quando está pendente.",
                },
                {
                    status: 400,
                }
            );
        }

        // ---------------------------------------------------------
        // Confirmar marcação
        // ---------------------------------------------------------

        const {
            data: agendamentoAtualizado,
            error: atualizacaoError,
        } = await supabase
            .from("agendamentos")
            .update({
                estado: "confirmado",
            })
            .eq(
                "id",
                id
            )
            .eq(
                "empresa_id",
                empresaId
            )
            .eq(
                "estado",
                "pendente"
            )
            .select("*")
            .single();

        if (
            atualizacaoError ||
            !agendamentoAtualizado
        ) {
            return NextResponse.json(
                {
                    error:
                        "Não foi possível atualizar o estado da marcação.",
                },
                {
                    status: 400,
                }
            );
        }

        return NextResponse.json({
            success: true,
            agendamento:
                agendamentoAtualizado,
        });
    } catch (error) {
        console.error(
            "Erro ao atualizar o estado da marcação:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Ocorreu um erro interno ao atualizar a marcação.",
            },
            {
                status: 500,
            }
        );
    }
}