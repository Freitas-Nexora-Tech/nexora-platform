import OpenAI from "openai";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  nexoraTools,
  nexoraToolDefinitions,
} from "@/lib/ai/tools";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const instrucoesNexora = (
  nomeEmpresa: string,
  descricaoEmpresa: string,
  contextoEmpresa: string
) => `
És a Nexora AI, o assistente inteligente da Nexora Tech.

Estás a ajudar a empresa:
${nomeEmpresa}

Descrição da empresa:
${descricaoEmpresa}

=== CONHECIMENTO OFICIAL ===

${contextoEmpresa}

=== FIM DO CONHECIMENTO ===

REGRAS:

1. Responde sempre em português de Portugal.

2. Usa o conhecimento oficial da empresa quando a pergunta
   estiver relacionada com a empresa.

3. Nunca inventes informações sobre a empresa.

4. Se não tiveres uma informação disponível, diz claramente
   que não tens essa informação.

5. Podes responder a perguntas gerais sobre tecnologia,
   inteligência artificial, software, automação e outros
   assuntos gerais.

6. Quando a pergunta exigir informação atual, recente,
   externa ou que possa ter mudado, utiliza a ferramenta
   adequada.

7. Quando utilizares a ferramenta web_search, baseia a
   resposta nos resultados encontrados.

8. Nunca inventes fontes, títulos, nomes de sites ou URLs.

9. Quando utilizares a web_search, podes mencionar as fontes
   relevantes na resposta, mas não precisas de escrever
   URLs diretamente no texto.

10. As fontes reais da pesquisa serão apresentadas pela
    aplicação separadamente da resposta.

11. Se os resultados forem insuficientes, diz claramente
    que não foi possível encontrar informação suficiente.

12. Mantém o contexto da conversa.

13. Responde de forma profissional, clara e natural.
`;

type FontePesquisa = {
  numero: number;
  titulo: string;
  url: string;
};

export async function POST(request: Request) {
  try {
    const { mensagens, conversationId } =
      await request.json();

    if (
      !Array.isArray(mensagens) ||
      mensagens.length === 0
    ) {
      return Response.json(
        {
          error:
            "A conversa não contém mensagens.",
        },
        { status: 400 }
      );
    }

    const supabase =
      await createSupabaseServerClient();

    // Utilizador autenticado
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json(
        {
          error:
            "É necessário iniciar sessão.",
        },
        { status: 401 }
      );
    }

    // Empresa associada ao utilizador
    const {
      data: membro,
      error: membroError,
    } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (membroError || !membro) {
      console.error(
        "Erro ao encontrar associação:",
        membroError
      );

      return Response.json(
        {
          error:
            "A sua conta não está associada a nenhuma empresa.",
        },
        { status: 403 }
      );
    }

    // Empresa
    const {
      data: empresa,
      error: empresaError,
    } = await supabase
      .from("companies")
      .select("id, name, description")
      .eq("id", membro.company_id)
      .single();

    if (empresaError || !empresa) {
      console.error(
        "Erro ao encontrar empresa:",
        empresaError
      );

      return Response.json(
        {
          error:
            "Não foi possível encontrar a empresa.",
        },
        { status: 404 }
      );
    }

    // Conhecimento da empresa
    const {
      data: conhecimentos,
      error: conhecimentoError,
    } = await supabase
      .from("company_knowledge")
      .select(
        "empresa, descricao, servicos, produtos, informacoes"
      )
      .eq("company_id", empresa.id);

    if (conhecimentoError) {
      console.error(
        "Erro ao obter conhecimento:",
        conhecimentoError
      );

      return Response.json(
        {
          error:
            "Não foi possível obter o conhecimento da empresa.",
        },
        { status: 500 }
      );
    }

    const contextoEmpresa =
      conhecimentos &&
      conhecimentos.length > 0
        ? conhecimentos
            .map(
              (conhecimento) => `
Empresa: ${conhecimento.empresa || ""}
Descrição: ${conhecimento.descricao || ""}
Serviços: ${conhecimento.servicos || ""}
Produtos: ${conhecimento.produtos || ""}
Informações adicionais: ${conhecimento.informacoes || ""}
`
            )
            .join("\n")
        : "Não existe conhecimento registado para esta empresa.";

    // Criar ou recuperar conversa
    let conversaId = conversationId;

    if (!conversaId) {
      const primeiraPergunta =
        mensagens.find(
          (mensagem: {
            role: "user" | "assistant";
            content: string;
          }) =>
            mensagem.role === "user"
        )?.content ||
        "Nova conversa";

      const titulo =
        primeiraPergunta.length > 60
          ? `${primeiraPergunta.substring(
              0,
              60
            )}...`
          : primeiraPergunta;

      const {
        data: novaConversa,
        error: conversaError,
      } = await supabase
        .from("conversations")
        .insert({
          company_id: empresa.id,
          user_id: user.id,
          title: titulo,
        })
        .select("id")
        .single();

      if (
        conversaError ||
        !novaConversa
      ) {
        console.error(
          "Erro ao criar conversa:",
          conversaError
        );

        return Response.json(
          {
            error:
              "Não foi possível criar a conversa.",
          },
          { status: 500 }
        );
      }

      conversaId = novaConversa.id;
    }

    // Guardar pergunta
    const ultimaMensagem =
      mensagens[mensagens.length - 1];

    if (
      ultimaMensagem?.role === "user"
    ) {
      const {
        error: mensagemUserError,
      } = await supabase
        .from("conversation_messages")
        .insert({
          conversation_id: conversaId,
          role: "user",
          content:
            ultimaMensagem.content,
        });

      if (mensagemUserError) {
        console.error(
          "Erro ao guardar pergunta:",
          mensagemUserError
        );

        return Response.json(
          {
            error:
              "Não foi possível guardar a pergunta.",
          },
          { status: 500 }
        );
      }
    }

    const inputMensagens =
      mensagens.map(
        (mensagem: {
          role:
            | "user"
            | "assistant";
          content: string;
        }) => ({
          role: mensagem.role,
          content: mensagem.content,
        })
      );

    let resposta =
      await openai.responses.create({
        model: "gpt-5-mini",

        tools:
          nexoraToolDefinitions,

        instructions:
          instrucoesNexora(
            empresa.name,
            empresa.description || "",
            contextoEmpresa
          ),

        input:
          inputMensagens,
      });

    const chamadasFerramentas =
      resposta.output.filter(
        (item) =>
          item.type ===
          "function_call"
      );

    const fontes: FontePesquisa[] = [];

    if (
      chamadasFerramentas.length > 0
    ) {
      const resultadosFerramentas = [];

      for (const chamada of chamadasFerramentas) {
        const ferramenta =
          nexoraTools.find(
            (tool) =>
              tool.name ===
              chamada.name
          );

        if (!ferramenta) {
          resultadosFerramentas.push({
            type:
              "function_call_output" as const,
            call_id:
              chamada.call_id,
            output:
              JSON.stringify({
                success: false,
                error:
                  `Ferramenta não encontrada: ${chamada.name}`,
              }),
          });

          continue;
        }

        try {
          const argumentos =
            JSON.parse(
              chamada.arguments
            );

          const resultado =
            await ferramenta.execute(
              argumentos,
              {
                userId: user.id,
                companyId:
                  empresa.id,
              }
            );

          // Guardar fontes reais da pesquisa
          if (
            chamada.name ===
              "web_search" &&
            resultado &&
            typeof resultado ===
              "object"
          ) {
            const resultadoPesquisa =
              resultado as {
                fontes?: FontePesquisa[];
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
            type:
              "function_call_output" as const,
            call_id:
              chamada.call_id,
            output:
              JSON.stringify(
                resultado
              ),
          });
        } catch (erro) {
          console.error(
            `Erro ao executar ferramenta ${chamada.name}:`,
            erro
          );

          resultadosFerramentas.push({
            type:
              "function_call_output" as const,
            call_id:
              chamada.call_id,
            output:
              JSON.stringify({
                success: false,
                error:
                  "Não foi possível executar a ferramenta.",
              }),
          });
        }
      }

      resposta =
        await openai.responses.create({
          model: "gpt-5-mini",

          tools:
            nexoraToolDefinitions,

          instructions:
            instrucoesNexora(
              empresa.name,
              empresa.description ||
                "",
              contextoEmpresa
            ),

          previous_response_id:
            resposta.id,

          input:
            resultadosFerramentas,
        });
    }

    const textoResposta =
      resposta.output_text;

    // Remover fontes duplicadas
    const fontesUnicas =
      fontes.filter(
        (fonte, index, array) =>
          index ===
          array.findIndex(
            (item) =>
              item.url ===
              fonte.url
          )
      );

    // Guardar resposta da IA
    const {
      error: mensagemAIError,
    } = await supabase
      .from(
        "conversation_messages"
      )
      .insert({
        conversation_id:
          conversaId,
        role: "assistant",
        content:
          textoResposta,
      });

    if (mensagemAIError) {
      console.error(
        "Erro ao guardar resposta da IA:",
        mensagemAIError
      );

      return Response.json(
        {
          error:
            "Não foi possível guardar a resposta da IA.",
        },
        { status: 500 }
      );
    }

    // Atualizar conversa
    await supabase
      .from("conversations")
      .update({
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        conversaId
      );

    return Response.json({
      resposta:
        textoResposta,

      conversationId:
        conversaId,

      fontes:
        fontesUnicas,
    });
  } catch (error) {
    console.error(
      "Erro na Nexora AI:",
      error
    );

    return Response.json(
      {
        error:
          "Não foi possível obter uma resposta da Nexora AI.",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request
) {
  try {
    const supabase =
      await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json(
        {
          error:
            "É necessário iniciar sessão.",
        },
        { status: 401 }
      );
    }

    const url =
      new URL(request.url);

    const conversationId =
      url.searchParams.get(
        "conversationId"
      );

    if (!conversationId) {
      return Response.json(
        {
          error:
            "Conversa não especificada.",
        },
        { status: 400 }
      );
    }

    const {
      data: membro,
      error: membroError,
    } = await supabase
      .from("company_members")
      .select("company_id")
      .eq(
        "user_id",
        user.id
      )
      .limit(1)
      .single();

    if (
      membroError ||
      !membro
    ) {
      return Response.json(
        {
          error:
            "A sua conta não está associada a nenhuma empresa.",
        },
        { status: 403 }
      );
    }

    const {
      data: conversa,
      error: conversaError,
    } = await supabase
      .from("conversations")
      .select(
        "id, title, company_id"
      )
      .eq(
        "id",
        conversationId
      )
      .eq(
        "company_id",
        membro.company_id
      )
      .single();

    if (
      conversaError ||
      !conversa
    ) {
      return Response.json(
        {
          error:
            "Conversa não encontrada.",
        },
        { status: 404 }
      );
    }

    const {
      data: mensagens,
      error: mensagensError,
    } = await supabase
      .from(
        "conversation_messages"
      )
      .select(
        "id, role, content, created_at"
      )
      .eq(
        "conversation_id",
        conversa.id
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      );

    if (mensagensError) {
      return Response.json(
        {
          error:
            "Não foi possível carregar as mensagens.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      conversa,
      mensagens,
    });
  } catch (error) {
    console.error(
      "Erro ao carregar conversa:",
      error
    );

    return Response.json(
      {
        error:
          "Não foi possível carregar a conversa.",
      },
      { status: 500 }
    );
  }
}