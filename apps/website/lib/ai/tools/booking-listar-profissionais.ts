import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type { NexoraTool } from "./index";

export const bookingListarProfissionaisTool: NexoraTool = {
  name: "booking_listar_profissionais",

  description:
    "Lista os profissionais ativos que podem realizar serviços de Booking da empresa. Pode consultar os profissionais de um serviço específico ou, quando o utilizador perguntar de forma geral, listar os profissionais associados a todos os serviços disponíveis.",

  parameters: {
    type: "object",
    properties: {
      servico_id: {
        type: ["string", "null"],
        description:
          "ID interno do serviço. Deve ser utilizado quando o utilizador estiver a perguntar pelos profissionais de um serviço específico. Se o utilizador perguntar pelos profissionais de todos os serviços, deve ser null.",
      },
    },
    required: ["servico_id"],
    additionalProperties: false,
  },

  async execute(arguments_, context) {
    const supabase = createSupabaseAdminClient();

    const servicoId =
      typeof arguments_.servico_id === "string" &&
      arguments_.servico_id.trim()
        ? arguments_.servico_id
        : null;

    /*
     * Caso 1:
     * O utilizador escolheu um serviço específico.
     */
    if (servicoId) {
      const { data: servico, error: servicoError } =
        await supabase
          .from("servicos")
          .select(
            "id, nome, descricao, duracao_minutos, preco, ativo"
          )
          .eq("id", servicoId)
          .eq("empresa_id", context.companyId)
          .eq("ativo", true)
          .maybeSingle();

      if (servicoError) {
        console.error(
          "Erro ao validar serviço do Booking:",
          servicoError
        );

        return {
          success: false,
          error:
            "Não foi possível validar o serviço selecionado.",
        };
      }

      if (!servico) {
        return {
          success: false,
          error:
            "O serviço selecionado não está disponível para esta empresa.",
        };
      }

      const {
        data: associacoes,
        error: associacoesError,
      } = await supabase
        .from("profissionais_servicos")
        .select("profissional_id")
        .eq("empresa_id", context.companyId)
        .eq("servico_id", servicoId);

      if (associacoesError) {
        console.error(
          "Erro ao obter profissionais do serviço:",
          associacoesError
        );

        return {
          success: false,
          error:
            "Não foi possível obter os profissionais disponíveis.",
        };
      }

      const profissionalIds =
        associacoes?.map(
          (associacao) =>
            associacao.profissional_id
        ) ?? [];

      if (profissionalIds.length === 0) {
        return {
          success: true,
          servico: {
            id: servico.id,
            nome: servico.nome,
          },
          profissionais: [],
        };
      }

      const {
        data: profissionais,
        error: profissionaisError,
      } = await supabase
        .from("profissionais")
        .select("id, nome")
        .eq("empresa_id", context.companyId)
        .eq("ativo", true)
        .in("id", profissionalIds)
        .order("nome", {
          ascending: true,
        });

      if (profissionaisError) {
        console.error(
          "Erro ao listar profissionais:",
          profissionaisError
        );

        return {
          success: false,
          error:
            "Não foi possível obter os profissionais disponíveis.",
        };
      }

      return {
        success: true,
        servico: {
          id: servico.id,
          nome: servico.nome,
        },
        profissionais:
          profissionais?.map(
            (profissional) => ({
              id: profissional.id,
              nome: profissional.nome,
            })
          ) ?? [],
      };
    }

    /*
     * Caso 2:
     * O utilizador quer saber os profissionais
     * de todos os serviços disponíveis.
     */

    const {
      data: servicos,
      error: servicosError,
    } = await supabase
      .from("servicos")
      .select(
        "id, nome, descricao, duracao_minutos, preco"
      )
      .eq("empresa_id", context.companyId)
      .eq("ativo", true)
      .order("nome", {
        ascending: true,
      });

    if (servicosError) {
      console.error(
        "Erro ao listar serviços do Booking:",
        servicosError
      );

      return {
        success: false,
        error:
          "Não foi possível obter os serviços disponíveis.",
      };
    }

    if (!servicos || servicos.length === 0) {
      return {
        success: true,
        servicos: [],
      };
    }

    const {
      data: associacoes,
      error: associacoesError,
    } = await supabase
      .from("profissionais_servicos")
      .select(
        "servico_id, profissional_id"
      )
      .eq("empresa_id", context.companyId);

    if (associacoesError) {
      console.error(
        "Erro ao obter associações dos serviços:",
        associacoesError
      );

      return {
        success: false,
        error:
          "Não foi possível obter as associações entre serviços e profissionais.",
      };
    }

    const profissionalIds = Array.from(
      new Set(
        (associacoes ?? []).map(
          (associacao) =>
            associacao.profissional_id
        )
      )
    );

    if (profissionalIds.length === 0) {
      return {
        success: true,
        servicos: servicos.map(
          (servico) => ({
            id: servico.id,
            nome: servico.nome,
            profissionais: [],
          })
        ),
      };
    }

    const {
      data: profissionais,
      error: profissionaisError,
    } = await supabase
      .from("profissionais")
      .select("id, nome")
      .eq("empresa_id", context.companyId)
      .eq("ativo", true)
      .in("id", profissionalIds)
      .order("nome", {
        ascending: true,
      });

    if (profissionaisError) {
      console.error(
        "Erro ao listar profissionais:",
        profissionaisError
      );

      return {
        success: false,
        error:
          "Não foi possível obter os profissionais disponíveis.",
      };
    }

    const profissionaisPorId = new Map(
      (profissionais ?? []).map(
        (profissional) => [
          profissional.id,
          profissional,
        ]
      )
    );

    return {
      success: true,

      servicos: servicos.map(
        (servico) => {
          const profissionaisDoServico =
            (associacoes ?? [])
              .filter(
                (associacao) =>
                  associacao.servico_id ===
                  servico.id
              )
              .map(
                (associacao) =>
                  profissionaisPorId.get(
                    associacao.profissional_id
                  )
              )
              .filter(
                (
                  profissional
                ): profissional is {
                  id: string;
                  nome: string;
                } => Boolean(profissional)
              )
              .map(
                (profissional) => ({
                  id: profissional.id,
                  nome: profissional.nome,
                })
              );

          return {
            id: servico.id,
            nome: servico.nome,
            profissionais:
              profissionaisDoServico,
          };
        }
      ),
    };
  },
};