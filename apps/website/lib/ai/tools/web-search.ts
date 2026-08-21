import type { NexoraTool } from "./index";

type TavilyResult = {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
};

type TavilyResponse = {
  query?: string;
  answer?: string;
  results?: TavilyResult[];
};

export const webSearchTool: NexoraTool = {
  name: "web_search",

  description:
    "Pesquisa informação atual na Internet. Use esta ferramenta quando a pergunta exigir informação recente, notícias, acontecimentos atuais, pessoas, empresas, preços ou qualquer informação que possa ter mudado desde o conhecimento do modelo.",

  parameters: {
    type: "object",
    properties: {
      consulta: {
        type: "string",
        description:
          "A pesquisa que deve ser feita na Internet. Deve ser clara e específica.",
      },
    },
    required: ["consulta"],
    additionalProperties: false,
  },

  async execute(arguments_) {
    const consulta = arguments_.consulta;

    if (
      typeof consulta !== "string" ||
      !consulta.trim()
    ) {
      return {
        success: false,
        error: "É necessário indicar uma pesquisa.",
      };
    }

    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        error:
          "A pesquisa na Internet não está configurada.",
      };
    }

    try {
      const response = await fetch(
        "https://api.tavily.com/search",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          cache: "no-store",

          body: JSON.stringify({
            api_key: apiKey,
            query: consulta.trim(),
            search_depth: "basic",
            topic: "general",
            max_results: 5,
            include_answer: true,
            include_raw_content: false,
          }),
        }
      );

      if (!response.ok) {
        console.error(
          "Erro Tavily:",
          response.status,
          await response.text()
        );

        return {
          success: false,
          error:
            "Não foi possível realizar a pesquisa na Internet.",
        };
      }

      const data =
        (await response.json()) as TavilyResponse;

      const resultados =
        data.results?.map((resultado, index) => ({
          numero: index + 1,
          titulo: resultado.title || "",
          url: resultado.url || "",
          conteudo: resultado.content || "",
          relevancia: resultado.score ?? null,
        })) || [];

      return {
        success: true,

        fonte: "Tavily",

        consulta:
          data.query || consulta,

        resumo:
          data.answer || null,

        resultados,

        fontes:
          resultados.map((resultado) => ({
            numero: resultado.numero,
            titulo: resultado.titulo,
            url: resultado.url,
          })),
      };
    } catch (error) {
      console.error(
        "Erro na ferramenta web_search:",
        error
      );

      return {
        success: false,
        error:
          "Não foi possível pesquisar na Internet neste momento.",
      };
    }
  },
};