import type { NexoraTool } from "./index";

type TavilyResult = {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
  published_date?: string;
};

type TavilyResponse = {
  query?: string;
  answer?: string;
  results?: TavilyResult[];
};

export const webSearchTool: NexoraTool = {
  name: "web_search",

  description:
    "Pesquisa informação atual na Internet. Use esta ferramenta quando a pergunta exigir informação recente, notícias, acontecimentos atuais, pessoas, empresas, preços, produtos, eventos ou qualquer informação que possa ter mudado desde o conhecimento do modelo. Para pedidos de notícias ou acontecimentos recentes, use uma pesquisa orientada para notícias.",

  parameters: {
    type: "object",

    properties: {
      consulta: {
        type: "string",
        description:
          "Pesquisa clara e específica. Para notícias, inclua o assunto e indique que procura notícias recentes ou atuais quando isso for relevante.",
      },

      tipo: {
        type: "string",
        enum: ["geral", "noticias"],
        description:
          "Use 'noticias' quando o utilizador pedir notícias, acontecimentos recentes, últimas novidades ou o que aconteceu recentemente. Use 'geral' para os restantes pedidos.",
      },
    },

    required: ["consulta", "tipo"],

    additionalProperties: false,
  },

  async execute(arguments_) {
    const consulta = arguments_.consulta;
    const tipo = arguments_.tipo;

    if (
      typeof consulta !== "string" ||
      !consulta.trim()
    ) {
      return {
        success: false,
        error:
          "É necessário indicar uma pesquisa.",
      };
    }

    if (
      tipo !== "geral" &&
      tipo !== "noticias"
    ) {
      return {
        success: false,
        error:
          "O tipo de pesquisa indicado não é válido.",
      };
    }

    const apiKey =
      process.env.TAVILY_API_KEY;

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
            "Content-Type":
              "application/json",
          },

          cache: "no-store",

          body: JSON.stringify({
            api_key: apiKey,

            query: consulta.trim(),

            search_depth: "basic",

            topic:
              tipo === "noticias"
                ? "news"
                : "general",

            max_results: 5,

            include_answer: true,

            include_raw_content: false,

            include_domains: [],

            exclude_domains: [],
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
        data.results?.map(
          (resultado, index) => ({
            numero: index + 1,

            titulo:
              resultado.title || "",

            url:
              resultado.url || "",

            conteudo:
              resultado.content || "",

            relevancia:
              resultado.score ?? null,

            data_publicacao:
              resultado.published_date ||
              null,
          })
        ) || [];

      const fontes =
        resultados
          .filter(
            (resultado) =>
              resultado.url
          )
          .map(
            (resultado) => ({
              numero:
                resultado.numero,

              titulo:
                resultado.titulo,

              url:
                resultado.url,
            })
          );

      return {
        success: true,

        fonte: "Tavily",

        tipo,

        consulta:
          data.query || consulta,

        resumo:
          data.answer || null,

        resultados,

        fontes,
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