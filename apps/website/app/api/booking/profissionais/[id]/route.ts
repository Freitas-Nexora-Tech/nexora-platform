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

        const nome =
            typeof body?.nome === "string"
                ? body.nome.trim()
                : "";

        const ativo =
            typeof body?.ativo === "boolean"
                ? body.ativo
                : null;

        if (!nome) {
            return NextResponse.json(
                {
                    error:
                        "O nome do profissional é obrigatório.",
                },
                { status: 400 }
            );
        }

        if (ativo === null) {
            return NextResponse.json(
                {
                    error:
                        "O estado do profissional é inválido.",
                },
                { status: 400 }
            );
        }

        const { data: profissional } = await supabase
            .from("profissionais")
            .select("id")
            .eq("id", id)
            .eq("empresa_id", membro.company_id)
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

        const { data: atualizado, error } = await supabase
            .from("profissionais")
            .update({
                nome,
                ativo,
            })
            .eq("id", id)
            .eq("empresa_id", membro.company_id)
            .select("id, nome, ativo")
            .single();

        if (error) {
            return NextResponse.json(
                {
                    error:
                        "Não foi possível atualizar o profissional.",
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            profissional: atualizado,
        });
    } catch {
        return NextResponse.json(
            {
                error:
                    "Ocorreu um erro ao atualizar o profissional.",
            },
            { status: 500 }
        );
    }
}