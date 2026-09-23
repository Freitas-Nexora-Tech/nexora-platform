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
        const { id: profissionalId } =
            await params;

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
                        "Empresa não encontrada.",
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
                        "O acesso deste utilizador está desativado.",
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
                        "É necessário alterar a palavra-passe antes de continuar.",
                },
                {
                    status: 403,
                }
            );
        }

        /*
         * Verificar permissão para gerir profissionais.
         *
         * Administradores têm acesso total.
         * Funcionários precisam da permissão "profissionais".
         */
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
                    "profissionais"
                )
                .limit(1)
                .maybeSingle();

            if (permissaoError) {
                console.error(
                    "Erro ao verificar permissão de profissionais:",
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
                            "Não tem permissão para gerir profissionais.",
                    },
                    {
                        status: 403,
                    }
                );
            }
        }

        const empresaId =
            membro.company_id;

        const body =
            await request.json();

        const servicoId =
            body?.servico_id;

        const associado =
            body?.associado;

        if (
            typeof servicoId !==
                "string" ||
            !servicoId
        ) {
            return NextResponse.json(
                {
                    error:
                        "Serviço inválido.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            typeof associado !==
            "boolean"
        ) {
            return NextResponse.json(
                {
                    error:
                        "Estado da associação inválido.",
                },
                {
                    status: 400,
                }
            );
        }

        const {
            data: profissional,
        } = await supabase
            .from("profissionais")
            .select("id")
            .eq(
                "id",
                profissionalId
            )
            .eq(
                "empresa_id",
                empresaId
            )
            .single();

        if (!profissional) {
            return NextResponse.json(
                {
                    error:
                        "Profissional não encontrado.",
                },
                {
                    status: 404,
                }
            );
        }

        const {
            data: servico,
        } = await supabase
            .from("servicos")
            .select("id")
            .eq(
                "id",
                servicoId
            )
            .eq(
                "empresa_id",
                empresaId
            )
            .single();

        if (!servico) {
            return NextResponse.json(
                {
                    error:
                        "Serviço não encontrado.",
                },
                {
                    status: 404,
                }
            );
        }

        if (associado) {
            const {
                data: existente,
            } = await supabase
                .from(
                    "profissionais_servicos"
                )
                .select("id")
                .eq(
                    "empresa_id",
                    empresaId
                )
                .eq(
                    "profissional_id",
                    profissionalId
                )
                .eq(
                    "servico_id",
                    servicoId
                )
                .maybeSingle();

            if (!existente) {
                const {
                    error,
                } = await supabase
                    .from(
                        "profissionais_servicos"
                    )
                    .insert({
                        empresa_id:
                            empresaId,
                        profissional_id:
                            profissionalId,
                        servico_id:
                            servicoId,
                    });

                if (error) {
                    console.error(
                        "Erro ao associar serviço ao profissional:",
                        error
                    );

                    return NextResponse.json(
                        {
                            error:
                                "Não foi possível associar o serviço ao profissional.",
                        },
                        {
                            status: 500,
                        }
                    );
                }
            }
        } else {
            const {
                error,
            } = await supabase
                .from(
                    "profissionais_servicos"
                )
                .delete()
                .eq(
                    "empresa_id",
                    empresaId
                )
                .eq(
                    "profissional_id",
                    profissionalId
                )
                .eq(
                    "servico_id",
                    servicoId
                );

            if (error) {
                console.error(
                    "Erro ao remover associação:",
                    error
                );

                return NextResponse.json(
                    {
                        error:
                            "Não foi possível remover a associação.",
                    },
                    {
                        status: 500,
                    }
                );
            }
        }

        return NextResponse.json({
            success: true,
            associado,
        });
    } catch (error) {
        console.error(
            "Erro ao atualizar associação:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Ocorreu um erro ao atualizar a associação.",
            },
            {
                status: 500,
            }
        );
    }
}