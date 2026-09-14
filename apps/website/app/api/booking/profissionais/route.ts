import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
    try {
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
                : true;

        if (!nome) {
            return NextResponse.json(
                { error: "O nome do profissional é obrigatório." },
                { status: 400 }
            );
        }

        const { data: profissional, error } = await supabase
            .from("profissionais")
            .insert({
                empresa_id: membro.company_id,
                nome,
                ativo,
            })
            .select("id, nome, ativo")
            .single();

        if (error) {
            return NextResponse.json(
                {
                    error:
                        "Não foi possível criar o profissional.",
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            profissional,
        });
    } catch {
        return NextResponse.json(
            {
                error:
                    "Ocorreu um erro ao criar o profissional.",
            },
            { status: 500 }
        );
    }
}