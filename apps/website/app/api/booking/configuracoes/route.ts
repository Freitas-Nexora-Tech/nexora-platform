import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type ConfiguracaoBody = {
    agendamento_ativo: boolean;
    fuso_horario: string;
    intervalo_marcacao_minutos: number;
    antecedencia_minima_minutos: number;
    antecedencia_maxima_dias: number;
    cancelamento_ativo: boolean;
    prazo_cancelamento_minutos: number;
    capacidade_por_horario: number;
};

export async function PATCH(request: Request) {
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
                    error: "Empresa não encontrada.",
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
         * Verificar permissão para alterar configurações.
         *
         * Administradores têm acesso total.
         * Funcionários precisam da permissão "configuracoes".
         */
        if (membro.role !== "admin") {
            const {
                data: permissao,
                error: permissaoError,
            } = await supabase
                .from("company_member_permissions")
                .select("id")
                .eq("member_id", membro.id)
                .eq("permission", "configuracoes")
                .limit(1)
                .maybeSingle();

            if (permissaoError) {
                console.error(
                    "Erro ao verificar permissão de configurações:",
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
                            "Não tem permissão para alterar as configurações.",
                    },
                    {
                        status: 403,
                    }
                );
            }
        }

        const empresaId = membro.company_id;

        const body =
            (await request.json()) as ConfiguracaoBody;

        if (
            typeof body.agendamento_ativo !==
                "boolean" ||
            typeof body.cancelamento_ativo !==
                "boolean"
        ) {
            return NextResponse.json(
                {
                    error:
                        "Os estados de agendamento e cancelamento são inválidos.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            typeof body.fuso_horario !==
                "string" ||
            !body.fuso_horario.trim()
        ) {
            return NextResponse.json(
                {
                    error:
                        "O fuso horário é obrigatório.",
                },
                {
                    status: 400,
                }
            );
        }

        const intervalo =
            Number(
                body.intervalo_marcacao_minutos
            );

        const antecedenciaMinima =
            Number(
                body.antecedencia_minima_minutos
            );

        const antecedenciaMaxima =
            Number(
                body.antecedencia_maxima_dias
            );

        const prazoCancelamento =
            Number(
                body.prazo_cancelamento_minutos
            );

        const capacidade =
            Number(
                body.capacidade_por_horario
            );

        if (
            !Number.isInteger(intervalo) ||
            intervalo <= 0
        ) {
            return NextResponse.json(
                {
                    error:
                        "O intervalo entre marcações deve ser um número inteiro positivo.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            !Number.isInteger(
                antecedenciaMinima
            ) ||
            antecedenciaMinima < 0
        ) {
            return NextResponse.json(
                {
                    error:
                        "A antecedência mínima deve ser um número inteiro igual ou superior a zero.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            !Number.isInteger(
                antecedenciaMaxima
            ) ||
            antecedenciaMaxima <= 0
        ) {
            return NextResponse.json(
                {
                    error:
                        "A antecedência máxima deve ser um número inteiro positivo.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            !Number.isInteger(
                prazoCancelamento
            ) ||
            prazoCancelamento < 0
        ) {
            return NextResponse.json(
                {
                    error:
                        "O prazo de cancelamento deve ser um número inteiro igual ou superior a zero.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            !Number.isInteger(capacidade) ||
            capacidade <= 0
        ) {
            return NextResponse.json(
                {
                    error:
                        "A capacidade por horário deve ser um número inteiro positivo.",
                },
                {
                    status: 400,
                }
            );
        }

        const {
            data: configuracao,
        } = await supabase
            .from(
                "configuracoes_agendamento"
            )
            .select("id")
            .eq(
                "empresa_id",
                empresaId
            )
            .maybeSingle();

        if (!configuracao) {
            return NextResponse.json(
                {
                    error:
                        "Configuração de Booking não encontrada.",
                },
                {
                    status: 404,
                }
            );
        }

        const {
            data: configuracaoAtualizada,
            error: configuracaoError,
        } = await supabase
            .from(
                "configuracoes_agendamento"
            )
            .update({
                agendamento_ativo:
                    body.agendamento_ativo,
                fuso_horario:
                    body.fuso_horario.trim(),
                intervalo_marcacao_minutos:
                    intervalo,
                antecedencia_minima_minutos:
                    antecedenciaMinima,
                antecedencia_maxima_dias:
                    antecedenciaMaxima,
                cancelamento_ativo:
                    body.cancelamento_ativo,
                prazo_cancelamento_minutos:
                    prazoCancelamento,
                capacidade_por_horario:
                    capacidade,
                updated_at:
                    new Date().toISOString(),
            })
            .eq(
                "id",
                configuracao.id
            )
            .eq(
                "empresa_id",
                empresaId
            )
            .select(
                `
                id,
                agendamento_ativo,
                fuso_horario,
                intervalo_marcacao_minutos,
                antecedencia_minima_minutos,
                antecedencia_maxima_dias,
                cancelamento_ativo,
                prazo_cancelamento_minutos,
                capacidade_por_horario
                `
            )
            .single();

        if (configuracaoError) {
            console.error(
                "Erro ao atualizar configurações do Booking:",
                configuracaoError
            );

            return NextResponse.json(
                {
                    error:
                        "Não foi possível atualizar as configurações.",
                },
                {
                    status: 500,
                }
            );
        }

        return NextResponse.json({
            success: true,
            configuracao:
                configuracaoAtualizada,
        });
    } catch (error) {
        console.error(
            "Erro interno ao atualizar configurações:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Ocorreu um erro interno ao atualizar as configurações.",
            },
            {
                status: 500,
            }
        );
    }
}