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

        const { data: membro } = await supabase
            .from("company_members")
            .select("company_id")
            .eq("user_id", user.id)
            .limit(1)
            .single();

        if (!membro?.company_id) {
            return NextResponse.json(
                { error: "Empresa não encontrada." },
                { status: 403 }
            );
        }

        const empresaId = membro.company_id;

        const { data: profissional } = await supabase
            .from("profissionais")
            .select("id")
            .eq("id", profissionalId)
            .eq("empresa_id", empresaId)
            .single();

        if (!profissional) {
            return NextResponse.json(
                { error: "Profissional não encontrado." },
                { status: 404 }
            );
        }

        const { data: disponibilidade, error } = await supabase
            .from("disponibilidade")
            .select(
                "id, dia_semana, hora_inicio, hora_fim, ativo"
            )
            .eq("empresa_id", empresaId)
            .eq("profissional_id", profissionalId)
            .order("dia_semana", { ascending: true })
            .order("hora_inicio", { ascending: true });

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
            disponibilidade: disponibilidade ?? [],
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

        const { data: membro } = await supabase
            .from("company_members")
            .select("company_id")
            .eq("user_id", user.id)
            .limit(1)
            .single();

        if (!membro?.company_id) {
            return NextResponse.json(
                { error: "Empresa não encontrada." },
                { status: 403 }
            );
        }

        const empresaId = membro.company_id;

        const { data: profissional } = await supabase
            .from("profissionais")
            .select("id")
            .eq("id", profissionalId)
            .eq("empresa_id", empresaId)
            .single();

        if (!profissional) {
            return NextResponse.json(
                { error: "Profissional não encontrado." },
                { status: 404 }
            );
        }

        const body = await request.json();

        if (!Array.isArray(body?.horarios)) {
            return NextResponse.json(
                { error: "Horários inválidos." },
                { status: 400 }
            );
        }

        const horarios = body.horarios as Horario[];

        for (const horario of horarios) {
            if (
                typeof horario?.dia_semana !== "number" ||
                horario.dia_semana < 0 ||
                horario.dia_semana > 6
            ) {
                return NextResponse.json(
                    { error: "Dia da semana inválido." },
                    { status: 400 }
                );
            }

            if (
                typeof horario?.hora_inicio !== "string" ||
                typeof horario?.hora_fim !== "string"
            ) {
                return NextResponse.json(
                    { error: "Horário inválido." },
                    { status: 400 }
                );
            }

            if (typeof horario?.ativo !== "boolean") {
                return NextResponse.json(
                    { error: "Estado do horário inválido." },
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
                    { error: "Formato de hora inválido." },
                    { status: 400 }
                );
            }

            if (
                horario.ativo &&
                horario.hora_inicio >= horario.hora_fim
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

        const { error: deleteError } = await supabase
            .from("disponibilidade")
            .delete()
            .eq("empresa_id", empresaId)
            .eq("profissional_id", profissionalId);

        if (deleteError) {
            return NextResponse.json(
                {
                    error:
                        "Não foi possível atualizar a disponibilidade.",
                },
                { status: 500 }
            );
        }

        const horariosAtivos = horarios.filter(
            (horario) => horario.ativo
        );

        if (horariosAtivos.length > 0) {
            const { error: insertError } = await supabase
                .from("disponibilidade")
                .insert(
                    horariosAtivos.map((horario) => ({
                        empresa_id: empresaId,
                        profissional_id: profissionalId,
                        dia_semana: horario.dia_semana,
                        hora_inicio: horario.hora_inicio,
                        hora_fim: horario.hora_fim,
                        ativo: true,
                    }))
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