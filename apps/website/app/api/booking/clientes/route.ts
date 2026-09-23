import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type CriarClienteBody = {
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

export async function GET() {
    try {
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

        const empresaId = membro.company_id;

        const {
            data: clientes,
            error: clientesError,
        } = await supabase
            .from("clientes")
            .select(
                "id, nome, email, telefone, notas, criado_em"
            )
            .eq("empresa_id", empresaId)
            .order("nome", {
                ascending: true,
            });

        if (clientesError) {
            console.error(
                "Erro ao carregar clientes:",
                clientesError
            );

            return NextResponse.json(
                {
                    error:
                        "Não foi possível carregar os clientes.",
                },
                {
                    status: 500,
                }
            );
        }

        return NextResponse.json({
            clientes: clientes ?? [],
        });
    } catch (error) {
        console.error(
            "Erro interno ao carregar clientes:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Ocorreu um erro interno ao carregar os clientes.",
            },
            {
                status: 500,
            }
        );
    }
}

export async function POST(
    request: Request
) {
    try {
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

        const empresaId = membro.company_id;

        const body =
            (await request.json()) as CriarClienteBody;

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

        const {
            data: cliente,
            error: clienteError,
        } = await supabase
            .from("clientes")
            .insert({
                empresa_id: empresaId,
                nome,
                email:
                    body.email?.trim() || null,
                telefone:
                    body.telefone?.trim() || null,
                notas:
                    body.notas?.trim() || null,
            })
            .select(
                "id, nome, email, telefone, notas"
            )
            .single();

        if (clienteError) {
            console.error(
                "Erro ao criar cliente:",
                clienteError
            );

            return NextResponse.json(
                {
                    error:
                        clienteError.message ||
                        "Não foi possível criar o cliente.",
                },
                {
                    status: 400,
                }
            );
        }

        return NextResponse.json(
            {
                success: true,
                cliente,
            },
            {
                status: 201,
            }
        );
    } catch (error) {
        console.error(
            "Erro interno ao criar cliente:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Ocorreu um erro interno ao criar o cliente.",
            },
            {
                status: 500,
            }
        );
    }
}