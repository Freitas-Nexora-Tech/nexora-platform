import OpenAI from "openai";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  nexoraTools,
  nexoraToolDefinitions,
} from "@/lib/ai/tools";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const NEXORA_BOOKING_PRODUCT_ID =
  "165ea020-af05-447a-a21e-1ef91f88b68e";

const BOOKING_AI_CAMPAIGN_CODE =
  "BOOKING-AI-2M";

const instrucoesNexora = (
  nomeEmpresa: string,
  descricaoEmpresa: string,
  contextoEmpresa: string,
  contextoDocumentos: string
) => `
És a Nexora AI, o assistente inteligente da Nexora Tech.

Estás a ajudar a empresa:
${nomeEmpresa}

Descrição da empresa:
${descricaoEmpresa}

=== CONHECIMENTO OFICIAL ===

${contextoEmpresa}

=== DOCUMENTOS DA EMPRESA ===

${contextoDocumentos}

=== FIM DO CONHECIMENTO ===

REGRAS:

1. Responde sempre em português de Portugal.

2. Usa o conhecimento oficial da empresa quando a pergunta
   estiver relacionada com a empresa.

3. Usa também o conteúdo dos documentos da empresa quando
   a pergunta estiver relacionada com esse conteúdo.

4. Nunca inventes informações sobre a empresa ou sobre os
   documentos.

5. Se não tiveres uma informação disponível no conhecimento
   oficial ou nos documentos, diz claramente que não tens
   essa informação.

6. Podes responder a perguntas gerais sobre tecnologia,
   inteligência artificial, software, automação e outros
   assuntos gerais.

7. Quando a pergunta exigir informação atual, recente,
   externa ou que possa ter mudado, utiliza a ferramenta
   adequada.

8. Quando utilizares a ferramenta web_search, baseia a
   resposta nos resultados encontrados.

9. Nunca inventes fontes, títulos, nomes de sites ou URLs.

10. Quando utilizares a web_search, podes mencionar as fontes
    relevantes na resposta, mas não precisas de escrever
    URLs diretamente no texto.

11. As fontes reais da pesquisa serão apresentadas pela
    aplicação separadamente da resposta.

12. Se os resultados forem insuficientes, diz claramente
    que não foi possível encontrar informação suficiente.

13. Mantém o contexto da conversa.

14. Responde de forma profissional, clara e natural.

15. Quando responderes com base num documento, não afirmes
    que consultaste informação que não esteja realmente
    presente no conteúdo disponibilizado.

16. Se existirem informações diferentes entre documentos,
    não escolhas uma delas arbitrariamente. Explica que os
    documentos apresentam informações diferentes.

17. Quando o utilizador perguntar sobre os serviços disponíveis
    para marcação, utiliza a ferramenta booking_listar_servicos.
    Não inventes serviços de Booking com base no conhecimento
    da empresa.

18. Quando o utilizador escolher ou perguntar por profissionais
    que realizam um determinado serviço, utiliza a ferramenta
    booking_listar_profissionais e fornece o servico_id correto.

19. Quando o utilizador indicar um serviço, um profissional e
    uma data para marcação, utiliza a ferramenta
    booking_listar_horarios para consultar os horários realmente
    disponíveis.

20. Os dados devolvidos pelas ferramentas de Booking são dados
    reais do sistema e devem ter prioridade sobre informações
    genéricas existentes no conhecimento da empresa.

21. Nunca inventes horários, profissionais ou serviços de Booking.

22. Quando uma ferramenta de Booking devolver uma lista vazia,
    informa claramente o utilizador de que não existem opções
    disponíveis para os critérios indicados.

  23. Quando o utilizador quiser marcar um serviço, podes conduzir
      o processo de marcação utilizando as ferramentas de Booking
      disponíveis. Não confundas uma consulta de disponibilidade com
      uma marcação efetiva.

  24. Antes de criares uma proposta de marcação, confirma que tens
      uma combinação concreta de serviço, profissional, data e hora.
      Se faltar algum destes dados, utiliza as ferramentas de Booking
      para os obter ou pergunta ao utilizador o que falta.

  25. Para criar uma proposta de marcação, utiliza a ferramenta
      booking_criar_proposta apenas quando o utilizador estiver
      efetivamente a pedir para marcar e já existir uma opção concreta
      de serviço, profissional, data e hora.

  26. Para a marcação também são necessários os dados do cliente:
      nome, email e telefone. Se algum destes dados ainda não estiver
      disponível, pede-o ao utilizador antes de criares a proposta.
      Não inventes dados pessoais.

  27. Depois de criares uma proposta com sucesso, apresenta ao
      utilizador um resumo claro da marcação, incluindo serviço,
      profissional, data, hora, duração e preço, e pede confirmação
      explícita antes de avançar.

  28. Nunca utilizes booking_confirmar_proposta apenas porque existe
      uma proposta pendente. A existência de uma proposta NÃO significa
      que o utilizador a confirmou.

  29. Só utiliza booking_confirmar_proposta quando a mensagem atual
      do utilizador for uma confirmação explícita e inequívoca da
      proposta apresentada imediatamente antes, por exemplo:
      "sim", "confirmo", "pode marcar", "pode avançar", "pode confirmar".
      Se houver qualquer dúvida sobre o que o utilizador está a
      confirmar, pede esclarecimento em vez de confirmar.

  30. Se o utilizador alterar o serviço, profissional, data ou hora
      depois de uma proposta ter sido criada, não confirmes a proposta
      anterior. Consulta novamente a disponibilidade e cria uma nova
      proposta para a nova escolha.

  31. Se a ferramenta de confirmação indicar que a proposta expirou,
      ficou indisponível ou deixou de ser válida, não afirmes que a
      marcação foi realizada. Consulta novamente os horários disponíveis
      e conduz o utilizador para uma nova proposta.

  32. Considera uma marcação concluída apenas quando
      booking_confirmar_proposta devolver explicitamente sucesso.
      Nunca afirmes que uma marcação foi criada apenas porque uma
      proposta foi criada.

  33. Quando estiveres a conduzir uma consulta ou marcação de Booking,
      mantém o contexto das escolhas feitas pelo utilizador e utiliza
      os IDs devolvidos pelas ferramentas nas chamadas seguintes.

  34. Nunca apresentes ao utilizador IDs internos, UUIDs, IDs de
      serviços, IDs de profissionais, IDs de empresas, IDs de propostas
      ou outros identificadores técnicos devolvidos pelas ferramentas.

  35. Os IDs devolvidos pelas ferramentas de Booking devem ser
      utilizados apenas internamente para realizar as chamadas
      seguintes. Ao comunicar os resultados ao utilizador, apresenta
      apenas informações úteis e compreensíveis, como nome, descrição,
      duração, preço, profissional, data e horário.

  36. Não peças ao utilizador para fornecer um ID de serviço,
      profissional ou proposta. Utiliza internamente os IDs devolvidos
      pelas ferramentas.

  37. Quando o utilizador perguntar pelos profissionais de um
      serviço pelo nome, identifica internamente o respetivo
      servico_id e utiliza a ferramenta booking_listar_profissionais
      sem pedir o ID ao utilizador.

  38. Quando o utilizador indicar um profissional pelo nome e uma
      data, utiliza internamente o profissional_id correspondente
      obtido anteriormente e consulta os horários disponíveis sem
      pedir IDs ao utilizador.

  39. Quando o utilizador perguntar apenas por serviços, profissionais
      ou horários, não cries propostas. Usa apenas as ferramentas de
      consulta necessárias para responder.

  40. Os dados reais devolvidos pelas ferramentas de Booking têm
      prioridade sobre qualquer informação genérica existente no
      conhecimento da empresa, inclusive durante o processo de
      criação e confirmação de uma marcação.
      `;


function isExplicitBookingConfirmation(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.!?]+$/g, "")
    .trim();

  const confirmations = new Set([
    "sim",
    "sim confirmo",
    "sim, confirmo",
    "confirmo",
    "confirmado",
    "esta confirmado",
    "pode marcar",
    "pode confirmar",
    "pode avancar",
    "pode prosseguir",
    "pode fazer a marcacao",
    "pode criar",
    "avanca",
    "confirmar",
  ]);

  return confirmations.has(normalized);
}

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

    // Estado da Nexora AI
    const {
      data: subscricao,
      error: subscricaoError,
    } = await supabase
      .from("company_subscriptions")
      .select("ai_enabled")
      .eq("company_id", empresa.id)
      .maybeSingle();

    if (subscricaoError) {
      console.error(
        "Erro ao verificar estado da IA:",
        subscricaoError
      );

      return Response.json(
        {
          error:
            "Não foi possível verificar o estado da Nexora AI.",
        },
        { status: 500 }
      );
    }

    // IA suspensa pelo administrador.
    // Esta verificação tem SEMPRE prioridade,
    // incluindo empresas com campanha Booking.
    if (subscricao && subscricao.ai_enabled === false) {
      return Response.json(
        {
          error:
            "A Nexora AI está temporariamente suspensa para esta empresa. Contacte o administrador da conta.",
          ai_enabled: false,
        },
        { status: 403 }
      );
    }

    // Verificar campanha Nexora Booking + Nexora AI
    const {
      data: campanhaBooking,
      error: campanhaError,
    } = await supabase
      .from("product_subscriptions")
      .select(
        "id, product_id, campaign_code, campaign_started_at, campaign_ends_at, status, ai_suspended"
      )
      .eq("company_id", empresa.id)
      .eq(
        "product_id",
        NEXORA_BOOKING_PRODUCT_ID
      )
      .eq(
        "campaign_code",
        BOOKING_AI_CAMPAIGN_CODE
      )
      .in("status", ["trial", "active"])
      .maybeSingle();

    if (campanhaError) {
      console.error(
        "Erro ao verificar campanha Booking:",
        campanhaError
      );

      return Response.json(
        {
          error:
            "Não foi possível verificar os benefícios do Nexora Booking.",
        },
        { status: 500 }
      );
    }

    const agora = new Date();

    const campanhaAIAtiva =
      campanhaBooking &&
      campanhaBooking.campaign_started_at &&
      campanhaBooking.campaign_ends_at &&
      new Date(
        campanhaBooking.campaign_started_at
      ) <= agora &&
      new Date(
        campanhaBooking.campaign_ends_at
      ) >= agora;

    const aiDisponivelPorCampanha =
      Boolean(
        campanhaAIAtiva &&
        campanhaBooking?.ai_suspended !== true
      );

    /*
     * REGRA DE ACESSO À NEXORA AI
     *
     * 1. Uma subscrição AI normal permite acesso.
     * 2. Uma campanha Booking válida permite acesso.
     * 3. Uma subscrição AI suspensa bloqueia sempre.
     * 4. Sem subscrição AI e sem campanha válida,
     *    o acesso é bloqueado.
     */

    const temSubscricaoAI =
      Boolean(subscricao);

    const aiDisponivel =
      temSubscricaoAI ||
      aiDisponivelPorCampanha;

    if (!aiDisponivel) {
      return Response.json(
        {
          error:
            "A Nexora AI não está disponível para esta empresa. É necessário ter uma subscrição Nexora AI ativa ou beneficiar de uma campanha válida.",
          ai_enabled: false,
          ai_via_booking_campaign: false,
        },
        { status: 403 }
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

    // Documentos da empresa
    const {
      data: documentos,
      error: documentosError,
    } = await supabase
      .from("company_documents")
      .select(
        "id, file_name, extracted_text"
      )
      .eq("company_id", empresa.id)
      .not(
        "extracted_text",
        "is",
        null
      );

    if (documentosError) {
      console.error(
        "Erro ao obter documentos:",
        documentosError
      );

      return Response.json(
        {
          error:
            "Não foi possível obter os documentos da empresa.",
        },
        { status: 500 }
      );
    }

    const contextoDocumentos =
      documentos &&
        documentos.length > 0
        ? documentos
          .map(
            (documento) => `
=== DOCUMENTO: ${documento.file_name} ===

${documento.extracted_text || ""}

=== FIM DO DOCUMENTO ===
`
          )
          .join("\n")
        : "Não existem documentos com texto extraído para esta empresa.";

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

    /*
     * Confirmação explícita de uma proposta:
     *
     * Quando a última mensagem é uma confirmação inequívoca
     * e a mensagem anterior da IA pediu confirmação, executamos
     * diretamente a ferramenta de confirmação.
     *
     * Assim, uma mensagem como "confirmo" não fica dependente
     * da decisão do modelo de escolher novamente a ferramenta.
     */
    const ultimaMensagemTexto =
      typeof ultimaMensagem?.content === "string"
        ? ultimaMensagem.content
        : "";

    const mensagemAnterior =
      mensagens.length >= 2
        ? mensagens[mensagens.length - 2]
        : null;

    const confirmacaoExplicita =
      ultimaMensagem?.role === "user" &&
      isExplicitBookingConfirmation(
        ultimaMensagemTexto
      );

    const assistentePediuConfirmacao =
      mensagemAnterior?.role === "assistant" &&
      /confirm|marcar|avançar|avancar/i.test(
        mensagemAnterior.content || ""
      );

    if (
      confirmacaoExplicita &&
      assistentePediuConfirmacao
    ) {
      const supabaseAdmin =
        createSupabaseAdminClient();

      const {
        data: propostaPendente,
        error: propostaPendenteError,
      } = await supabaseAdmin
        .from("ai_booking_proposals")
        .select("id")
        .eq(
          "company_id",
          empresa.id
        )
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "conversation_id",
          conversaId
        )
        .eq(
          "estado",
          "pendente"
        )
        .gt(
          "expires_at",
          new Date().toISOString()
        )
        .order(
          "created_at",
          { ascending: false }
        )
        .limit(1)
        .maybeSingle();

      if (propostaPendenteError) {
        console.error(
          "[BOOKING_CONFIRMAR] Erro ao procurar proposta pendente:",
          propostaPendenteError
        );
      } else if (propostaPendente) {
        const ferramentaConfirmacao =
          nexoraTools.find(
            (tool) =>
              tool.name ===
              "booking_confirmar_proposta"
          );

        if (ferramentaConfirmacao) {
          console.log(
            "[BOOKING_CONFIRMAR] CONFIRMAÇÃO EXPLÍCITA DETETADA",
            {
              propostaId:
                propostaPendente.id,
              userId: user.id,
              companyId: empresa.id,
              conversationId: conversaId,
            }
          );

          try {
            const resultadoConfirmacao =
              await ferramentaConfirmacao.execute(
                {
                  proposta_id:
                    propostaPendente.id,
                },
                {
                  userId: user.id,
                  companyId: empresa.id,
                  conversationId:
                    conversaId,
                }
              );

            if (
              resultadoConfirmacao &&
              typeof resultadoConfirmacao ===
                "object" &&
              "success" in resultadoConfirmacao &&
              resultadoConfirmacao.success === true
            ) {
              const resultado =
                resultadoConfirmacao as {
                  success: true;
                  servico?: {
                    nome?: string;
                  };
                  profissional?: {
                    nome?: string;
                  };
                  data?: string;
                  hora?: string;
                  valor?: number | null;
                };

              const dataFormatada =
                resultado.data
                  ? new Intl.DateTimeFormat(
                      "pt-PT",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      }
                    ).format(
                      new Date(
                        `${resultado.data}T12:00:00`
                      )
                    )
                  : "";

              const respostaConfirmacao =
                [
                  "A marcação foi confirmada com sucesso.",
                  resultado.servico?.nome
                    ? `Serviço: ${resultado.servico.nome}.`
                    : null,
                  resultado.profissional?.nome
                    ? `Profissional: ${resultado.profissional.nome}.`
                    : null,
                  dataFormatada
                    ? `Data: ${dataFormatada}.`
                    : null,
                  resultado.hora
                    ? `Hora: ${resultado.hora}.`
                    : null,
                  resultado.valor !==
                    undefined &&
                  resultado.valor !== null
                    ? `Valor: ${Number(
                        resultado.valor
                      ).toFixed(2).replace(".", ",")} €.`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" ");

              const {
                error: mensagemConfirmacaoError,
              } = await supabase
                .from("conversation_messages")
                .insert({
                  conversation_id:
                    conversaId,
                  role: "assistant",
                  content:
                    respostaConfirmacao,
                });

              if (mensagemConfirmacaoError) {
                console.error(
                  "Erro ao guardar confirmação da IA:",
                  mensagemConfirmacaoError
                );

                return Response.json(
                  {
                    error:
                      "A marcação foi realizada, mas não foi possível guardar a resposta da conversa.",
                  },
                  { status: 500 }
                );
              }

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
                  respostaConfirmacao,
                conversationId:
                  conversaId,
                fontes: [],
                ai_enabled: true,
                ai_via_booking_campaign:
                  aiDisponivelPorCampanha,
              });
            }

            console.error(
              "[BOOKING_CONFIRMAR] A confirmação devolveu resultado sem sucesso:",
              resultadoConfirmacao
            );
          } catch (erroConfirmacao) {
            console.error(
              "[BOOKING_CONFIRMAR] Erro na confirmação determinística:",
              erroConfirmacao
            );
          }
        }
      }
    }

    let resposta =
      await openai.responses.create({
        model: "gpt-5-mini",

        tools:
          nexoraToolDefinitions,

        instructions:
          instrucoesNexora(
            empresa.name,
            empresa.description || "",
            contextoEmpresa,
            contextoDocumentos
          ),

        input:
          inputMensagens,
      });

    const fontes: FontePesquisa[] = [];

    /*
     * Executar ferramentas em várias rondas.
     *
     * Isto permite fluxos como:
     * serviço -> profissional -> horários
     * sem limitar a Nexora AI a apenas uma chamada de ferramenta.
     */
    const MAX_RONDAS_FERRAMENTAS = 8;

    for (
      let rondaFerramentas = 0;
      rondaFerramentas < MAX_RONDAS_FERRAMENTAS;
      rondaFerramentas++
    ) {
      const chamadasFerramentas =
        resposta.output.filter(
          (item) =>
            item.type ===
            "function_call"
        );

      if (
        chamadasFerramentas.length === 0
      ) {
        break;
      }

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
                conversationId:
                  conversaId,
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
              contextoEmpresa,
              contextoDocumentos
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

      ai_enabled:
        true,

      ai_via_booking_campaign:
        aiDisponivelPorCampanha,
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