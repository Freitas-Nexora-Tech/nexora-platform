import type { NexoraTool } from "./index";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type ConfirmarArguments = {
    proposta_id: string;
};

type Disponibilidade = {
    dia_semana: number;
    hora_inicio: string;
    hora_fim: string;
};

function isValidUUID(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value
    );
}

function isValidDate(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] =
        value.split("-").map(Number);

    const date = new Date(
        Date.UTC(year, month - 1, day)
    );

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}

function parseTime(value: string) {
    const parts = value
        .substring(0, 5)
        .split(":")
        .map(Number);

    return parts[0] * 60 + parts[1];
}

function formatTime(totalMinutes: number) {
    const hours = Math.floor(
        totalMinutes / 60
    );

    const minutes =
        totalMinutes % 60;

    return `${String(hours).padStart(
        2,
        "0"
    )}:${String(minutes).padStart(
        2,
        "0"
    )}`;
}

function overlaps(
    startA: number,
    endA: number,
    startB: number,
    endB: number
) {
    return (
        startA < endB &&
        endA > startB
    );
}

function zonedDateTimeToUTC(
    date: string,
    time: string,
    timeZone: string
) {
    const [year, month, day] =
        date.split("-").map(Number);

    const [hours, minutes] =
        time.split(":").map(Number);

    const targetUTC = Date.UTC(
        year,
        month - 1,
        day,
        hours,
        minutes,
        0,
        0
    );

    let guess = new Date(
        targetUTC
    );

    const formatter =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hourCycle: "h23",
            }
        );

    for (let i = 0; i < 4; i++) {
        const parts =
            formatter.formatToParts(
                guess
            );

        const values: Record<
            string,
            number
        > = {};

        for (const part of parts) {
            if (
                part.type === "year" ||
                part.type === "month" ||
                part.type === "day" ||
                part.type === "hour" ||
                part.type === "minute" ||
                part.type === "second"
            ) {
                values[part.type] =
                    Number(part.value);
            }
        }

        const representedUTC =
            Date.UTC(
                values.year,
                values.month - 1,
                values.day,
                values.hour,
                values.minute,
                values.second
            );

        const difference =
            targetUTC -
            representedUTC;

        if (difference === 0) {
            break;
        }

        guess = new Date(
            guess.getTime() +
                difference
        );
    }

    return guess;
}

function getDatePartsInTimeZone(
    date: Date,
    timeZone: string
) {
    const formatter =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            }
        );

    const parts =
        formatter.formatToParts(
            date
        );

    const values: Record<
        string,
        number
    > = {};

    for (const part of parts) {
        if (
            part.type === "year" ||
            part.type === "month" ||
            part.type === "day"
        ) {
            values[part.type] =
                Number(part.value);
        }
    }

    return values;
}

function getWeekDay(
    date: string,
    timeZone: string
) {
    const start =
        zonedDateTimeToUTC(
            date,
            "12:00",
            timeZone
        );

    return new Intl.DateTimeFormat(
        "en-US",
        {
            timeZone,
            weekday: "short",
        }
    ).format(start);
}

function weekDayToNumber(
    value: string
) {
    const map: Record<
        string,
        number
    > = {
        Sun: 0,
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
    };

    return map[value];
}

export const bookingConfirmarPropostaTool: NexoraTool =
    {
        name: "booking_confirmar_proposta",

        description:
            "Confirma uma proposta de marcação do Booking e cria a marcação real. Só deve ser usada depois de o utilizador confirmar explicitamente a proposta apresentada pela Nexora AI. Nunca usar apenas porque existe uma proposta pendente.",

        parameters: {
            type: "object",

            properties: {
                proposta_id: {
                    type: "string",
                    description:
                        "ID interno da proposta de marcação que está pendente na conversa atual.",
                },
            },

            required: [
                "proposta_id",
            ],

            additionalProperties:
                false,
        },

        async execute(
            arguments_,
            context
        ) {
            const args =
                arguments_ as unknown as ConfirmarArguments;

            if (
                !args.proposta_id ||
                !isValidUUID(
                    args.proposta_id
                )
            ) {
                return {
                    success: false,
                    error:
                        "A proposta indicada não é válida.",
                };
            }

            if (
                !context.conversationId
            ) {
                return {
                    success: false,
                    error:
                        "Não foi possível identificar a conversa atual.",
                };
            }

            const publicSessionId =
                (
                    context as typeof context & {
                        publicSessionId?: string;
                    }
                ).publicSessionId;

            const isPublicSession =
                typeof publicSessionId === "string" &&
                publicSessionId.length > 0;

            if (
                isPublicSession &&
                !isValidUUID(publicSessionId)
            ) {
                return {
                    success: false,
                    error:
                        "A sessão pública não é válida.",
                };
            }

            const supabase =
                createSupabaseAdminClient();

            console.log(
                "[BOOKING_CONFIRMAR] INÍCIO",
                {
                    propostaId: args.proposta_id,
                    userId: context.userId,
                    publicSessionId:
                        isPublicSession
                            ? publicSessionId
                            : null,
                    companyId: context.companyId,
                    conversationId: context.conversationId,
                }
            );

            /*
             * Procurar a proposta exclusivamente
             * dentro da empresa, utilizador e conversa
             * atuais.
             */
            let propostaQuery = supabase
                .from(
                    "ai_booking_proposals"
                )
                .select(
                    `
                    id,
                    company_id,
                    user_id,
                    public_session_id,
                    conversation_id,
                    servico_id,
                    profissional_id,
                    data,
                    hora,
                    inicio,
                    fim,
                    nome,
                    email,
                    telefone,
                    notas,
                    valor,
                    estado,
                    expires_at
                `
                )
                .eq(
                    "id",
                    args.proposta_id
                )
                .eq(
                    "company_id",
                    context.companyId
                )
                .eq(
                    "conversation_id",
                    context.conversationId
                );

            if (isPublicSession) {
                propostaQuery = propostaQuery
                    .is("user_id", null)
                    .eq(
                        "public_session_id",
                        publicSessionId!
                    );
            } else {
                propostaQuery = propostaQuery.eq(
                    "user_id",
                    context.userId
                );
            }

            const {
                data: proposta,
                error:
                    propostaError,
            } = await propostaQuery.maybeSingle();

            if (propostaError) {
                console.error(
                    "Erro ao obter proposta:",
                    propostaError
                );

                return {
                    success: false,
                    error:
                        "Não foi possível obter a proposta de marcação.",
                };
            }

            if (!proposta) {
                return {
                    success: false,
                    error:
                        "A proposta de marcação não foi encontrada.",
                };
            }

            if (
                proposta.estado !==
                "pendente"
            ) {
                return {
                    success: false,
                    error:
                        "Esta proposta já não está pendente e não pode ser confirmada.",
                };
            }

            const agora =
                new Date();

            if (
                new Date(
                    proposta.expires_at
                ) <= agora
            ) {
                await supabase
                    .from(
                        "ai_booking_proposals"
                    )
                    .update({
                        estado:
                            "expirada",
                        updated_at:
                            agora.toISOString(),
                    })
                    .eq(
                        "id",
                        proposta.id
                    );

                return {
                    success: false,
                    error:
                        "A proposta de marcação expirou. É necessário consultar novamente a disponibilidade.",
                };
            }

            if (
                !isValidDate(
                    proposta.data
                )
            ) {
                return {
                    success: false,
                    error:
                        "A data da proposta é inválida.",
                };
            }

            /*
             * Validar configuração atual do Booking.
             */
            const {
                data: configuracao,
                error:
                    configuracaoError,
            } = await supabase
                .from(
                    "configuracoes_agendamento"
                )
                .select(
                    "agendamento_ativo, fuso_horario, intervalo_marcacao_minutos, antecedencia_minima_minutos, antecedencia_maxima_dias, capacidade_por_horario"
                )
                .eq(
                    "empresa_id",
                    context.companyId
                )
                .maybeSingle();

            if (
                configuracaoError ||
                !configuracao
            ) {
                return {
                    success: false,
                    error:
                        "Não foi possível validar a configuração atual do Booking.",
                };
            }

            if (
                !configuracao.agendamento_ativo
            ) {
                return {
                    success: false,
                    error:
                        "O Booking está temporariamente indisponível.",
                };
            }

            const timeZone =
                configuracao.fuso_horario ||
                "Europe/Lisbon";

            /*
             * Validar novamente o serviço.
             */
            const {
                data: servico,
                error:
                    servicoError,
            } = await supabase
                .from("servicos")
                .select(
                    "id, nome, duracao_minutos, preco"
                )
                .eq(
                    "id",
                    proposta.servico_id
                )
                .eq(
                    "empresa_id",
                    context.companyId
                )
                .eq(
                    "ativo",
                    true
                )
                .maybeSingle();

            if (
                servicoError ||
                !servico
            ) {
                return {
                    success: false,
                    error:
                        "O serviço da proposta já não está disponível.",
                };
            }

            /*
             * Validar novamente o profissional.
             */
            const {
                data: profissional,
                error:
                    profissionalError,
            } = await supabase
                .from(
                    "profissionais"
                )
                .select(
                    "id, nome"
                )
                .eq(
                    "id",
                    proposta.profissional_id
                )
                .eq(
                    "empresa_id",
                    context.companyId
                )
                .eq(
                    "ativo",
                    true
                )
                .maybeSingle();

            if (
                profissionalError ||
                !profissional
            ) {
                return {
                    success: false,
                    error:
                        "O profissional da proposta já não está disponível.",
                };
            }

            /*
             * Validar associação atual
             * profissional/serviço.
             */
            const {
                data: associacao,
                error:
                    associacaoError,
            } = await supabase
                .from(
                    "profissionais_servicos"
                )
                .select("id")
                .eq(
                    "empresa_id",
                    context.companyId
                )
                .eq(
                    "profissional_id",
                    proposta.profissional_id
                )
                .eq(
                    "servico_id",
                    proposta.servico_id
                )
                .maybeSingle();

            if (
                associacaoError ||
                !associacao
            ) {
                return {
                    success: false,
                    error:
                        "O profissional já não está associado a este serviço.",
                };
            }

            /*
             * Recalcular início/fim com a configuração
             * atual, em vez de confiar cegamente na
             * proposta antiga.
             */
            const inicioUTC =
                zonedDateTimeToUTC(
                    proposta.data,
                    proposta.hora,
                    timeZone
                );

            const duracao =
                Number(
                    servico.duracao_minutos
                );

            const fimUTC =
                new Date(
                    inicioUTC.getTime() +
                        duracao *
                            60 *
                            1000
                );

            const minimo =
                new Date(
                    agora.getTime() +
                        Number(
                            configuracao
                                .antecedencia_minima_minutos
                        ) *
                            60 *
                            1000
                );

            const maximo =
                new Date(
                    agora.getTime() +
                        Number(
                            configuracao
                                .antecedencia_maxima_dias
                        ) *
                            24 *
                            60 *
                            60 *
                            1000
                );

            if (
                inicioUTC < minimo ||
                inicioUTC > maximo
            ) {
                return {
                    success: false,
                    error:
                        "Este horário já não está dentro do período permitido para marcação.",
                };
            }

            /*
             * Validar disponibilidade semanal atual.
             */
            const partesData =
                getDatePartsInTimeZone(
                    inicioUTC,
                    timeZone
                );

            const dataInicioDia =
                zonedDateTimeToUTC(
                    proposta.data,
                    "00:00",
                    timeZone
                );

            const proximoDia =
                new Date(
                    dataInicioDia.getTime() +
                        36 *
                            60 *
                            60 *
                            1000
                );

            const partesProximoDia =
                getDatePartsInTimeZone(
                    proximoDia,
                    timeZone
                );

            const proximoDiaString =
                `${partesProximoDia.year}-${String(
                    partesProximoDia.month
                ).padStart(
                    2,
                    "0"
                )}-${String(
                    partesProximoDia.day
                ).padStart(
                    2,
                    "0"
                )}`;

            const fimDiaUTC =
                zonedDateTimeToUTC(
                    proximoDiaString,
                    "00:00",
                    timeZone
                );

            const semana =
                getWeekDay(
                    proposta.data,
                    timeZone
                );

            const diaSemana =
                weekDayToNumber(
                    semana
                );

            const {
                data: disponibilidades,
                error:
                    disponibilidadeError,
            } = await supabase
                .from(
                    "disponibilidade"
                )
                .select(
                    "dia_semana, hora_inicio, hora_fim"
                )
                .eq(
                    "empresa_id",
                    context.companyId
                )
                .eq(
                    "profissional_id",
                    proposta.profissional_id
                )
                .eq(
                    "dia_semana",
                    diaSemana
                );

            if (
                disponibilidadeError
            ) {
                return {
                    success: false,
                    error:
                        "Não foi possível validar a disponibilidade do profissional.",
                };
            }

            const minutoProposta =
                parseTime(
                    proposta.hora
                );

            const fimMinuto =
                minutoProposta +
                duracao;

            const dentroDisponibilidade =
                (
                    disponibilidades ??
                    []
                ).some(
                    (
                        disponibilidade: Disponibilidade
                    ) => {
                        const inicio =
                            parseTime(
                                disponibilidade.hora_inicio
                            );

                        const fim =
                            parseTime(
                                disponibilidade.hora_fim
                            );

                        return (
                            minutoProposta >=
                                inicio &&
                            fimMinuto <=
                                fim
                        );
                    }
                );

            if (
                !dentroDisponibilidade
            ) {
                return {
                    success: false,
                    error:
                        "O horário da proposta já não está disponível na agenda do profissional.",
                };
            }

            /*
             * Marcações existentes.
             */
            const {
                data: agendamentos,
                error:
                    agendamentosError,
            } = await supabase
                .from(
                    "agendamentos"
                )
                .select(
                    "id, inicio, fim"
                )
                .eq(
                    "empresa_id",
                    context.companyId
                )
                .eq(
                    "profissional_id",
                    proposta.profissional_id
                )
                .lt(
                    "inicio",
                    fimDiaUTC.toISOString()
                )
                .gt(
                    "fim",
                    dataInicioDia.toISOString()
                )
                .in(
                    "estado",
                    [
                        "pendente",
                        "confirmado",
                    ]
                );

            if (
                agendamentosError
            ) {
                return {
                    success: false,
                    error:
                        "Não foi possível verificar as marcações existentes.",
                };
            }

            const inicioTimestamp =
                inicioUTC.getTime();

            const fimTimestamp =
                fimUTC.getTime();

            const conflitos =
                (
                    agendamentos ??
                    []
                ).filter(
                    (
                        agendamento
                    ) =>
                        overlaps(
                            inicioTimestamp,
                            fimTimestamp,
                            new Date(
                                agendamento.inicio
                            ).getTime(),
                            new Date(
                                agendamento.fim
                            ).getTime()
                        )
                ).length;

            const capacidade =
                Number(
                    configuracao
                        .capacidade_por_horario
                );

            if (
                conflitos >=
                capacidade
            ) {
                return {
                    success: false,
                    error:
                        "O horário escolhido acabou de ficar indisponível. É necessário escolher outro horário.",
                };
            }

            /*
             * Bloqueios.
             */
            const {
                data: bloqueios,
                error:
                    bloqueiosError,
            } = await supabase
                .from("bloqueios")
                .select(
                    "inicio, fim"
                )
                .eq(
                    "empresa_id",
                    context.companyId
                )
                .eq(
                    "profissional_id",
                    proposta.profissional_id
                )
                .lt(
                    "inicio",
                    fimDiaUTC.toISOString()
                )
                .gt(
                    "fim",
                    dataInicioDia.toISOString()
                );

            if (
                bloqueiosError
            ) {
                return {
                    success: false,
                    error:
                        "Não foi possível verificar os bloqueios.",
                };
            }

            const existeBloqueio =
                (
                    bloqueios ??
                    []
                ).some(
                    (
                        bloqueio
                    ) =>
                        overlaps(
                            inicioTimestamp,
                            fimTimestamp,
                            new Date(
                                bloqueio.inicio
                            ).getTime(),
                            new Date(
                                bloqueio.fim
                            ).getTime()
                        )
                );

            if (
                existeBloqueio
            ) {
                return {
                    success: false,
                    error:
                        "O horário escolhido está agora bloqueado.",
                };
            }

            /*
             * Dados do cliente são obrigatórios
             * para criar a marcação real.
             */
            const nome =
                proposta.nome?.trim() ||
                "";

            const email =
                proposta.email
                    ?.trim()
                    .toLowerCase() ||
                "";

            const telefone =
                proposta.telefone?.trim() ||
                "";

            const notas =
                proposta.notas?.trim() ||
                null;

            if (
                nome.length < 2 ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                    email
                ) ||
                telefone.length < 6
            ) {
                return {
                    success: false,
                    error:
                        "Faltam dados do cliente para concluir a marcação. É necessário indicar nome, email e telefone.",
                };
            }

            /*
             * Procurar cliente existente.
             */
            let clienteId:
                | string
                | null = null;

            const {
                data: clienteExistente,
                error:
                    clienteError,
            } = await supabase
                .from("clientes")
                .select(
                    "id"
                )
                .eq(
                    "empresa_id",
                    context.companyId
                )
                .eq(
                    "email",
                    email
                )
                .maybeSingle();

            if (clienteError) {
                return {
                    success: false,
                    error:
                        "Não foi possível verificar os dados do cliente.",
                };
            }

            if (
                clienteExistente
            ) {
                clienteId =
                    clienteExistente.id;

                const {
                    error:
                        atualizarClienteError,
                } = await supabase
                    .from("clientes")
                    .update({
                        nome,
                        telefone,
                        notas,
                    })
                    .eq(
                        "id",
                        clienteId
                    );

                if (
                    atualizarClienteError
                ) {
                    return {
                        success: false,
                        error:
                            "Não foi possível atualizar os dados do cliente.",
                    };
                }
            } else {
                const {
                    data: novoCliente,
                    error:
                        novoClienteError,
                } = await supabase
                    .from("clientes")
                    .insert({
                        empresa_id:
                            context.companyId,
                        nome,
                        email,
                        telefone,
                        notas,
                    })
                    .select(
                        "id"
                    )
                    .single();

                if (
                    novoClienteError ||
                    !novoCliente
                ) {
                    return {
                        success: false,
                        error:
                            "Não foi possível criar o cliente.",
                    };
                }

                clienteId =
                    novoCliente.id;
            }

            /*
             * Criar a marcação real.
             */
            const {
                data: agendamento,
                error:
                    agendamentoError,
            } = await supabase
                .from(
                    "agendamentos"
                )
                .insert({
                    empresa_id:
                        context.companyId,

                    cliente_id:
                        clienteId,

                    servico_id:
                        servico.id,

                    profissional_id:
                        profissional.id,

                    inicio:
                        inicioUTC.toISOString(),

                    fim:
                        fimUTC.toISOString(),

                    valor:
                        servico.preco,

                    estado:
                        "pendente",

                    notas,
                })
                .select(
                    "id, inicio, fim, valor, estado"
                )
                .single();

            if (
                agendamentoError ||
                !agendamento
            ) {
                console.error(
                    "[BOOKING_CONFIRMAR] ERRO AO CRIAR AGENDAMENTO",
                    {
                        erro: agendamentoError,
                        propostaId: proposta.id,
                        companyId: context.companyId,
                        clienteId,
                        servicoId: servico.id,
                        profissionalId: profissional.id,
                        inicio: inicioUTC.toISOString(),
                        fim: fimUTC.toISOString(),
                        valor: servico.preco,
                    }
                );

                return {
                    success: false,
                    error:
                        "Não foi possível concluir a marcação.",
                };
            }

            /*
             * Marcação criada com sucesso.
             * Atualizar a proposta.
             */
            const {
                error:
                    atualizarPropostaError,
            } = await supabase
                .from(
                    "ai_booking_proposals"
                )
                .update({
                    estado:
                        "confirmada",

                    updated_at:
                        new Date().toISOString(),
                })
                .eq(
                    "id",
                    proposta.id
                )
                .eq(
                    "estado",
                    "pendente"
                );

            if (
                atualizarPropostaError
            ) {
                console.error(
                    "[BOOKING_CONFIRMAR] ERRO AO ATUALIZAR PROPOSTA",
                    {
                        erro: atualizarPropostaError,
                        propostaId: proposta.id,
                        agendamentoId: agendamento.id,
                    }
                );
            }

            console.log(
                "[BOOKING_CONFIRMAR] SUCESSO",
                {
                    propostaId: proposta.id,
                    agendamentoId: agendamento.id,
                    clienteId,
                    servicoId: servico.id,
                    profissionalId: profissional.id,
                }
            );

            return {
                success: true,

                agendamento_id:
                    agendamento.id,

                proposta_id:
                    proposta.id,

                servico: {
                    nome:
                        servico.nome,

                    duracao_minutos:
                        servico.duracao_minutos,

                    preco:
                        servico.preco,
                },

                profissional: {
                    nome:
                        profissional.nome,
                },

                cliente: {
                    nome,
                    email,
                    telefone,
                },

                data:
                    proposta.data,

                hora:
                    proposta.hora,

                inicio:
                    agendamento.inicio,

                fim:
                    agendamento.fim,

                valor:
                    agendamento.valor,

                estado:
                    agendamento.estado,

                message:
                    "A marcação foi confirmada e criada no Booking.",
            };
        },
    };