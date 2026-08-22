import type { NexoraTool } from "./index";

type FrankfurterRate = {
  date?: string;
  base?: string;
  quote?: string;
  rate?: number;
};

export const currencyTool: NexoraTool = {
  name: "currency",

  description:
    "Consulta taxas de câmbio de referência e converte valores entre moedas. Use esta ferramenta quando o utilizador perguntar por câmbios, conversões entre moedas ou cotação de uma moeda. As taxas são taxas de referência do BCE e não cotações de mercado em tempo real.",

  parameters: {
    type: "object",

    properties: {
      valor: {
        type: "number",
        description:
          "Valor numérico a converter. Use 1 quando o utilizador perguntar apenas pela cotação.",
      },

      moeda_origem: {
        type: "string",
        description:
          "Código ISO 4217 da moeda de origem, por exemplo EUR, USD ou GBP.",
      },

      moeda_destino: {
        type: "string",
        description:
          "Código ISO 4217 da moeda de destino, por exemplo EUR, USD ou GBP.",
      },
    },

    required: [
      "valor",
      "moeda_origem",
      "moeda_destino",
    ],

    additionalProperties: false,
  },

  async execute(arguments_) {
    const valor = arguments_.valor;
    const moedaOrigem = arguments_.moeda_origem;
    const moedaDestino = arguments_.moeda_destino;

    if (
      typeof valor !== "number" ||
      !Number.isFinite(valor)
    ) {
      return {
        success: false,
        error: "O valor indicado não é válido.",
      };
    }

    if (
      typeof moedaOrigem !== "string" ||
      typeof moedaDestino !== "string"
    ) {
      return {
        success: false,
        error: "É necessário indicar as duas moedas.",
      };
    }

    const origem = moedaOrigem.trim().toUpperCase();
    const destino = moedaDestino.trim().toUpperCase();

    if (
      !/^[A-Z]{3}$/.test(origem) ||
      !/^[A-Z]{3}$/.test(destino)
    ) {
      return {
        success: false,
        error:
          "As moedas devem utilizar códigos ISO de três letras, como EUR, USD ou GBP.",
      };
    }

    if (origem === destino) {
      return {
        success: true,
        valor,
        moeda_origem: origem,
        moeda_destino: destino,
        taxa: 1,
        resultado: valor,
        data: new Date().toISOString().slice(0, 10),
        fonte: "Frankfurter / Banco Central Europeu",
        observacao:
          "A mesma moeda foi utilizada na origem e no destino.",
      };
    }

    try {
      const url = new URL(
        "https://api.frankfurter.dev/v2/rates"
      );

      url.searchParams.set("base", origem);
      url.searchParams.set("quotes", destino);

      const response = await fetch(url.toString(), {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        console.error(
          "Erro Frankfurter:",
          response.status,
          await response.text()
        );

        return {
          success: false,
          error:
            "Não foi possível obter a taxa de câmbio.",
        };
      }

      const data =
        (await response.json()) as FrankfurterRate[];

      if (!Array.isArray(data) || data.length === 0) {
        return {
          success: false,
          error:
            "A API de câmbio não devolveu uma taxa válida.",
        };
      }

      const cotacao = data.find(
        (item) =>
          item.base === origem &&
          item.quote === destino
      );

      if (
        !cotacao ||
        typeof cotacao.rate !== "number" ||
        !Number.isFinite(cotacao.rate)
      ) {
        return {
          success: false,
          error:
            `Não foi encontrada uma taxa para ${origem}/${destino}.`,
        };
      }

      const taxa = cotacao.rate;
      const resultado = valor * taxa;

      return {
        success: true,

        valor,

        moeda_origem: origem,

        moeda_destino: destino,

        taxa,

        resultado,

        data: cotacao.date || null,

        fonte:
          "Frankfurter / Banco Central Europeu",

        observacao:
          "Taxa de referência do BCE, não uma cotação de mercado em tempo real.",
      };
    } catch (error) {
      console.error(
        "Erro na ferramenta currency:",
        error
      );

      return {
        success: false,
        error:
          "Não foi possível consultar a taxa de câmbio neste momento.",
      };
    }
  },
};