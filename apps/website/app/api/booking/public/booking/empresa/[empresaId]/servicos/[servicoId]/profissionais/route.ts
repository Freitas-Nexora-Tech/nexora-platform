import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type RouteContext = {
  params: Promise<{
    empresaId: string;
    servicoId: string;
  }>;
};

type ProfissionalPublico = {
  id: string;
  empresa_id: string;
  nome: string;
  ativo: boolean;
};

type ProfissionalServico = {
  profissional_id: string;
  profissionais:
    | ProfissionalPublico
    | ProfissionalPublico[]
    | null;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { empresaId, servicoId } = await params;

    if (!empresaId || !servicoId) {
      return NextResponse.json(
        {
          error:
            "Empresa ou serviço não identificado.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = createSupabaseAdminClient();

    /*
     * Confirmar que o serviço pertence à empresa
     * e está ativo.
     */
    const {
      data: servico,
      error: servicoError,
    } = await supabase
      .from("servicos")
      .select(
        "id, empresa_id, nome, descricao, duracao_minutos, preco, ativo"
      )
      .eq("id", servicoId)
      .eq("empresa_id", empresaId)
      .eq("ativo", true)
      .maybeSingle();

    if (servicoError) {
      console.error(
        "Erro ao verificar serviço público:",
        servicoError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível verificar o serviço.",
        },
        {
          status: 500,
        }
      );
    }

    if (!servico) {
      return NextResponse.json(
        {
          error: "Serviço não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Procurar os profissionais associados ao serviço.
     */
    const {
      data: profissionaisServicos,
      error: profissionaisServicosError,
    } = await supabase
      .from("profissionais_servicos")
      .select(
        `
          profissional_id,
          profissionais (
            id,
            empresa_id,
            nome,
            ativo
          )
        `
      )
      .eq("empresa_id", empresaId)
      .eq("servico_id", servicoId);

    if (profissionaisServicosError) {
      console.error(
        "Erro ao carregar profissionais do serviço:",
        profissionaisServicosError
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível carregar os profissionais.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Fazemos a conversão explicitamente para evitar
     * problemas de inferência do TypeScript/Supabase.
     */
    const registos =
      (profissionaisServicos ?? []) as unknown as ProfissionalServico[];

    const profissionais = registos
      .map((item) => {
        const profissional = Array.isArray(
          item.profissionais
        )
          ? item.profissionais[0]
          : item.profissionais;

        if (!profissional) {
          return null;
        }

        if (
          profissional.empresa_id !== empresaId ||
          profissional.ativo !== true
        ) {
          return null;
        }

        return {
          id: profissional.id,
          nome: profissional.nome,
        };
      })
      .filter(
        (
          profissional
        ): profissional is {
          id: string;
          nome: string;
        } => profissional !== null
      );

    return NextResponse.json({
      servico: {
        id: servico.id,
        nome: servico.nome,
        descricao: servico.descricao ?? null,
        duracao_minutos:
          servico.duracao_minutos,
        preco: servico.preco,
      },

      profissionais,
    });
  } catch (error) {
    console.error(
      "Erro inesperado ao carregar profissionais públicos:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Ocorreu um erro ao carregar os profissionais.",
      },
      {
        status: 500,
      }
    );
  }
}