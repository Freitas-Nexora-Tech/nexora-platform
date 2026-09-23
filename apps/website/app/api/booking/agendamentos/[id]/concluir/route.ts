import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type Props = {
    params: Promise<{
        id: string;
    }>;
};

export async function PATCH(
    request: Request,
    { params }: Props
) {
    try {
        const { id } = await params;

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

        // Administradores têm acesso total.
        // Funcionários precisam da permissão "marcacoes".
        if (membro.role !== "admin") {
            const {
                data: permissaoMarcacoes,
                error: permissaoError,
            } = await supabase
                .from("company_member_permissions")
                .select("permission")
                .eq(
                    "member_id",
                    membro.id
                )
                .eq(
                    "permission",
                    "marcacoes"
                )
                .maybeSingle();

            if (permissaoError) {
                console.error(
                    "Erro ao verificar permissão de marcações:",
                    permissaoError
                );

                return NextResponse.json(
                    {
                        error:
                            "Não foi possível validar as permissões.",
                    },
                    {
                        status: 500,
                    }
                );
            }

            if (!permissaoMarcacoes) {
                return NextResponse.json(
                    {
                        error:
                            "Não tem permissão para concluir marcações.",
                    },
                    {
                        status: 403,
                    }
                );
            }
        }

        const empresaId =
            membro.company_id;

        // ---------------------------------------------------------
        // Procurar marcação da própria empresa
        // ---------------------------------------------------------

        const {
            data: agendamento,
            error: agendamentoError,
        } = await supabase
            .from("agendamentos")
            .select(
                "id, estado"
            )
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
                        "Não foi possível carregar a marcação.",
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
        // Validar estado atual
        // ---------------------------------------------------------

        if (
            agendamento.estado ===
            "cancelado"
        ) {
            return NextResponse.json(
                {
                    error:
                        "Uma marcação cancelada não pode ser concluída.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            agendamento.estado !==
            "confirmado"
        ) {
            return NextResponse.json(
                {
                    error:
                        "Apenas marcações confirmadas podem ser concluídas.",
                },
                {
                    status: 400,
                }
            );
        }

        // ---------------------------------------------------------
        // Concluir marcação
        // ---------------------------------------------------------

        const {
            data: atualizado,
            error: atualizarError,
        } = await supabase
            .from("agendamentos")
            .update({
                estado: "concluido",
                updated_at:
                    new Date().toISOString(),
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
                "confirmado"
            )
            .select()
            .single();

        if (atualizarError) {
            console.error(
                "Erro ao concluir marcação:",
                atualizarError
            );

            return NextResponse.json(
                {
                    error:
                        "Não foi possível concluir a marcação.",
                },
                {
                    status: 500,
                }
            );
        }

        return NextResponse.json({
            success: true,
            agendamento: atualizado,
        });
    } catch (error) {
        console.error(
            "Erro na API de conclusão:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Ocorreu um erro interno ao concluir a marcação.",
            },
            {
                status: 500,
            }
        );
    }
}