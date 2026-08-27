import OpenAI from "openai";
import {
  nexoraTools,
  nexoraToolDefinitions,
} from "@/lib/ai/tools";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_PERGUNTAS = 3;
const COOKIE_NAME = "nexora_demo_questions";

const ferramentasDemo = new Set([
  "calculator",
  "currency",
  "time",
  "weather",
  "web_search",
]);

const definicoesFerramentasDemo =
  nexoraToolDefinitions.filter((tool) =>
    ferramentasDemo.has(tool.name)
  );

const instrucoesDemo = `
És a Nexora AI, o assistente inteligente da Nexora Tech.

Estás numa demonstração pública da Nexora AI.

A tua função é demonstrar a capacidade real da Nexora AI para
ajudar pessoas e empresas.

REGRAS:

1. Responde sempre em português de Portugal.

2. Responde de forma profissional, clara, útil e natural.

3. Podes responder a perguntas gerais sobre tecnologia,
inteligência artificial, automação, software, produtividade,
negócios e transformação digital.

4. Utiliza as ferramentas disponíveis quando forem necessárias.

5. Para informação atual, recente ou que possa ter mudado,
utiliza web_search.

6. Para cálculos matemáticos utiliza calculator.

7. Para conversões ou taxas de câmbio utiliza currency.

8. Para horas e fusos horários utiliza time.

9. Para meteorologia atual utiliza weather.

10. Não inventes informações.

11. Não tens acesso a dados privados de empresas ou clientes.

12. Não tens acesso a documentos, knowledge bases, conversas,
contas ou informações internas dos utilizadores.

13. Nunca peças nem tentes obter dados privados através das
ferramentas.

14. A demonstração deve representar de forma realista a
experiência da Nexora AI.

15. Quando uma pergunta não exigir uma ferramenta, responde
diretamente.

16. Mantém as respostas úteis e relativamente concisas.

17. Não sejas excessivamente comercial. Ajuda primeiro o visitante
e apresenta a Nexora naturalmente quando for relevante.

18. Quando utilizares web_search, baseia a resposta nos resultados
obtidos pela pesquisa e não inventes fontes.
`;

function obterPerguntasUsadas(request: Request): number {
  const cookieHeader = request.headers.get("cookie") || "";

  const match = cookieHeader.match(
    new RegExp(`${COOKIE_NAME}=([^;]+)`)
  );

  if (!match) {
    return 0;
  }

  const valor = Number.parseInt(match[1], 10);

  if (!Number.isFinite(valor) || valor < 0) {
    return 0;
  }

  return Math.min(valor, MAX_PERGUNTAS);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const mensagem =
      typeof body?.mensagem === "string"
        ? body.mensagem.trim()
        : "";

    if (!mensagem) {
      return Response.json(
        {
          error: "Escreva uma pergunta.",
        },
        { status: 400 }
      );
    }

    if (mensagem.length > 2000) {
      return Response.json(
        {
          error: "A pergunta é demasiado longa.",
        },
        { status: 400 }
      );
    }

    const perguntasUsadas =
      obterPerguntasUsadas(request);

    if (perguntasUsadas >= MAX_PERGUNTAS) {
      return Response.json(
        {
          error:
            "Já utilizaste as 3 perguntas gratuitas. Cria uma conta para continuar.",
          perguntasRestantes: 0,
        },
        { status: 403 }
      );
    }

    let resposta = await openai.responses.create({
      model: "gpt-5-mini",
      tools: definicoesFerramentasDemo,
      instructions: instrucoesDemo,
      input: mensagem,
    });

    const fontes: {
      numero?: number;
      titulo?: string;
      url?: string;
    }[] = [];

    /*
     * Permite várias rondas de ferramentas.
     * Normalmente uma ou duas são suficientes, mas mantemos
     * um limite para evitar ciclos infinitos.
     */
    for (let rodada = 0; rodada < 3; rodada++) {
      const chamadasFerramentas = resposta.output.filter(
        (item) => item.type === "function_call"
      );

      if (chamadasFerramentas.length === 0) {
        break;
      }

      const resultadosFerramentas = [];

      for (const chamada of chamadasFerramentas) {
        if (!ferramentasDemo.has(chamada.name)) {
          resultadosFerramentas.push({
            type: "function_call_output" as const,
            call_id: chamada.call_id,
            output: JSON.stringify({
              success: false,
              error:
                "Esta ferramenta não está disponível na demonstração.",
            }),
          });

          continue;
        }

        const ferramenta = nexoraTools.find(
          (tool) => tool.name === chamada.name
        );

        if (!ferramenta) {
          resultadosFerramentas.push({
            type: "function_call_output" as const,
            call_id: chamada.call_id,
            output: JSON.stringify({
              success: false,
              error: "Ferramenta não encontrada.",
            }),
          });

          continue;
        }

        try {
          const argumentos = JSON.parse(
            chamada.arguments
          );

          const resultado =
            await ferramenta.execute(argumentos, {
              userId: "demo",
              companyId: "demo",
            });

          /*
           * Guardar fontes reais provenientes da pesquisa web.
           */
          if (
            chamada.name === "web_search" &&
            resultado &&
            typeof resultado === "object"
          ) {
            const resultadoPesquisa =
              resultado as {
                fontes?: {
                  numero?: number;
                  titulo?: string;
                  url?: string;
                }[];
              };

            if (
              Array.isArray(
                resultadoPesquisa.fontes
              )
            ) {
              fontes.push(
                ...resultadoPesquisa.fontes
              );
            }
          }

          resultadosFerramentas.push({
            type: "function_call_output" as const,
            call_id: chamada.call_id,
            output: JSON.stringify(resultado),
          });
        } catch (error) {
          console.error(
            `Erro na ferramenta ${chamada.name}:`,
            error
          );

          resultadosFerramentas.push({
            type: "function_call_output" as const,
            call_id: chamada.call_id,
            output: JSON.stringify({
              success: false,
              error:
                "Não foi possível executar esta ferramenta.",
            }),
          });
        }
      }

      resposta = await openai.responses.create({
        model: "gpt-5-mini",
        tools: definicoesFerramentasDemo,
        instructions: instrucoesDemo,
        previous_response_id: resposta.id,
        input: resultadosFerramentas,
      });
    }

    const novasPerguntasUsadas =
      perguntasUsadas + 1;

    const perguntasRestantes =
      MAX_PERGUNTAS - novasPerguntasUsadas;

    return new Response(
      JSON.stringify({
        resposta: resposta.output_text || "",
        perguntasRestantes,
        fontes,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie":
            `${COOKIE_NAME}=${novasPerguntasUsadas}; Path=/; Max-Age=86400; HttpOnly; SameSite=Lax`,
        },
      }
    );
  } catch (error) {
    console.error(
      "Erro na Nexora AI Demo:",
      error
    );

    return Response.json(
      {
        error:
          "Não foi possível obter uma resposta neste momento.",
      },
      { status: 500 }
    );
  }
}