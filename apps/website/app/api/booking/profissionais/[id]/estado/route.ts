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
                .eq("member_id", membro.id)
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

        if (
            typeof body?.ativo !==
            "boolean"
        ) {
            return NextResponse.json(
                {
                    error:
                        "Estado inválido.",
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
            .eq("id", id)
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
            data: atualizado,
            error,
        } = await supabase
            .from("profissionais")
            .update({
                ativo: body.ativo,
            })
            .eq("id", id)
            .eq(
                "empresa_id",
                empresaId
            )
            .select(
                "id, nome, ativo"
            )
            .single();

        if (error) {
            console.error(
                "Erro ao alterar estado do profissional:",
                error
            );

            return NextResponse.json(
                {
                    error:
                        "Não foi possível alterar o estado do profissional.",
                },
                {
                    status: 500,
                }
            );
        }

        return NextResponse.json({
            success: true,
            profissional:
                atualizado,
        });
    } catch (error) {
        console.error(
            "Erro ao alterar estado do profissional:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Ocorreu um erro ao alterar o estado do profissional.",
            },
            {
                status: 500,
            }
        );
    }
}