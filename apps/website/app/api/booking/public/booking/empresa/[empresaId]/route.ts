import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type RouteContext = {
  params: Promise<{
    empresaId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { empresaId } = await params;

    if (!empresaId) {
      return NextResponse.json(
        {
          error: "Empresa não identificada.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = createSupabaseAdminClient();

    /*
     * Empresa
     *
     * Apenas dados que podem ser apresentados
     * publicamente são devolvidos.
     */
    const {
      data: empresa,
      error: empresaError,
    } = await supabase
      .from("companies")
      .select("id, name, description")
      .eq("id", empresaId)
      .maybeSingle();

    if (empresaError) {
      console.error(
        "Erro ao carregar empresa pública:",
        empresaError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível carregar a empresa.",
        },
        {
          status: 500,
        }
      );
    }

    if (!empresa) {
      return NextResponse.json(
        {
          error: "Empresa não encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Configuração pública de agendamento.
     *
     * Não devolvemos a configuração inteira.
     * Apenas os valores necessários para a interface
     * pública.
     */
    const {
      data: configuracao,
      error: configuracaoError,
    } = await supabase
      .from("configuracoes_agendamento")
      .select(
        "agendamento_ativo, fuso_horario, intervalo_marcacao_minutos, antecedencia_minima_minutos, antecedencia_maxima_dias, cancelamento_ativo, prazo_cancelamento_minutos"
      )
      .eq("empresa_id", empresaId)
      .maybeSingle();

    if (configuracaoError) {
      console.error(
        "Erro ao carregar configuração pública:",
        configuracaoError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível carregar a configuração de agendamento.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Se ainda não existir configuração,
     * usamos os valores padrão definidos no sistema.
     */
    const configuracaoPublica = {
      agendamento_ativo:
        configuracao?.agendamento_ativo ?? true,

      fuso_horario:
        configuracao?.fuso_horario ??
        "Europe/Lisbon",

      intervalo_marcacao_minutos:
        configuracao?.intervalo_marcacao_minutos ??
        30,

      antecedencia_minima_minutos:
        configuracao?.antecedencia_minima_minutos ??
        120,

      antecedencia_maxima_dias:
        configuracao?.antecedencia_maxima_dias ??
        60,

      cancelamento_ativo:
        configuracao?.cancelamento_ativo ?? true,

      prazo_cancelamento_minutos:
        configuracao?.prazo_cancelamento_minutos ??
        120,
    };

    /*
     * Verificação da subscrição.
     *
     * Uma empresa sem subscrição válida não deve
     * disponibilizar o agendamento público.
     */
    const {
      data: subscription,
      error: subscriptionError,
    } = await supabase
      .from("company_subscriptions")
      .select("status")
      .eq("company_id", empresaId)
      .maybeSingle();

    if (subscriptionError) {
      console.error(
        "Erro ao verificar subscrição:",
        subscriptionError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível verificar o estado da empresa.",
        },
        {
          status: 500,
        }
      );
    }

    const estadosPermitidos = [
      "trial",
      "active",
    ];

    const subscricaoAtiva =
      !subscription ||
      estadosPermitidos.includes(
        subscription.status
      );

    if (!subscricaoAtiva) {
      return NextResponse.json(
        {
          error:
            "O agendamento online não está disponível neste momento.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Se a empresa desligou o agendamento online,
     * a página continua a poder identificar a empresa,
     * mas informa que as marcações estão temporariamente
     * indisponíveis.
     */
    return NextResponse.json({
      empresa: {
        id: empresa.id,
        nome: empresa.name,
        descricao: empresa.description ?? null,
      },

      configuracao: configuracaoPublica,

      agendamentoDisponivel:
        configuracaoPublica.agendamento_ativo,
    });
  } catch (error) {
    console.error(
      "Erro inesperado na API pública de Booking:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Ocorreu um erro ao carregar os dados da empresa.",
      },
      {
        status: 500,
      }
    );
  }
}