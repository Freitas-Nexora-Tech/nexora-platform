import type { NexoraTool } from "./index";

export const testTool: NexoraTool = {
  name: "nexora_test",
  description:
    "Ferramenta interna de teste da Nexora AI. Deve ser usada apenas para testar o sistema de ferramentas.",

  parameters: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },

  async execute(_arguments, context) {
    return {
      success: true,
      message: "O sistema de ferramentas da Nexora AI está a funcionar.",
      companyId: context.companyId,
      userId: context.userId,
    };
  },
};
