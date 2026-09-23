import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

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
                            "Não tem permissão para cancelar marcações.",
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
        } = await supabase
            .from("agendamentos")
            .select("*")
            .eq("id", id)
            .eq(
                "empresa_id",
                empresaId
            )
            .maybeSingle();

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
                        "Esta marcação já está cancelada.",
                },
                {
                    status: 400,
                }
            );
        }

        // ---------------------------------------------------------
        // Cancelar marcação
        // ---------------------------------------------------------

        const {
            data: agendamentoAtualizado,
            error: atualizacaoError,
        } = await supabase
            .from("agendamentos")
            .update({
                estado: "cancelado",
            })
            .eq(
                "id",
                id
            )
            .eq(
                "empresa_id",
                empresaId
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
                        "Não foi possível cancelar a marcação.",
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
            "Erro ao cancelar a marcação:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Ocorreu um erro interno ao cancelar a marcação.",
            },
            {
                status: 500,
            }
        );
    }
}