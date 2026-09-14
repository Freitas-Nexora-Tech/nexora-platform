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

        const { id } = await context.params;

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

        const { data: agendamento } =
            await supabase
                .from("agendamentos")
                .select("*")
                .eq("id", id)
                .eq(
                    "empresa_id",
                    membro.company_id
                )
                .maybeSingle();

        if (!agendamento) {
            return NextResponse.json(
                {
                    error: "Marcação não encontrada.",
                },
                {
                    status: 404,
                }
            );
        }

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

        const {
            data: agendamentoAtualizado,
            error: atualizacaoError,
        } = await supabase
            .from("agendamentos")
            .update({
                estado: "cancelado",
            })
            .eq("id", id)
            .eq(
                "empresa_id",
                membro.company_id
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