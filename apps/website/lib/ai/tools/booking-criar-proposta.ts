import type { NexoraTool } from "./index";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

function isValidUUID(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value
    );
}

type PropostaArguments = {
    servico_id: string;
    profissional_id: string;
    data: string;
    hora: string;
    nome?: string | null;
    email?: string | null;
    telefone?: string | null;
    notas?: string | null;
};

function isValidDate(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);

    const date = new Date(
        Date.UTC(year, month - 1, day)
    );

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}

function isValidTime(value: string) {
    if (!/^\d{2}:\d{2}$/.test(value)) {
        return false;
    }

    const [hours, minutes] = value.split(":").map(Number);

    return (
        hours >= 0 &&
        hours <= 23 &&
        minutes >= 0 &&
        minutes <= 59
    );
}

function isValidEmail(value: string) {
    const email = value.trim().toLowerCase();

    if (email.length < 6 || email.length > 254) {
        return false;
    }

    if (/\s/.test(email)) {
        return false;
    }

    const parts = email.split("@");

    if (parts.length !== 2) {
        return false;
    }

    const [localPart, domain] = parts;

    if (
        !localPart ||
        !domain ||
        localPart.length > 64 ||
        domain.length > 253
    ) {
        return false;
    }

    if (
        localPart.startsWith(".") ||
        localPart.endsWith(".") ||
        localPart.includes("..")
    ) {
        return false;
    }

    if (
        !/^[A-Za-z0-9!#$%&'*+\-/=?^_`{|}~.]+$/.test(
            localPart
        )
    ) {
        return false;
    }

    if (
        domain.startsWith(".") ||
        domain.endsWith(".") ||
        domain.includes("..")
    ) {
        return false;
    }

    if (!/^[A-Za-z0-9.-]+$/.test(domain)) {
        return false;
    }

    const labels = domain.split(".");

    if (
        labels.length < 2 ||
        labels.some(
            (label) =>
                !label ||
                label.startsWith("-") ||
                label.endsWith("-")
        )
    ) {
        return false;
    }

    const topLevelDomain =
        labels[labels.length - 1];

    if (topLevelDomain.length < 2) {
        return false;
    }

    return true;
}

function isValidPhone(value: string) {
    const telefone = value.trim();

    if (!telefone) {
        return false;
    }

    if (!/^[+0-9\s().-]+$/.test(telefone)) {
        return false;
    }

    const digits = telefone.replace(/\D/g, "");

    return digits.length >= 9 && digits.length <= 15;
}

function zonedDateTimeToUTC(
    date: string,
    time: string,
    timeZone: string
) {
    const [year, month, day] = date
        .split("-")
        .map(Number);

    const [hours, minutes] = time
        .split(":")
        .map(Number);

    const targetUTC = Date.UTC(
        year,
        month - 1,
        day,
        hours,
        minutes,
        0,
        0
    );

    let guess = new Date(targetUTC);

    const formatter = new Intl.DateTimeFormat(
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
        const parts = formatter.formatToParts(
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

        const representedUTC = Date.UTC(
            values.year,
            values.month - 1,
            values.day,
            values.hour,
            values.minute,
            values.second
        );

        const difference =
            targetUTC - representedUTC;

        if (difference === 0) {
            break;
        }

        guess = new Date(
            guess.getTime() + difference
        );
    }

    return guess;
}

export const bookingCriarPropostaTool: NexoraTool = {
    name: "booking_criar_proposta",

    description:
        "Cria uma proposta temporária de marcação no Booking depois de o serviço, profissional, data e horário terem sido identificados. NÃO cria a marcação real. A proposta exige confirmação explícita posterior do utilizador. Nunca usar esta ferramenta quando faltarem dados essenciais.",

    parameters: {
        type: "object",

        properties: {
            servico_id: {
                type: "string",
                description:
                    "ID interno do serviço já identificado pela Nexora AI.",
            },

            profissional_id: {
                type: "string",
                description:
                    "ID interno do profissional já identificado pela Nexora AI.",
            },

            data: {
                type: "string",
                description:
                    "Data da marcação no formato YYYY-MM-DD.",
            },

            hora: {
                type: "string",
                description:
                    "Hora da marcação no formato HH:MM.",
            },

            nome: {
                type: ["string", "null"],
                description:
                    "Nome do cliente, se já conhecido.",
            },

            email: {
                type: ["string", "null"],
                description:
                    "Email do cliente, se já conhecido.",
            },

            telefone: {
                type: ["string", "null"],
                description:
                    "Telefone do cliente, se já conhecido.",
            },

            notas: {
                type: ["string", "null"],
                description:
                    "Observações do cliente, se existirem.",
            },
        },

        required: [
            "servico_id",
            "profissional_id",
            "data",
            "hora",
            "nome",
            "email",
            "telefone",
            "notas",
        ],

        additionalProperties: false,
    },

    async execute(
        arguments_,
        context
    ) {
        const args =
            arguments_ as unknown as PropostaArguments;

        const conversationId =
            context.conversationId;

        const publicSessionId =
            (
                context as typeof context & {
                    publicSessionId?: string;
                }
            ).publicSessionId;

        const isPublicSession =
            typeof publicSessionId === "string" &&
            publicSessionId.length > 0;

        if (!conversationId) {
            return {
                success: false,
                error:
                    "Não foi possível identificar a conversa atual.",
            };
        }

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

        if (
            !args.servico_id ||
            !args.profissional_id ||
            !args.data ||
            !args.hora
        ) {
            return {
                success: false,
                error:
                    "Serviço, profissional, data e horário são obrigatórios.",
            };
        }

        if (!isValidDate(args.data)) {
            return {
                success: false,
                error: "A data indicada é inválida.",
            };
        }

        if (!isValidTime(args.hora)) {
            return {
                success: false,
                error: "O horário indicado é inválido.",
            };
        }

        const nome =
            typeof args.nome === "string"
                ? args.nome.trim()
                : "";

        const email =
            typeof args.email === "string"
                ? args.email.trim().toLowerCase()
                : "";

        const telefone =
            typeof args.telefone === "string"
                ? args.telefone.trim()
                : "";

        if (!nome) {
            return {
                success: false,
                error:
                    "O nome do cliente é obrigatório para criar a proposta.",
            };
        }

        if (!email) {
            return {
                success: false,
                error:
                    "O email do cliente é obrigatório para criar a proposta.",
            };
        }

        if (!isValidEmail(email)) {
            return {
                success: false,
                error:
                    "O email indicado não tem um formato válido. Indique um email no formato nome@dominio.com.",
            };
        }

        if (!telefone) {
            return {
                success: false,
                error:
                    "O telefone do cliente é obrigatório para criar a proposta.",
            };
        }

        if (!isValidPhone(telefone)) {
            return {
                success: false,
                error:
                    "O telefone indicado não tem um formato válido.",
            };
        }

        const supabase =
            createSupabaseAdminClient();

        let conversaQuery = supabase
            .from("conversations")
            .select(
                "id, company_id, user_id, public_session_id"
            )
            .eq(
                "id",
                conversationId
            )
            .eq(
                "company_id",
                context.companyId
            );

        if (isPublicSession) {
            conversaQuery = conversaQuery
                .is("user_id", null)
                .eq(
                    "public_session_id",
                    publicSessionId!
                );
        } else {
            conversaQuery = conversaQuery.eq(
                "user_id",
                context.userId
            );
        }

        const {
            data: conversa,
            error: conversaError,
        } = await conversaQuery.maybeSingle();

        if (
            conversaError ||
            !conversa
        ) {
            return {
                success: false,
                error:
                    "A conversa atual não é válida para esta empresa.",
            };
        }

        const {
            data: empresa,
            error: empresaError,
        } = await supabase
            .from("companies")
            .select("id, name")
            .eq(
                "id",
                context.companyId
            )
            .maybeSingle();

        if (
            empresaError ||
            !empresa
        ) {
            return {
                success: false,
                error:
                    "Não foi possível validar a empresa.",
            };
        }

        const {
            data: configuracao,
            error: configuracaoError,
        } = await supabase
            .from("configuracoes_agendamento")
            .select(
                "agendamento_ativo, fuso_horario, antecedencia_minima_minutos, antecedencia_maxima_dias"
            )
            .eq(
                "empresa_id",
                context.companyId
            )
            .maybeSingle();

        if (configuracaoError) {
            return {
                success: false,
                error:
                    "Não foi possível validar a configuração do Booking.",
            };
        }

        if (
            !configuracao?.agendamento_ativo
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

        const {
            data: servico,
            error: servicoError,
        } = await supabase
            .from("servicos")
            .select(
                "id, nome, duracao_minutos, preco"
            )
            .eq(
                "id",
                args.servico_id
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
                    "O serviço selecionado não está disponível.",
            };
        }

        const {
            data: profissional,
            error: profissionalError,
        } = await supabase
            .from("profissionais")
            .select("id, nome")
            .eq(
                "id",
                args.profissional_id
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
                    "O profissional selecionado não está disponível.",
            };
        }

        const {
            data: associacao,
            error: associacaoError,
        } = await supabase
            .from("profissionais_servicos")
            .select("id")
            .eq(
                "empresa_id",
                context.companyId
            )
            .eq(
                "profissional_id",
                args.profissional_id
            )
            .eq(
                "servico_id",
                args.servico_id
            )
            .maybeSingle();

        if (associacaoError) {
            return {
                success: false,
                error:
                    "Não foi possível validar o serviço do profissional.",
            };
        }

        if (!associacao) {
            return {
                success: false,
                error:
                    "Este profissional não está associado ao serviço escolhido.",
            };
        }

        const inicioUTC =
            zonedDateTimeToUTC(
                args.data,
                args.hora,
                timeZone
            );

        const duracao = Number(
            servico.duracao_minutos
        );

        const fimUTC = new Date(
            inicioUTC.getTime() +
                duracao *
                    60 *
                    1000
        );

        const agora = new Date();

        const minimo = new Date(
            agora.getTime() +
                Number(
                    configuracao
                        .antecedencia_minima_minutos
                ) *
                    60 *
                    1000
        );

        const maximo = new Date(
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

        const {
            data: propostaExistente,
        } = await supabase
            .from(
                "ai_booking_proposals"
            )
            .select("id")
            .eq(
                "conversation_id",
                conversa.id
            )
            .eq(
                "estado",
                "pendente"
            )
            .gt(
                "expires_at",
                agora.toISOString()
            )
            .limit(1)
            .maybeSingle();

        if (propostaExistente) {
            return {
                success: false,
                error:
                    "Já existe uma proposta de marcação pendente nesta conversa. O utilizador deve confirmá-la ou indicar que pretende escolher outro horário.",
            };
        }

        const {
            data: proposta,
            error: propostaError,
        } = await supabase
            .from(
                "ai_booking_proposals"
            )
            .insert({
                company_id:
                    context.companyId,

                user_id:
                    isPublicSession
                        ? null
                        : context.userId,

                public_session_id:
                    isPublicSession
                        ? publicSessionId
                        : null,

                conversation_id:
                    conversa.id,

                servico_id:
                    servico.id,

                profissional_id:
                    profissional.id,

                data: args.data,

                hora: args.hora,

                inicio:
                    inicioUTC.toISOString(),

                fim:
                    fimUTC.toISOString(),

                nome,

                email,

                telefone,

                notas:
                    args.notas?.trim() ||
                    null,

                valor:
                    servico.preco,

                estado:
                    "pendente",
            })
            .select(
                "id, data, hora, inicio, fim, valor, estado, expires_at"
            )
            .single();

        if (
            propostaError ||
            !proposta
        ) {
            console.error(
                "Erro ao criar proposta Booking:",
                propostaError
            );

            return {
                success: false,
                error:
                    "Não foi possível criar a proposta de marcação.",
            };
        }

        return {
            success: true,

            proposta_id:
                proposta.id,

            servico: {
                nome: servico.nome,
                duracao_minutos:
                    servico.duracao_minutos,
                preco: servico.preco,
            },

            profissional: {
                nome: profissional.nome,
            },

            data: proposta.data,

            hora: proposta.hora,

            inicio: proposta.inicio,

            fim: proposta.fim,

            valor: proposta.valor,

            estado: proposta.estado,

            expires_at:
                proposta.expires_at,

            message:
                "Proposta de marcação criada. A marcação real só deve ser criada depois de confirmação explícita do utilizador.",
        };
    },
};