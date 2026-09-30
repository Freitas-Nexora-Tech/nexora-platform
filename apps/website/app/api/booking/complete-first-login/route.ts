import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export async function POST() {
    try {
        const supabase = await createSupabaseServerClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                {
                    error: "Não autenticado.",
                },
                { status: 401 }
            );
        }

        const supabaseAdmin = createSupabaseAdminClient();

        const {
            data: membro,
            error: membroError,
        } = await supabaseAdmin
            .from("company_members")
            .select("id, user_id, is_active, must_change_password")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .eq("must_change_password", true)
            .maybeSingle();

        if (membroError) {
            console.error(
                "Erro ao procurar membro no primeiro acesso:",
                membroError
            );

            return NextResponse.json(
                {
                    error:
                        "Não foi possível validar o acesso.",
                },
                { status: 500 }
            );
        }

        if (!membro) {
            return NextResponse.json(
                {
                    error:
                        "Não foi possível concluir o primeiro acesso.",
                },
                { status: 400 }
            );
        }

        const { error: atualizarError } =
            await supabaseAdmin
                .from("company_members")
                .update({
                    must_change_password: false,
                })
                .eq("id", membro.id)
                .eq("user_id", user.id)
                .eq("is_active", true)
                .eq("must_change_password", true);

        if (atualizarError) {
            console.error(
                "Erro ao concluir primeiro acesso:",
                atualizarError
            );

            return NextResponse.json(
                {
                    error:
                        "Não foi possível concluir o primeiro acesso.",
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error(
            "Erro inesperado ao concluir primeiro acesso:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Ocorreu um erro ao concluir o primeiro acesso.",
            },
            { status: 500 }
        );
    }
}