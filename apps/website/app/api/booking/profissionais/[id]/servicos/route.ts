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

        const body = await request.json();

        const servicoId = body?.servico_id;
        const associado = body?.associado;

        if (
            typeof servicoId !== "string" ||
            !servicoId
        ) {
            return NextResponse.json(
                { error: "Serviço inválido." },
                { status: 400 }
            );
        }

        if (typeof associado !== "boolean") {
            return NextResponse.json(
                { error: "Estado da associação inválido." },
                { status: 400 }
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

        const { data: servico } = await supabase
            .from("servicos")
            .select("id")
            .eq("id", servicoId)
            .eq("empresa_id", empresaId)
            .single();

        if (!servico) {
            return NextResponse.json(
                { error: "Serviço não encontrado." },
                { status: 404 }
            );
        }

        if (associado) {
            const { data: existente } = await supabase
                .from("profissionais_servicos")
                .select("id")
                .eq("empresa_id", empresaId)
                .eq("profissional_id", profissionalId)
                .eq("servico_id", servicoId)
                .maybeSingle();

            if (!existente) {
                const { error } = await supabase
                    .from("profissionais_servicos")
                    .insert({
                        empresa_id: empresaId,
                        profissional_id: profissionalId,
                        servico_id: servicoId,
                    });

                if (error) {
                    return NextResponse.json(
                        {
                            error:
                                "Não foi possível associar o serviço ao profissional.",
                        },
                        { status: 500 }
                    );
                }
            }
        } else {
            const { error } = await supabase
                .from("profissionais_servicos")
                .delete()
                .eq("empresa_id", empresaId)
                .eq("profissional_id", profissionalId)
                .eq("servico_id", servicoId);

            if (error) {
                return NextResponse.json(
                    {
                        error:
                            "Não foi possível remover a associação.",
                    },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            associado,
        });
    } catch {
        return NextResponse.json(
            {
                error:
                    "Ocorreu um erro ao atualizar a associação.",
            },
            { status: 500 }
        );
    }
}