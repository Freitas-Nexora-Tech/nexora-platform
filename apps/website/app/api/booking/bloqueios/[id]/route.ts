import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

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

    const { data: membro } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

    return {
        supabase,
        user,
        empresaId: membro?.company_id ?? null,
    };
}

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export async function PATCH(
    request: Request,
    { params }: RouteContext
) {
    try {
        const { id } = await params;

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
                { status: 401 }
            );
        }

        if (!empresaId) {
            return NextResponse.json(
                {
                    error: "Empresa não encontrada.",
                },
                { status: 403 }
            );
        }

        if (!id) {
            return NextResponse.json(
                {
                    error: "Bloqueio não identificado.",
                },
                { status: 400 }
            );
        }

        const body = await request.json();

        const profissionalId =
            typeof body.profissional_id ===
            "string"
                ? body.profissional_id.trim()
                : "";

        const inicio =
            typeof body.inicio === "string"
                ? body.inicio.trim()
                : "";

        const fim =
            typeof body.fim === "string"
                ? body.fim.trim()
                : "";

        const motivo =
            typeof body.motivo === "string"
                ? body.motivo.trim()
                : null;

        if (
            !profissionalId ||
            !inicio ||
            !fim
        ) {
            return NextResponse.json(
                {
                    error: "Profissional, início e fim são obrigatórios.",
                },
                { status: 400 }
            );
        }

        const inicioData = new Date(inicio);
        const fimData = new Date(fim);

        if (
            Number.isNaN(
                inicioData.getTime()
            ) ||
            Number.isNaN(
                fimData.getTime()
            )
        ) {
            return NextResponse.json(
                {
                    error: "As datas fornecidas são inválidas.",
                },
                { status: 400 }
            );
        }

        if (inicioData >= fimData) {
            return NextResponse.json(
                {
                    error: "A data/hora de fim deve ser posterior ao início.",
                },
                { status: 400 }
            );
        }

        const { data: bloqueio } =
            await supabase
                .from("bloqueios")
                .select(
                    "id, empresa_id, profissional_id, inicio, fim, motivo"
                )
                .eq("id", id)
                .eq("empresa_id", empresaId)
                .single();

        if (!bloqueio) {
            return NextResponse.json(
                {
                    error: "Bloqueio não encontrado.",
                },
                { status: 404 }
            );
        }

        const {
            data: profissional,
            error: profissionalError,
        } = await supabase
            .from("profissionais")
            .select("id, nome, ativo")
            .eq("id", profissionalId)
            .eq("empresa_id", empresaId)
            .single();

        if (
            profissionalError ||
            !profissional
        ) {
            return NextResponse.json(
                {
                    error: "Profissional não encontrado.",
                },
                { status: 404 }
            );
        }

        if (!profissional.ativo) {
            return NextResponse.json(
                {
                    error: "O profissional selecionado está inativo.",
                },
                { status: 400 }
            );
        }

        const { data: bloqueioAtualizado, error } =
            await supabase
                .from("bloqueios")
                .update({
                    profissional_id:
                        profissionalId,
                    inicio:
                        inicioData.toISOString(),
                    fim:
                        fimData.toISOString(),
                    motivo:
                        motivo || null,
                    updated_at:
                        new Date().toISOString(),
                })
                .eq("id", id)
                .eq("empresa_id", empresaId)
                .select(
                    "id, empresa_id, profissional_id, inicio, fim, motivo, updated_at"
                )
                .single();

        if (error) {
            console.error(
                "Erro ao atualizar bloqueio:",
                error
            );

            return NextResponse.json(
                {
                    error: "Não foi possível atualizar o bloqueio.",
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            bloqueio:
                bloqueioAtualizado,
        });
    } catch (error) {
        console.error(
            "Erro inesperado ao atualizar bloqueio:",
            error
        );

        return NextResponse.json(
            {
                error: "Ocorreu um erro inesperado.",
            },
            { status: 500 }
        );
    }
    
}
export async function DELETE(
    request: Request,
    { params }: RouteContext
) {
    try {
        const { id } = await params;

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
                { status: 401 }
            );
        }

        if (!empresaId) {
            return NextResponse.json(
                {
                    error: "Empresa não encontrada.",
                },
                { status: 403 }
            );
        }

        if (!id) {
            return NextResponse.json(
                {
                    error: "Bloqueio não identificado.",
                },
                { status: 400 }
            );
        }

        const { data: bloqueio } =
            await supabase
                .from("bloqueios")
                .select("id")
                .eq("id", id)
                .eq("empresa_id", empresaId)
                .single();

        if (!bloqueio) {
            return NextResponse.json(
                {
                    error: "Bloqueio não encontrado.",
                },
                { status: 404 }
            );
        }

        const { error } = await supabase
            .from("bloqueios")
            .delete()
            .eq("id", id)
            .eq("empresa_id", empresaId);

        if (error) {
            console.error(
                "Erro ao eliminar bloqueio:",
                error
            );

            return NextResponse.json(
                {
                    error: "Não foi possível eliminar o bloqueio.",
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error(
            "Erro inesperado ao eliminar bloqueio:",
            error
        );

        return NextResponse.json(
            {
                error: "Ocorreu um erro inesperado.",
            },
            { status: 500 }
        );
    }
}