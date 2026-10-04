import OpenAI from "openai";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import {
    nexoraTools,
    nexoraToolDefinitions,
} from "@/lib/ai/tools";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const FERRAMENTAS_BOOKING_PUBLICAS = new Set([
    "booking_listar_servicos",
    "booking_listar_profissionais",
    "booking_listar_horarios",
    "booking_criar_proposta",
    "booking_confirmar_proposta",
]);

const ferramentasPublicas = nexoraTools.filter((tool) =>
    FERRAMENTAS_BOOKING_PUBLICAS.has(tool.name)
);

const definicoesFerramentasPublicas =
    nexoraToolDefinitions.filter((tool) =>
        FERRAMENTAS_BOOKING_PUBLICAS.has(tool.name)
    );

type Mensagem = {
    role: "user" | "assistant";
    content: string;
};

type MensagemRecebida = {
    role: string;
    content: string;
};

function isValidUUID(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value
    );
}

function isMensagemRecebida(
    value: unknown
): value is MensagemRecebida {
    if (
        typeof value !== "object" ||
        value === null
    ) {
        return false;
    }

    const item =
        value as Record<string, unknown>;

    return (
        typeof item.role === "string" &&
        typeof item.content === "string"
    );
}

function normalizarMensagem(
    mensagem: MensagemRecebida
): Mensagem | null {
    const role =
        mensagem.role === "user" ||
            mensagem.role === "assistant"
            ? mensagem.role
            : null;

    const content =
        mensagem.content.trim();

    if (!role || !content) {
        return null;
    }

    return {
        role,
        content,
    };
}

function isExplicitBookingConfirmation(value: string) {
    const normalizado = value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\\u0300-\\u036f]/g, "")
        .replace(/[.!?]+$/g, "")
        .trim();

    return new Set([
        "sim",
        "sim pode",
        "sim pode marcar",
        "sim pode confirmar",
        "confirmo",
        "confirmado",
        "pode marcar",
        "pode confirmar",
        "pode avancar",
        "pode avançar",
        "avanca",
        "avança",
        "avançar",
        "avancar",
        "pode seguir",
        "pode prosseguir",
    ]).has(normalizado);
}

function mensagemIndicaAlteracaoReserva(value: string) {
    const normalizado = value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const indicadores = [
        "afinal",
        "em vez",
        "emvez",
        "alterar",
        "altera",
        "alteracao",
        "mudar",
        "muda",
        "trocar",
        "troca",
        "prefiro",
        "melhor as",
        "quero as",
        "quero para",
        "pode ser as",
        "fica as",
        "fica para",
        "passar para",
    ];

    return indicadores.some((indicador) =>
        normalizado.includes(indicador)
    );
}

function mensagemAnteriorPedeConfirmacao(
    mensagens: Mensagem[]
) {
    const anteriores = mensagens
        .slice(0, -1)
        .reverse();

    const ultimaAssistente = anteriores.find(
        (mensagem) => mensagem.role === "assistant"
    );

    if (!ultimaAssistente) {
        return false;
    }

    const texto = ultimaAssistente.content
        .toLowerCase();

    return (
        texto.includes("confirm") ||
        texto.includes("marcar") ||
        texto.includes("avanç") ||
        texto.includes("avanc") ||
        texto.includes("prosseguir")
    );
}

function criarInstrucoes(
    nomeEmpresa: string,
    descricaoEmpresa: string,
    servicosBooking: string
) {
    return `
És a Nexora AI, o assistente virtual de reservas da empresa ${nomeEmpresa}.

Estás a funcionar na página pública do Nexora Booking.

Descrição pública da empresa:
${descricaoEmpresa || "Sem descrição disponível."}

========================================
FONTE OFICIAL DO BOOKING
========================================

Os dados abaixo foram carregados diretamente do sistema Nexora Booking
e representam os serviços atualmente ativos para marcação.

${servicosBooking}

========================================
REGRAS OBRIGATÓRIAS
========================================

1. Responde sempre em português de Portugal.

2. Nesta página estás a atuar EXCLUSIVAMENTE como assistente público
   de reservas.

3. NÃO utilizes conhecimento interno da empresa para responder sobre
   serviços, preços, duração, profissionais ou horários.

4. NÃO inventes serviços.

5. NÃO inventes preços.

6. NÃO inventes durações.

7. NÃO inventes profissionais.

8. NÃO inventes horários.

9. Quando o utilizador perguntar por serviços, preços, duração ou
   descrição de um serviço, utiliza exclusivamente os dados reais
   apresentados na secção "FONTE OFICIAL DO BOOKING".

10. Quando o utilizador perguntar pelo preço de um serviço pelo nome,
    procura primeiro esse serviço na lista oficial acima.

11. Deves reconhecer naturalmente pequenas diferenças na forma como
    o utilizador escreve o nome do serviço.

12. Se existir um serviço correspondente na lista oficial, responde
    diretamente com os dados desse serviço.

13. NÃO peças ao utilizador para escolher entre várias interpretações
    quando existir uma correspondência clara na lista oficial.

14. Se existir exatamente um serviço correspondente, utiliza esse
    serviço.

15. Quando a pergunta for sobre profissionais de um serviço, utiliza
    obrigatoriamente a ferramenta booking_listar_profissionais.

16. Quando a pergunta for sobre horários disponíveis, utiliza
    obrigatoriamente a ferramenta booking_listar_horarios.

17. Os resultados das ferramentas Booking têm prioridade sobre qualquer
    informação genérica.

18. Quando uma ferramenta devolver uma lista vazia, informa claramente
    que não existem opções disponíveis para os critérios indicados.

19. Nunca apresentes IDs, UUIDs ou outros identificadores técnicos ao
    utilizador.

20. Nunca peças ao utilizador para fornecer IDs.

21. Quando o utilizador quiser efetivamente marcar uma reserva, recolhe
    serviço, profissional, data, hora, nome, email e telefone.

22. Quando todos os dados necessários estiverem definidos e o utilizador
    estiver a pedir para marcar, utiliza obrigatoriamente
    booking_criar_proposta. A proposta é apenas uma pré-confirmação.

23. Depois de criares uma proposta, apresenta ao utilizador um resumo
    claro com serviço, profissional, data, hora, nome e valor, e pede
    confirmação explícita antes de concluir a marcação.

24. NUNCA utilizes booking_confirmar_proposta apenas porque existe uma
    proposta pendente. Só confirma quando a mensagem atual do utilizador
    for uma confirmação explícita da proposta apresentada.

25. Se o utilizador alterar serviço, profissional, data ou hora, a
    proposta anterior fica inválida para confirmação. Deves criar uma NOVA
    proposta com os dados atualizados antes de voltares a pedir confirmação.

26. Nunca confirmes uma proposta antiga depois de o utilizador indicar uma
    alteração de serviço, profissional, data ou hora. A confirmação deve
    corresponder exatamente à última escolha apresentada pelo utilizador.

27. Depois de uma alteração, apresenta o novo resumo e pede novamente uma
    confirmação explícita.

28. Nunca apresentes IDs, UUIDs ou identificadores técnicos ao utilizador.

29. Se a proposta expirar ou o horário deixar de estar disponível, informa
    o utilizador e consulta novamente a disponibilidade.

30. A confirmação cria uma marcação real no Booking. Só deves afirmar que
    a marcação foi criada quando a ferramenta de confirmação devolver
    sucesso.

31. Se o utilizador perguntar por algo que não esteja disponível nos
    dados públicos do Booking, diz claramente que não tens essa
    informação disponível.

32. Mantém as respostas simples, naturais e úteis.

33. Não digas que consultaste documentos internos, base de conhecimento
    interna ou informações privadas.

34. Se o utilizador perguntar "quanto custa a massagem relaxante" e
    existir um serviço chamado "Massagem Relaxante" na lista oficial,
    responde diretamente com o preço desse serviço.

35. Quando responderes sobre um serviço, podes apresentar:
    - nome
    - descrição
    - duração
    - preço

36. Se o preço não estiver disponível, diz "Preço sob consulta".

37. Não mistures serviços existentes no conhecimento empresarial com
    serviços do Booking.

38. A lista de serviços acima é a fonte oficial para perguntas sobre
    serviços nesta conversa.
`;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const empresaId =
            typeof body?.empresaId === "string"
                ? body.empresaId.trim()
                : "";

        const publicSessionId =
            typeof body?.publicSessionId === "string"
                ? body.publicSessionId.trim()
                : "";

        if (
            !publicSessionId ||
            !isValidUUID(publicSessionId)
        ) {
            return Response.json(
                {
                    error: "Sessão pública inválida.",
                },
                {
                    status: 400,
                }
            );
        }

        const mensagensRecebidas: unknown[] =
            Array.isArray(body?.mensagens)
                ? body.mensagens
                : [];

        const mensagemDireta =
            typeof body?.mensagem === "string"
                ? body.mensagem.trim()
                : "";

        if (
            !empresaId ||
            !isValidUUID(empresaId)
        ) {
            return Response.json(
                {
                    error: "Empresa inválida.",
                },
                {
                    status: 400,
                }
            );
        }

        const mensagens: Mensagem[] =
            mensagensRecebidas
                .filter(isMensagemRecebida)
                .map(normalizarMensagem)
                .filter(
                    (
                        mensagem
                    ): mensagem is Mensagem =>
                        mensagem !== null
                )
                .slice(-12);

        let mensagensFinais: Mensagem[] =
            [...mensagens];

        if (
            mensagemDireta &&
            mensagensFinais[
                mensagensFinais.length - 1
            ]?.content !== mensagemDireta
        ) {
            const novaMensagem: Mensagem = {
                role: "user",
                content: mensagemDireta,
            };

            const mensagensAtualizadas: Mensagem[] = [
                ...mensagensFinais,
                novaMensagem,
            ];

            mensagensFinais =
                mensagensAtualizadas.slice(-12);
        }

        if (
            mensagensFinais.length === 0
        ) {
            return Response.json(
                {
                    error:
                        "A conversa não contém mensagens.",
                },
                {
                    status: 400,
                }
            );
        }

        const supabase =
            createSupabaseAdminClient();

        /*
         * Empresa pública
         */
        const {
            data: empresa,
            error: empresaError,
        } = await supabase
            .from("companies")
            .select(
                "id, name, description"
            )
            .eq("id", empresaId)
            .maybeSingle();

        if (empresaError) {
            console.error(
                "Erro ao carregar empresa pública:",
                empresaError
            );

            return Response.json(
                {
                    error:
                        "Não foi possível carregar os dados da empresa.",
                },
                {
                    status: 500,
                }
            );
        }

        if (!empresa) {
            return Response.json(
                {
                    error:
                        "Empresa não encontrada.",
                },
                {
                    status: 404,
                }
            );
        }

        /*
         * Configuração pública do Booking
         */
        const {
            data: configuracao,
            error: configuracaoError,
        } = await supabase
            .from(
                "configuracoes_agendamento"
            )
            .select(
                "agendamento_ativo"
            )
            .eq(
                "empresa_id",
                empresaId
            )
            .maybeSingle();

        if (configuracaoError) {
            console.error(
                "Erro ao carregar configuração do Booking:",
                configuracaoError
            );

            return Response.json(
                {
                    error:
                        "Não foi possível verificar o estado do Booking.",
                },
                {
                    status: 500,
                }
            );
        }

        if (
            !configuracao?.agendamento_ativo
        ) {
            return Response.json(
                {
                    error:
                        "O Booking está temporariamente indisponível.",
                    ai_enabled: false,
                },
                {
                    status: 403,
                }
            );
        }

        /*
         * Conversa pública persistente da sessão atual.
         * A sessão é específica da empresa e não usa auth.users.
         */
        let conversaId: string | null = null;

        const {
            data: conversaExistente,
            error: conversaExistenteError,
        } = await supabase
            .from("conversations")
            .select("id")
            .eq("company_id", empresaId)
            .is("user_id", null)
            .eq("public_session_id", publicSessionId)
            .maybeSingle();

        if (conversaExistenteError) {
            console.error(
                "Erro ao carregar conversa pública:",
                conversaExistenteError
            );

            return Response.json(
                {
                    error:
                        "Não foi possível carregar a conversa pública.",
                },
                {
                    status: 500,
                }
            );
        }

        if (conversaExistente?.id) {
            conversaId = conversaExistente.id;

            await supabase
                .from("conversations")
                .update({
                    updated_at: new Date().toISOString(),
                })
                .eq("id", conversaId);
        } else {
            const {
                data: novaConversa,
                error: novaConversaError,
            } = await supabase
                .from("conversations")
                .insert({
                    company_id: empresaId,
                    user_id: null,
                    public_session_id: publicSessionId,
                    title: "Reserva pública - Nexora AI",
                })
                .select("id")
                .single();

            if (novaConversaError || !novaConversa) {
                console.error(
                    "Erro ao criar conversa pública:",
                    novaConversaError
                );

                return Response.json(
                    {
                        error:
                            "Não foi possível iniciar a conversa pública.",
                    },
                    {
                        status: 500,
                    }
                );
            }

            conversaId = novaConversa.id;
        }

        /*
         * Serviços públicos reais do Booking.
         */
        const {
            data: servicos,
            error: servicosError,
        } = await supabase
            .from("servicos")
            .select(
                "id, nome, descricao, duracao_minutos, preco"
            )
            .eq(
                "empresa_id",
                empresaId
            )
            .eq(
                "ativo",
                true
            )
            .order(
                "nome",
                {
                    ascending: true,
                }
            );

        if (servicosError) {
            console.error(
                "Erro ao carregar serviços públicos do Booking:",
                servicosError
            );

            return Response.json(
                {
                    error:
                        "Não foi possível carregar os serviços disponíveis.",
                },
                {
                    status: 500,
                }
            );
        }

        const listaServicos =
            (servicos ?? [])
                .map(
                    (servico) => {
                        const preco =
                            servico.preco === null ||
                                servico.preco === undefined
                                ? "Preço sob consulta"
                                : `${Number(
                                    servico.preco
                                )
                                    .toFixed(2)
                                    .replace(
                                        ".",
                                        ","
                                    )} €`;

                        return `
- ID interno: ${servico.id}
  Nome: ${servico.nome}
  Descrição: ${servico.descricao ||
                            "Sem descrição disponível."
                            }
  Duração: ${servico.duracao_minutos
                            } minutos
  Preço: ${preco}
`;
                    }
                )
                .join("\n");

        const servicosBooking =
            listaServicos ||
            "Não existem serviços ativos disponíveis para marcação.";

        const instrucoes =
            criarInstrucoes(
                empresa.name,
                empresa.description || "",
                servicosBooking
            );

        /*
         * Contexto técnico das ferramentas públicas.
         */
        const toolContext = {
            userId:
                `public-booking:${empresaId}`,
            companyId: empresaId,
            conversationId: conversaId ?? undefined,
            publicSessionId,
        };

        /*
         * Se o utilizador alterar qualquer elemento da reserva, invalidar
         * propostas pendentes anteriores desta sessão antes de chamar o
         * modelo. Assim, uma alteração de horário nunca pode voltar a
         * confirmar acidentalmente a proposta antiga.
         */
        const ultimaMensagemAntesDaConfirmacao =
            mensagensFinais[mensagensFinais.length - 1];

        if (
            ultimaMensagemAntesDaConfirmacao?.role === "user" &&
            mensagemIndicaAlteracaoReserva(
                ultimaMensagemAntesDaConfirmacao.content
            ) &&
            conversaId
        ) {
            const { error: invalidarPropostasError } =
                await supabase
                    .from("ai_booking_proposals")
                    .update({
                        estado: "cancelada",
                        updated_at: new Date().toISOString(),
                    })
                    .eq("company_id", empresaId)
                    .is("user_id", null)
                    .eq("public_session_id", publicSessionId)
                    .eq("conversation_id", conversaId)
                    .eq("estado", "pendente");

            if (invalidarPropostasError) {
                console.error(
                    "Erro ao invalidar propostas públicas anteriores:",
                    invalidarPropostasError
                );

                return Response.json(
                    {
                        error:
                            "Não foi possível atualizar a reserva. Tente novamente.",
                    },
                    {
                        status: 500,
                    }
                );
            }

            console.log(
                "[BOOKING_PUBLIC_PROPOSTA] PROPOSTAS ANTERIORES INVALIDADAS POR ALTERAÇÃO",
                {
                    publicSessionId,
                    conversationId: conversaId,
                }
            );
        }

        /*
         * Confirmação explícita determinística.
         *
         * Não dependemos apenas do modelo para decidir executar
         * booking_confirmar_proposta. Se a mensagem atual for uma
         * confirmação clara da proposta apresentada imediatamente antes,
         * procuramos a proposta pendente da sessão pública e confirmamo-la
         * diretamente através da ferramenta oficial.
         */
        const ultimaMensagem =
            mensagensFinais[mensagensFinais.length - 1];

        if (
            ultimaMensagem?.role === "user" &&
            isExplicitBookingConfirmation(
                ultimaMensagem.content
            ) &&
            !mensagemIndicaAlteracaoReserva(
                ultimaMensagem.content
            ) &&
            mensagemAnteriorPedeConfirmacao(
                mensagensFinais
            ) &&
            conversaId
        ) {
            const {
                data: propostaPendente,
                error: propostaPendenteError,
            } = await supabase
                .from("ai_booking_proposals")
                .select("id")
                .eq("company_id", empresaId)
                .is("user_id", null)
                .eq("public_session_id", publicSessionId)
                .eq("conversation_id", conversaId)
                .eq("estado", "pendente")
                .gt("expires_at", new Date().toISOString())
                .order("created_at", {
                    ascending: false,
                })
                .limit(1)
                .maybeSingle();

            if (propostaPendenteError) {
                console.error(
                    "Erro ao procurar proposta pública pendente:",
                    propostaPendenteError
                );
            }

            if (propostaPendente?.id) {
                const ferramentaConfirmar =
                    ferramentasPublicas.find(
                        (tool) =>
                            tool.name ===
                            "booking_confirmar_proposta"
                    );

                if (ferramentaConfirmar) {
                    console.log(
                        "[BOOKING_PUBLIC_CONFIRMAR] CONFIRMAÇÃO EXPLÍCITA DETETADA",
                        {
                            propostaId:
                                propostaPendente.id,
                            publicSessionId,
                            conversationId: conversaId,
                        }
                    );

                    const resultado =
                        await ferramentaConfirmar.execute(
                            {
                                proposta_id:
                                    propostaPendente.id,
                            },
                            toolContext
                        );

                    const resultadoConfirmacao =
                        resultado as {
                            success?: boolean;
                            message?: string;
                            servico?: {
                                nome?: string;
                            };
                            profissional?: {
                                nome?: string;
                            };
                            data?: string;
                            hora?: string;
                            valor?: number | string;
                        };

                    if (
                        resultadoConfirmacao.success
                    ) {
                        const dataFormatada =
                            resultadoConfirmacao.data
                                ? resultadoConfirmacao.data
                                    .split("-")
                                    .reverse()
                                    .join("/")
                                : "";

                        const valor =
                            resultadoConfirmacao.valor !==
                            undefined
                                ? Number(
                                    resultadoConfirmacao.valor
                                )
                                    .toFixed(2)
                                    .replace(
                                        ".",
                                        ","
                                    ) + " €"
                                : "";

                        const respostaConfirmacao =
                            `A marcação foi confirmada com sucesso. Serviço: ${
                                resultadoConfirmacao.servico?.nome ??
                                "não especificado"
                            }. Profissional: ${
                                resultadoConfirmacao.profissional?.nome ??
                                "não especificado"
                            }. Data: ${
                                dataFormatada ||
                                resultadoConfirmacao.data ||
                                "não especificada"
                            }. Hora: ${
                                resultadoConfirmacao.hora ??
                                "não especificada"
                            }.${
                                valor
                                    ? ` Valor: ${valor}.`
                                    : ""
                            }`;

                        return Response.json({
                            resposta:
                                respostaConfirmacao,
                            conversationId:
                                conversaId,
                            ai_enabled: true,
                            ai_via_booking_campaign:
                                true,
                        });
                    }

                    return Response.json({
                        resposta:
                            resultadoConfirmacao.message ||
                            "Não foi possível concluir a marcação. O horário pode ter ficado indisponível.",
                        conversationId:
                            conversaId,
                        ai_enabled: true,
                        ai_via_booking_campaign:
                            true,
                    });
                }
            }
        }

        /*
         * Primeira chamada à OpenAI.
         */
        let resposta =
            await openai.responses.create({
                model: "gpt-5-mini",

                instructions:
                    instrucoes,

                tools:
                    definicoesFerramentasPublicas,

                input:
                    mensagensFinais.map(
                        (
                            mensagem: Mensagem
                        ) => ({
                            role:
                                mensagem.role,
                            content:
                                mensagem.content,
                        })
                    ),
            });

        /*
         * Executar ferramentas públicas.
         */
        const MAX_RONDAS = 6;

        for (
            let ronda = 0;
            ronda < MAX_RONDAS;
            ronda++
        ) {
            const chamadas =
                resposta.output.filter(
                    (item) =>
                        item.type ===
                        "function_call"
                );

            if (
                chamadas.length === 0
            ) {
                break;
            }

            const resultados = [];

            for (
                const chamada of chamadas
            ) {
                const ferramenta =
                    ferramentasPublicas.find(
                        (tool) =>
                            tool.name ===
                            chamada.name
                    );

                if (!ferramenta) {
                    resultados.push({
                        type:
                            "function_call_output" as const,
                        call_id:
                            chamada.call_id,
                        output:
                            JSON.stringify({
                                success:
                                    false,
                                error:
                                    "Ferramenta pública não encontrada.",
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
                            toolContext
                        );

                    resultados.push({
                        type:
                            "function_call_output" as const,
                        call_id:
                            chamada.call_id,
                        output:
                            JSON.stringify(
                                resultado
                            ),
                    });
                } catch (error) {
                    console.error(
                        `Erro ao executar ferramenta pública ${chamada.name}:`,
                        error
                    );

                    resultados.push({
                        type:
                            "function_call_output" as const,
                        call_id:
                            chamada.call_id,
                        output:
                            JSON.stringify({
                                success:
                                    false,
                                error:
                                    "Não foi possível consultar os dados do Booking.",
                            }),
                    });
                }
            }

            resposta =
                await openai.responses.create({
                    model: "gpt-5-mini",

                    instructions:
                        instrucoes,

                    tools:
                        definicoesFerramentasPublicas,

                    previous_response_id:
                        resposta.id,

                    input:
                        resultados,
                });
        }

        let textoResposta =
            resposta.output_text?.trim() ||
            "";

        if (!textoResposta) {
            textoResposta =
                "Não consegui obter uma resposta neste momento. Pode tentar novamente.";
        }

        return Response.json({
            resposta:
                textoResposta,
            conversationId:
                conversaId,
            ai_enabled: true,
            ai_via_booking_campaign:
                true,
        });
    } catch (error) {
        console.error(
            "Erro na Nexora AI pública do Booking:",
            error
        );

        return Response.json(
            {
                error:
                    "Não foi possível obter uma resposta da Nexora AI.",
            },
            {
                status: 500,
            }
        );
    }
}