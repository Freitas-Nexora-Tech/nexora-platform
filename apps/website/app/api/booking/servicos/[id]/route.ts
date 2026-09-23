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
                { error: "Não autenticado." },
                { status: 401 }
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
                { status: 403 }
            );
        }

        if (!membro.is_active) {
            return NextResponse.json(
                {
                    error:
                        "O acesso deste utilizador está desativado.",
                },
                { status: 403 }
            );
        }

        if (membro.must_change_password) {
            return NextResponse.json(
                {
                    error:
                        "É necessário alterar a palavra-passe antes de continuar.",
                },
                { status: 403 }
            );
        }

        if (membro.role !== "admin") {
            const {
                data: permissao,
                error: permissaoError,
            } = await supabase
                .from("company_member_permissions")
                .select("id")
                .eq("member_id", membro.id)
                .eq("permission", "servicos")
                .limit(1)
                .maybeSingle();

            if (permissaoError) {
                console.error(
                    "Erro ao verificar permissão de serviços:",
                    permissaoError
                );

                return NextResponse.json(
                    {
                        error:
                            "Não foi possível verificar as permissões do utilizador.",
                    },
                    { status: 500 }
                );
            }

            if (!permissao) {
                return NextResponse.json(
                    {
                        error:
                            "Não tem permissão para gerir serviços.",
                    },
                    { status: 403 }
                );
            }
        }

        const {
            data: servicoExistente,
            error: servicoError,
        } = await supabase
            .from("servicos")
            .select("id")
            .eq("id", id)
            .eq("empresa_id", membro.company_id)
            .single();

        if (servicoError || !servicoExistente) {
            return NextResponse.json(
                {
                    error:
                        "Serviço não encontrado.",
                },
                { status: 404 }
            );
        }

        const body = await request.json();

        const nome =
            typeof body.nome === "string"
                ? body.nome.trim()
                : "";

        const descricao =
            typeof body.descricao === "string"
                ? body.descricao.trim()
                : null;

        const duracaoMinutos = Number(
            body.duracao_minutos
        );

        const preco = Number(body.preco);

        const ativo =
            typeof body.ativo === "boolean"
                ? body.ativo
                : true;

        if (!nome) {
            return NextResponse.json(
                {
                    error:
                        "O nome do serviço é obrigatório.",
                },
                { status: 400 }
            );
        }

        if (
            !Number.isInteger(duracaoMinutos) ||
            duracaoMinutos < 5
        ) {
            return NextResponse.json(
                {
                    error:
                        "A duração deve ser um número inteiro de pelo menos 5 minutos.",
                },
                { status: 400 }
            );
        }

        if (
            !Number.isFinite(preco) ||
            preco < 0
        ) {
            return NextResponse.json(
                {
                    error:
                        "O preço deve ser um valor igual ou superior a 0.",
                },
                { status: 400 }
            );
        }

        const {
            data: servico,
            error,
        } = await supabase
            .from("servicos")
            .update({
                nome,
                descricao: descricao || null,
                duracao_minutos:
                    duracaoMinutos,
                preco,
                ativo,
            })
            .eq("id", id)
            .eq("empresa_id", membro.company_id)
            .select(
                "id, empresa_id, nome, descricao, duracao_minutos, preco, ativo"
            )
            .single();

        if (error) {
            console.error(
                "Erro ao atualizar serviço:",
                error
            );

            return NextResponse.json(
                {
                    error:
                        "Não foi possível atualizar o serviço.",
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            servico,
        });
    } catch (error) {
        console.error(
            "Erro inesperado ao atualizar serviço:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Ocorreu um erro inesperado.",
            },
            { status: 500 }
        );
    }
}