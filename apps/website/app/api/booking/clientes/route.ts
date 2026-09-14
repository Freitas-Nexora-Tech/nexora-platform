import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type CriarClienteBody = {
    nome: string;
    email?: string | null;
    telefone?: string | null;
    notas?: string | null;
};

async function obterEmpresaDoUtilizador() {
    const supabase =
        await createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return {
            supabase,
            user: null,
            empresaId: null,
        };
    }

    const {
        data: membro,
        error: membroError,
    } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

    if (membroError || !membro) {
        return {
            supabase,
            user,
            empresaId: null,
        };
    }

    return {
        supabase,
        user,
        empresaId: membro.company_id,
    };
}

export async function GET() {
    try {
        const {
            supabase,
            user,
            empresaId,
        } = await obterEmpresaDoUtilizador();

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

        if (!empresaId) {
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

export async function POST(request: Request) {
    try {
        const {
            supabase,
            user,
            empresaId,
        } = await obterEmpresaDoUtilizador();

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

        if (!empresaId) {
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