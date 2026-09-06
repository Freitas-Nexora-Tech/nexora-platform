import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const BOOKING_PRODUCT_ID = "165ea020-af05-447a-a21e-1ef91f88b68e";

const BOOKING_AI_CAMPAIGN_CODE = "BOOKING-AI-2M";

const BOOKING_PLANS = {
    starter: "booking-starter",
    professional: "booking-professional",
    business: "booking-business",
} as const;

type BookingPlan = keyof typeof BOOKING_PLANS;

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

        const body = await request.json();

        const empresaId = body.empresa_id;
        const plano = body.plano as BookingPlan;

        if (!empresaId || !plano) {
            return NextResponse.json(
                { error: "Empresa e plano são obrigatórios." },
                { status: 400 }
            );
        }

        if (!BOOKING_PLANS[plano]) {
            return NextResponse.json(
                { error: "Plano Booking inválido." },
                { status: 400 }
            );
        }

        // Confirmar que o utilizador pertence à empresa
        const { data: membro, error: membroError } = await supabase
            .from("company_members")
            .select("company_id")
            .eq("user_id", user.id)
            .eq("company_id", empresaId)
            .maybeSingle();

        if (membroError) {
            console.error("Erro ao verificar membro:", membroError);

            return NextResponse.json(
                { error: "Não foi possível verificar a empresa." },
                { status: 500 }
            );
        }

        if (!membro) {
            return NextResponse.json(
                { error: "Não tem acesso a esta empresa." },
                { status: 403 }
            );
        }

        // Procurar o plano Booking
        const { data: plan, error: planError } = await supabase
            .from("plans")
            .select(
                "id, name, slug, product_id, price_monthly, price_yearly, max_professionals"
            )
            .eq("slug", BOOKING_PLANS[plano])
            .eq("product_id", BOOKING_PRODUCT_ID)
            .eq("is_active", true)
            .maybeSingle();

        if (planError) {
            console.error("Erro ao procurar plano:", planError);

            return NextResponse.json(
                { error: "Não foi possível encontrar o plano Booking." },
                { status: 500 }
            );
        }

        if (!plan) {
            return NextResponse.json(
                { error: "Plano Booking não encontrado." },
                { status: 404 }
            );
        }

        // Verificar se a empresa já tem Booking
        const { data: existingSubscription, error: existingError } =
            await supabase
                .from("product_subscriptions")
                .select("id, status, plan_id")
                .eq("company_id", empresaId)
                .eq("product_id", BOOKING_PRODUCT_ID)
                .maybeSingle();

        if (existingError) {
            console.error(
                "Erro ao verificar subscrição existente:",
                existingError
            );

            return NextResponse.json(
                {
                    error:
                        "Não foi possível verificar a subscrição Booking.",
                },
                { status: 500 }
            );
        }

        if (existingSubscription) {
            return NextResponse.json(
                {
                    error:
                        "Esta empresa já tem uma subscrição do Nexora Booking.",
                    subscription: existingSubscription,
                },
                { status: 409 }
            );
        }

        const now = new Date();

        const trialEnds = new Date(now);
        trialEnds.setDate(trialEnds.getDate() + 14);

        // Campanha de lançamento:
        // Nexora AI incluída durante 2 meses.
        const campaignEnds = new Date(now);
        campaignEnds.setMonth(campaignEnds.getMonth() + 2);

        // Criar subscrição Booking
        const { data: subscription, error: subscriptionError } = await supabase
            .from("product_subscriptions")
            .insert({
                company_id: empresaId,
                product_id: BOOKING_PRODUCT_ID,
                plan_id: plan.id,
                status: "trial",
                billing_cycle: "monthly",
                current_period_start: now.toISOString(),
                current_period_end: trialEnds.toISOString(),
                trial_ends_at: trialEnds.toISOString(),

                // Campanha de lançamento Nexora AI
                campaign_code: BOOKING_AI_CAMPAIGN_CODE,
                campaign_started_at: now.toISOString(),
                campaign_ends_at: campaignEnds.toISOString(),
            })
            .select()
            .single();

        if (subscriptionError) {
            console.error(
                "Erro ao criar subscrição Booking:",
                subscriptionError
            );

            return NextResponse.json(
                { error: "Não foi possível ativar o Nexora Booking." },
                { status: 500 }
            );
        }

        // Verificar se a empresa já tem configuração de agenda
        const { data: existingConfig, error: configCheckError } =
            await supabase
                .from("configuracoes_agendamento")
                .select("id")
                .eq("empresa_id", empresaId)
                .maybeSingle();

        if (configCheckError) {
            console.error(
                "Erro ao verificar configuração Booking:",
                configCheckError
            );

            // Rollback da subscrição criada
            await supabase
                .from("product_subscriptions")
                .delete()
                .eq("id", subscription.id);

            return NextResponse.json(
                {
                    error:
                        "Não foi possível verificar a configuração da agenda.",
                },
                { status: 500 }
            );
        }

        // Criar configuração apenas se ainda não existir
        if (!existingConfig) {
            const { error: configError } = await supabase
                .from("configuracoes_agendamento")
                .insert({
                    empresa_id: empresaId,
                    agendamento_ativo: true,
                    fuso_horario: "Europe/Lisbon",
                    intervalo_marcacao_minutos: 30,
                    antecedencia_minima_minutos: 120,
                    antecedencia_maxima_dias: 60,
                    cancelamento_ativo: true,
                    prazo_cancelamento_minutos: 120,
                    capacidade_por_horario: 1,
                });

            if (configError) {
                console.error(
                    "Erro ao criar configuração Booking:",
                    configError
                );

                // Rollback da subscrição criada
                await supabase
                    .from("product_subscriptions")
                    .delete()
                    .eq("id", subscription.id);

                return NextResponse.json(
                    {
                        error:
                            "Não foi possível configurar a agenda Booking.",
                    },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            subscription,
            plan: {
                id: plan.id,
                name: plan.name,
                slug: plan.slug,
                price_monthly: plan.price_monthly,
                price_yearly: plan.price_yearly,
                max_professionals: plan.max_professionals,
            },
        });
    } catch (error) {
        console.error("Erro no onboarding Booking:", error);

        return NextResponse.json(
            { error: "Ocorreu um erro inesperado." },
            { status: 500 }
        );
    }
}