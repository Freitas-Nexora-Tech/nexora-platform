import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type Props = {
    params: Promise<{
        id: string;
    }>;
};

type EditarClienteBody = {
    nome: string;
    email?: string | null;
    telefone?: string | null;
    notas?: string | null;
};

async function obterAcessoClientes() {
    const supabase =
        await createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return {
            supabase,
            user: null,
            membro: null,
            autorizado: false,
        };
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
        return {
            supabase,
            user,
            membro: null,
            autorizado: false,
        };
    }

    if (
        !membro.is_active ||
        membro.must_change_password
    ) {
        return {
            supabase,
            user,
            membro,
            autorizado: false,
        };
    }

    if (membro.role === "admin") {
        return {
            supabase,
            user,
            membro,
            autorizado: true,
        };
    }

    const {
        data: permissao,
        error: permissaoError,
    } = await supabase
        .from("company_member_permissions")
        .select("id")
        .eq("member_id", membro.id)
        .eq("permission", "clientes")
        .limit(1)
        .maybeSingle();

    if (permissaoError || !permissao) {
        return {
            supabase,
            user,
            membro,
            autorizado: false,
        };
    }

    return {
        supabase,
        user,
        membro,
        autorizado: true,
    };
}

export async function PATCH(
    request: Request,
    { params }: Props
) {
    try {
        const { id: clienteId } =
            await params;

        const {
            supabase,
            user,
            membro,
            autorizado,
        } = await obterAcessoClientes();

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

        if (!membro?.company_id) {
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

        if (!autorizado) {
            return NextResponse.json(
                {
                    error:
                        "Não tem permissão para gerir clientes.",
                },
                {
                    status: 403,
                }
            );
        }

        const empresaId =
            membro.company_id;

        const body =
            (await request.json()) as EditarClienteBody;

        const nome =
            body.nome?.trim();

        if (!nome) {
            return NextResponse.json(
                {
                    error:
                        "O nome do cliente é obrigatório.",
                },
                {
                    status: 400,
                }
            );
        }

        const { data: cliente } =
            await supabase
                .from("clientes")
                .select("id")
                .eq("id", clienteId)
                .eq("empresa_id", empresaId)
                .single();

        if (!cliente) {
            return NextResponse.json(
                {
                    error:
                        "Cliente não encontrado.",
                },
                {
                    status: 404,
                }
            );
        }

        const {
            data: clienteAtualizado,
            error: clienteError,
        } = await supabase
            .from("clientes")
            .update({
                nome,
                email:
                    body.email?.trim() ||
                    null,
                telefone:
                    body.telefone?.trim() ||
                    null,
                notas:
                    body.notas?.trim() ||
                    null,
            })
            .eq("id", clienteId)
            .eq("empresa_id", empresaId)
            .select(
                "id, nome, email, telefone, notas"
            )
            .single();

        if (clienteError) {
            console.error(
                "Erro ao atualizar cliente:",
                clienteError
            );

            return NextResponse.json(
                {
                    error:
                        "Não foi possível atualizar o cliente.",
                },
                {
                    status: 500,
                }
            );
        }

        return NextResponse.json({
            success: true,
            cliente:
                clienteAtualizado,
        });
    } catch (error) {
        console.error(
            "Erro interno ao atualizar cliente:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Ocorreu um erro interno ao atualizar o cliente.",
            },
            {
                status: 500,
            }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: Props
) {
    try {
        const { id: clienteId } =
            await params;

        const {
            supabase,
            user,
            membro,
            autorizado,
        } = await obterAcessoClientes();

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

        if (!membro?.company_id) {
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
                    status: 403
                }
            );
        }

        if (!autorizado) {
            return NextResponse.json(
                {
                    error:
                        "Não tem permissão para gerir clientes.",
                },
                {
                    status: 403,
                }
            );
        }

        const empresaId =
            membro.company_id;

        const { data: cliente } =
            await supabase
                .from("clientes")
                .select("id")
                .eq("id", clienteId)
                .eq("empresa_id", empresaId)
                .single();

        if (!cliente) {
            return NextResponse.json(
                {
                    error:
                        "Cliente não encontrado.",
                },
                {
                    status: 404,
                }
            );
        }

        const {
            count,
            error: verificacaoError,
        } = await supabase
            .from("agendamentos")
            .select("id", {
                count: "exact",
                head: true,
            })
            .eq("cliente_id", clienteId)
            .eq("empresa_id", empresaId);

        if (verificacaoError) {
            console.error(
                "Erro ao verificar marcações do cliente:",
                verificacaoError
            );

            return NextResponse.json(
                {
                    error:
                        "Não foi possível verificar as marcações do cliente.",
                },
                {
                    status: 500,
                }
            );
        }

        if ((count ?? 0) > 0) {
            return NextResponse.json(
                {
                    error:
                        "Este cliente não pode ser eliminado porque possui marcações associadas.",
                },
                {
                    status: 409,
                }
            );
        }

        const {
            error: eliminarError,
        } = await supabase
            .from("clientes")
            .delete()
            .eq("id", clienteId)
            .eq("empresa_id", empresaId);

        if (eliminarError) {
            console.error(
                "Erro ao eliminar cliente:",
                eliminarError
            );

            return NextResponse.json(
                {
                    error:
                        "Não foi possível eliminar o cliente.",
                },
                {
                    status: 500,
                }
            );
        }

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error(
            "Erro interno ao eliminar cliente:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Ocorreu um erro interno ao eliminar o cliente.",
            },
            {
                status: 500,
            }
        );
    }
}