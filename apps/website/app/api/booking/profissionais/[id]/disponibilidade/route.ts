import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type Props = {
    params: Promise<{
        id: string;
    }>;
};

type Horario = {
    dia_semana: number;
    hora_inicio: string;
    hora_fim: string;
    ativo: boolean;
};

export async function GET(
    _request: Request,
    { params }: Props
) {
    try {
        const { id: profissionalId } = await params;

        const supabase = await createSupabaseServerClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Não autenticado." },
                { status: 401 }
            );
        }

        // ---------------------------------------------------------
        // Membro, empresa e permissões
        // ---------------------------------------------------------

        const { data: membro, error: membroError } =
            await supabase
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
                        "A sua conta está desativada.",
                },
                { status: 403 }
            );
        }

        if (membro.must_change_password) {
            return NextResponse.json(
                {
                    error:
                        "É necessário alterar a password antes de continuar.",
                },
                { status: 403 }
            );
        }

        // Administrador tem acesso total.
        // Funcionário precisa da permissão "disponibilidade".
        if (membro.role !== "admin") {
            const {
                data: permissao,
                error: permissaoError,
            } = await supabase
                .from("company_member_permissions")
                .select("permission")
                .eq("member_id", membro.id)
                .eq("permission", "disponibilidade")
                .maybeSingle();

            if (permissaoError) {
                console.error(
                    "Erro ao verificar permissão de disponibilidade:",
                    permissaoError
                );

                return NextResponse.json(
                    {
                        error:
                            "Não foi possível validar as permissões.",
                    },
                    { status: 500 }
                );
            }

            if (!permissao) {
                return NextResponse.json(
                    {
                        error:
                            "Não tem permissão para gerir a disponibilidade.",
                    },
                    { status: 403 }
                );
            }
        }

        const empresaId = membro.company_id;

        // ---------------------------------------------------------
        // Profissional da própria empresa
        // ---------------------------------------------------------

        const { data: profissional } = await supabase
            .from("profissionais")
            .select("id")
            .eq("id", profissionalId)
            .eq("empresa_id", empresaId)
            .single();

        if (!profissional) {
            return NextResponse.json(
                {
                    error:
                        "Profissional não encontrado.",
                },
                { status: 404 }
            );
        }

        // ---------------------------------------------------------
        // Disponibilidade
        // ---------------------------------------------------------

        const {
            data: disponibilidade,
            error,
        } = await supabase
            .from("disponibilidade")
            .select(
                "id, dia_semana, hora_inicio, hora_fim, ativo"
            )
            .eq("empresa_id", empresaId)
            .eq(
                "profissional_id",
                profissionalId
            )
            .order(
                "dia_semana",
                {
                    ascending: true,
                }
            )
            .order(
                "hora_inicio",
                {
                    ascending: true,
                }
            );

        if (error) {
            return NextResponse.json(
                {
                    error:
                        "Não foi possível carregar a disponibilidade.",
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            disponibilidade:
                disponibilidade ?? [],
        });
    } catch {
        return NextResponse.json(
            {
                error:
                    "Ocorreu um erro ao carregar a disponibilidade.",
            },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: Props
) {
    try {
        const { id: profissionalId } = await params;

        const supabase = await createSupabaseServerClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Não autenticado." },
                { status: 401 }
            );
        }

        // ---------------------------------------------------------
        // Membro, empresa e permissões
        // ---------------------------------------------------------

        const { data: membro, error: membroError } =
            await supabase
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
                        "A sua conta está desativada.",
                },
                { status: 403 }
            );
        }

        if (membro.must_change_password) {
            return NextResponse.json(
                {
                    error:
                        "É necessário alterar a password antes de continuar.",
                },
                { status: 403 }
            );
        }

        // Administrador tem acesso total.
        // Funcionário precisa da permissão "disponibilidade".
        if (membro.role !== "admin") {
            const {
                data: permissao,
                error: permissaoError,
            } = await supabase
                .from("company_member_permissions")
                .select("permission")
                .eq("member_id", membro.id)
                .eq("permission", "disponibilidade")
                .maybeSingle();

            if (permissaoError) {
                console.error(
                    "Erro ao verificar permissão de disponibilidade:",
                    permissaoError
                );

                return NextResponse.json(
                    {
                        error:
                            "Não foi possível validar as permissões.",
                    },
                    { status: 500 }
                );
            }

            if (!permissao) {
                return NextResponse.json(
                    {
                        error:
                            "Não tem permissão para gerir a disponibilidade.",
                    },
                    { status: 403 }
                );
            }
        }

        const empresaId = membro.company_id;

        // ---------------------------------------------------------
        // Profissional da própria empresa
        // ---------------------------------------------------------

        const { data: profissional } = await supabase
            .from("profissionais")
            .select("id")
            .eq("id", profissionalId)
            .eq("empresa_id", empresaId)
            .single();

        if (!profissional) {
            return NextResponse.json(
                {
                    error:
                        "Profissional não encontrado.",
                },
                { status: 404 }
            );
        }

        // ---------------------------------------------------------
        // Validar corpo do pedido
        // ---------------------------------------------------------

        const body = await request.json();

        if (!Array.isArray(body?.horarios)) {
            return NextResponse.json(
                {
                    error:
                        "Horários inválidos.",
                },
                { status: 400 }
            );
        }

        const horarios =
            body.horarios as Horario[];

        // ---------------------------------------------------------
        // Validar cada horário
        // ---------------------------------------------------------

        for (const horario of horarios) {
            if (
                typeof horario?.dia_semana !==
                    "number" ||
                horario.dia_semana < 0 ||
                horario.dia_semana > 6
            ) {
                return NextResponse.json(
                    {
                        error:
                            "Dia da semana inválido.",
                    },
                    { status: 400 }
                );
            }

            if (
                typeof horario?.hora_inicio !==
                    "string" ||
                typeof horario?.hora_fim !==
                    "string"
            ) {
                return NextResponse.json(
                    {
                        error:
                            "Horário inválido.",
                    },
                    { status: 400 }
                );
            }

            if (
                typeof horario?.ativo !==
                "boolean"
            ) {
                return NextResponse.json(
                    {
                        error:
                            "Estado do horário inválido.",
                    },
                    { status: 400 }
                );
            }

            if (
                !/^\d{2}:\d{2}$/.test(
                    horario.hora_inicio
                ) ||
                !/^\d{2}:\d{2}$/.test(
                    horario.hora_fim
                )
            ) {
                return NextResponse.json(
                    {
                        error:
                            "Formato de hora inválido.",
                    },
                    { status: 400 }
                );
            }

            if (
                horario.ativo &&
                horario.hora_inicio >=
                    horario.hora_fim
            ) {
                return NextResponse.json(
                    {
                        error:
                            "A hora de início deve ser anterior à hora de fim.",
                    },
                    { status: 400 }
                );
            }
        }

        // ---------------------------------------------------------
        // Remover disponibilidade anterior
        // ---------------------------------------------------------

        const {
            error: deleteError,
        } = await supabase
            .from("disponibilidade")
            .delete()
            .eq(
                "empresa_id",
                empresaId
            )
            .eq(
                "profissional_id",
                profissionalId
            );

        if (deleteError) {
            return NextResponse.json(
                {
                    error:
                        "Não foi possível atualizar a disponibilidade.",
                },
                { status: 500 }
            );
        }

        // ---------------------------------------------------------
        // Guardar horários ativos
        // ---------------------------------------------------------

        const horariosAtivos =
            horarios.filter(
                (horario) =>
                    horario.ativo
            );

        if (
            horariosAtivos.length > 0
        ) {
            const {
                error: insertError,
            } = await supabase
                .from("disponibilidade")
                .insert(
                    horariosAtivos.map(
                        (horario) => ({
                            empresa_id:
                                empresaId,
                            profissional_id:
                                profissionalId,
                            dia_semana:
                                horario.dia_semana,
                            hora_inicio:
                                horario.hora_inicio,
                            hora_fim:
                                horario.hora_fim,
                            ativo: true,
                        })
                    )
                );

            if (insertError) {
                return NextResponse.json(
                    {
                        error:
                            "Não foi possível guardar os horários.",
                    },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({
            success: true,
        });
    } catch {
        return NextResponse.json(
            {
                error:
                    "Ocorreu um erro ao guardar a disponibilidade.",
            },
            { status: 500 }
        );
    }
}