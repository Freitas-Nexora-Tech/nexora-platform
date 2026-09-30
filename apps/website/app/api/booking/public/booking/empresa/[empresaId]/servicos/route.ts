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
     * Primeiro confirmamos que a empresa existe
     * e que o agendamento online está ativo.
     */
    const {
      data: empresa,
      error: empresaError,
    } = await supabase
      .from("companies")
      .select("id, name")
      .eq("id", empresaId)
      .maybeSingle();

    if (empresaError) {
      console.error(
        "Erro ao verificar empresa:",
        empresaError
      );

      return NextResponse.json(
        {
          error: "Não foi possível verificar a empresa.",
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

    const {
      data: configuracao,
      error: configuracaoError,
    } = await supabase
      .from("configuracoes_agendamento")
      .select("agendamento_ativo")
      .eq("empresa_id", empresaId)
      .maybeSingle();

    if (configuracaoError) {
      console.error(
        "Erro ao verificar configuração de agendamento:",
        configuracaoError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível verificar a disponibilidade do agendamento.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      configuracao &&
      configuracao.agendamento_ativo === false
    ) {
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
     * Apenas serviços ativos da empresa são públicos.
     *
     * A ordenação por nome mantém a apresentação
     * consistente na página pública.
     */
    const {
      data: servicos,
      error: servicosError,
    } = await supabase
      .from("servicos")
      .select(
        "id, nome, descricao, duracao_minutos, preco"
      )
      .eq("empresa_id", empresaId)
      .eq("ativo", true)
      .order("nome", {
        ascending: true,
      });

    if (servicosError) {
      console.error(
        "Erro ao carregar serviços públicos:",
        servicosError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível carregar os serviços.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      empresa: {
        id: empresa.id,
        nome: empresa.name,
      },

      servicos: (servicos ?? []).map((servico) => ({
        id: servico.id,
        nome: servico.nome,
        descricao: servico.descricao ?? null,
        duracao_minutos: servico.duracao_minutos,
        preco: servico.preco,
      })),
    });
  } catch (error) {
    console.error(
      "Erro inesperado na API pública de serviços:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Ocorreu um erro ao carregar os serviços.",
      },
      {
        status: 500,
      }
    );
  }
}