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
            .select("company_id")
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

        const empresaId =
            membro.company_id;

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

        if (agendamento.estado === "cancelado") {
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

        if (agendamento.estado !== "confirmado") {
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

        const {
            data: atualizado,
            error: atualizarError,
        } = await supabase
            .from("agendamentos")
            .update({
                estado: "concluido",
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .eq("empresa_id", empresaId)
            .eq("estado", "confirmado")
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