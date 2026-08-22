import type { NexoraTool } from "./index";

export const timeTool: NexoraTool = {
  name: "time",

  description:
    "Obtém a hora atual numa cidade ou fuso horário. Use esta ferramenta quando o utilizador perguntar que horas são numa determinada cidade, país ou região, ou quando precisar de comparar horários entre locais.",

  parameters: {
    type: "object",

    properties: {
      timezone: {
        type: "string",
        description:
          "Fuso horário IANA do local. Exemplos: Europe/Lisbon, Europe/London, America/New_York, America/Sao_Paulo, Asia/Tokyo.",
      },

      local: {
        type: "string",
        description:
          "Nome do local solicitado pelo utilizador, por exemplo Lisboa, Londres, Nova Iorque ou Tóquio.",
      },
    },

    required: ["timezone", "local"],

    additionalProperties: false,
  },

  async execute(arguments_) {
    const timezone = arguments_.timezone;
    const local = arguments_.local;

    if (
      typeof timezone !== "string" ||
      !timezone.trim()
    ) {
      return {
        success: false,
        error:
          "É necessário indicar o fuso horário.",
      };
    }

    if (
      typeof local !== "string" ||
      !local.trim()
    ) {
      return {
        success: false,
        error:
          "É necessário indicar o local.",
      };
    }

    try {
      const agora = new Date();

      const partes = new Intl.DateTimeFormat(
        "pt-PT",
        {
          timeZone: timezone,
          dateStyle: "full",
          timeStyle: "long",
        }
      ).formatToParts(agora);

      const obterParte = (tipo: string) =>
        partes.find(
          (parte) => parte.type === tipo
        )?.value;

      const hora = obterParte("hour");
      const minuto = obterParte("minute");
      const segundo = obterParte("second");

      const data = partes
        .filter(
          (parte) =>
            ["weekday", "day", "month", "year"].includes(
              parte.type
            )
        )
        .map((parte) => parte.value)
        .join(" ");

      return {
        success: true,

        local: local.trim(),

        timezone: timezone.trim(),

        hora: `${hora}:${minuto}:${segundo}`,

        data,

        iso: agora.toISOString(),

        fonte:
          "Relógio do sistema e fuso horário IANA",

        observacao:
          "A hora foi calculada utilizando o fuso horário oficial indicado.",
      };
    } catch (error) {
      console.error(
        "Erro na ferramenta time:",
        error
      );

      return {
        success: false,
        error:
          `Não foi possível obter a hora para o fuso horário "${timezone}".`,
      };
    }
  },
};