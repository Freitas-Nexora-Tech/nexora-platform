import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(
    request: Request
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
                    error: "Empresa não encontrada.",
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

        const empresaId = membro.company_id;

        /*
         * Verificar permissão para gerir bloqueios.
         *
         * Administradores têm acesso total.
         * Funcionários precisam da permissão "bloqueios".
         */
        if (membro.role !== "admin") {
            const {
                data: permissao,
                error: permissaoError,
            } = await supabase
                .from("company_member_permissions")
                .select("id")
                .eq("member_id", membro.id)
                .eq("permission", "bloqueios")
                .limit(1)
                .maybeSingle();

            if (permissaoError) {
                console.error(
                    "Erro ao verificar permissão de bloqueios:",
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
                            "Não tem permissão para gerir bloqueios.",
                    },
                    { status: 403 }
                );
            }
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
                    error:
                        "Profissional, início e fim são obrigatórios.",
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
                    error:
                        "As datas fornecidas são inválidas.",
                },
                { status: 400 }
            );
        }

        if (inicioData >= fimData) {
            return NextResponse.json(
                {
                    error:
                        "A data/hora de fim deve ser posterior ao início.",
                },
                { status: 400 }
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
                    error:
                        "Profissional não encontrado.",
                },
                { status: 404 }
            );
        }

        if (!profissional.ativo) {
            return NextResponse.json(
                {
                    error:
                        "O profissional selecionado está inativo.",
                },
                { status: 400 }
            );
        }

        const {
            data: bloqueio,
            error,
        } = await supabase
            .from("bloqueios")
            .insert({
                empresa_id: empresaId,
                profissional_id:
                    profissionalId,
                inicio:
                    inicioData.toISOString(),
                fim:
                    fimData.toISOString(),
                motivo:
                    motivo || null,
            })
            .select(
                "id, empresa_id, profissional_id, inicio, fim, motivo"
            )
            .single();

        if (error) {
            console.error(
                "Erro ao criar bloqueio:",
                error
            );

            return NextResponse.json(
                {
                    error:
                        "Não foi possível criar o bloqueio.",
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                bloqueio,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error(
            "Erro inesperado ao criar bloqueio:",
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