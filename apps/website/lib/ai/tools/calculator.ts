import type { NexoraTool } from "./index";

export const calculatorTool: NexoraTool = {
  name: "calculator",

  description:
    "Executa cálculos matemáticos com precisão. Use esta ferramenta para operações aritméticas, percentagens, multiplicações, divisões, potências e expressões matemáticas. Não tente calcular mentalmente quando a ferramenta puder ser utilizada.",

  parameters: {
    type: "object",
    properties: {
      expressao: {
        type: "string",
        description:
          "Expressão matemática a calcular. Use apenas números, parênteses e operadores matemáticos como +, -, *, / e **.",
      },
    },
    required: ["expressao"],
    additionalProperties: false,
  },

  async execute(arguments_) {
    const expressao = arguments_.expressao;

    if (
      typeof expressao !== "string" ||
      !expressao.trim()
    ) {
      return {
        success: false,
        error: "É necessário indicar uma expressão matemática.",
      };
    }

    const expressaoLimpa = expressao
      .replace(/\s+/g, "")
      .replace(/,/g, ".");

    // Permitir apenas números e operadores matemáticos seguros
    if (
      !/^[0-9+\-*/().%]+$/.test(
        expressaoLimpa
      )
    ) {
      return {
        success: false,
        error:
          "A expressão contém caracteres não permitidos.",
      };
    }

    try {
      const expressaoComPercentagens =
        expressaoLimpa.replace(
          /(\d+(?:\.\d+)?)%/g,
          "($1/100)"
        );

      // A expressão já foi validada para conter
      // apenas números e operadores matemáticos.
      const resultado = Function(
        `"use strict"; return (${expressaoComPercentagens})`
      )();

      if (
        typeof resultado !== "number" ||
        !Number.isFinite(resultado)
      ) {
        return {
          success: false,
          error:
            "Não foi possível obter um resultado matemático válido.",
        };
      }

      return {
        success: true,
        expressao: expressao,
        resultado,
      };
    } catch (error) {
      console.error(
        "Erro na calculadora:",
        error
      );

      return {
        success: false,
        error:
          "Não foi possível calcular esta expressão.",
      };
    }
  },
};
