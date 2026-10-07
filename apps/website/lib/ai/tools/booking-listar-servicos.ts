import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type { NexoraTool } from "./index";

export const bookingListarServicosTool: NexoraTool = {
  name: "booking_listar_servicos",

  description:
    "Lista os serviços de Booking disponíveis para a empresa do utilizador autenticado. Deve ser usada quando o utilizador perguntar quais são os serviços disponíveis, quiser escolher um serviço ou quiser saber informações básicas sobre os serviços de marcação.",

  parameters: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },

  async execute(_arguments, context) {
    const supabase = createSupabaseAdminClient();

    const { data: servicos, error } = await supabase
      .from("servicos")
      .select(
        "id, nome, descricao, duracao_minutos, preco, ativo"
      )
      .eq("empresa_id", context.companyId)
      .eq("ativo", true)
      .order("nome", { ascending: true });

    if (error) {
      console.error(
        "Erro ao listar serviços do Booking:",
        error
      );

      return {
        success: false,
        error:
          "Não foi possível obter os serviços disponíveis.",
      };
    }

    return {
      success: true,
      servicos:
        servicos?.map((servico) => ({
          id: servico.id,
          nome: servico.nome,
          descricao: servico.descricao ?? "",
          duracao_minutos:
            servico.duracao_minutos,
          preco: servico.preco,
        })) ?? [],
    };
  },
};