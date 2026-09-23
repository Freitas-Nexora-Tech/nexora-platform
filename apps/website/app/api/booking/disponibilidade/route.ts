import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type DisponibilidadeBody = {
    profissional_id: string;
    servico_id: string;
    data: string;
    agendamento_id?: string;
};

type Disponibilidade = {
    dia_semana: number;
    hora_inicio: string;
    hora_fim: string;
};

type Agendamento = {
    id: string;
    inicio: string;
    fim: string;
};

type Bloqueio = {
    inicio: string;
    fim: string;
};

function isValidDate(value: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseTime(value: string) {
    const [hours, minutes] = value
        .slice(0, 5)
        .split(":")
        .map(Number);

    return hours * 60 + minutes;
}

function formatTime(totalMinutes: number) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(
        minutes
    ).padStart(2, "0")}`;
}

/**
 * Converte uma data/hora "de parede" num determinado fuso
 * para o instante UTC correspondente.
 *
 * Exemplo:
 * 07/09/2026 10:00 Europe/Lisbon
 * -> 07/09/2026 09:00 UTC
 */
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

    for (let i = 0; i < 3; i++) {
        const parts = formatter.formatToParts(guess);

        const values: Record<string, number> = {};

        for (const part of parts) {
            if (
                part.type === "year" ||
                part.type === "month" ||
                part.type === "day" ||
                part.type === "hour" ||
                part.type === "minute" ||
                part.type === "second"
            ) {
                values[part.type] = Number(
                    part.value
                );
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

function getDatePartsInTimeZone(
    date: Date,
    timeZone: string
) {
    const formatter = new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }
    );

    const parts = formatter.formatToParts(date);

    const values: Record<string, number> = {};

    for (const part of parts) {
        if (
            part.type === "year" ||
            part.type === "month" ||
            part.type === "day"
        ) {
            values[part.type] = Number(
                part.value
            );
        }
    }

    return values;
}

function overlaps(
    startA: number,
    endA: number,
    startB: number,
    endB: number
) {
    return startA < endB && endA > startB;
}

export async function POST(request: Request) {
    try {
        const supabase =
            await createSupabaseServerClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                {
                    error: "Não autenticado.",
                },
                {
                    status: 401,
                }
            );
        }

        const body =
            (await request.json()) as DisponibilidadeBody;

        if (
            !body.profissional_id ||
            !body.servico_id ||
            !body.data ||
            !isValidDate(body.data)
        ) {
            return NextResponse.json(
                {
                    error:
                        "Profissional, serviço e data são obrigatórios.",
                },
                {
                    status: 400,
                }
            );
        }

        // ---------------------------------------------------------
        // Empresa, estado da conta e permissões
        // ---------------------------------------------------------

        const {
            data: membro,
            error: membroError,
        } = await supabase
            .from("company_members")
            .select(
                "id, company_id, role, is_active, must_change_password"
            )
            .eq("user_id", user.id)
            .limit(1)
            .single();

        if (membroError || !membro) {
            return NextResponse.json(
                {
                    error:
                        "Não foi encontrada uma empresa associada ao utilizador.",
                },
                {
                    status: 403,
                }
            );
        }

        if (!membro.is_active) {
            return NextResponse.json(
                {
                    error:
                        "A sua conta está desativada.",
                },
                {
                    status: 403,
                }
            );
        }

        if (membro.must_change_password) {
            return NextResponse.json(
                {
                    error:
                        "É necessário alterar a password antes de continuar.",
                },
                {
                    status: 403,
                }
            );
        }

        const empresaId =
            membro.company_id;

        // Administradores têm acesso total.
        // Funcionários precisam da permissão "marcacoes"
        // porque este endpoint calcula horários para criar/editar marcações.
        if (membro.role !== "admin") {
            const {
                data: permissaoMarcacoes,
                error: permissaoError,
            } = await supabase
                .from("company_member_permissions")
                .select("permission")
                .eq("member_id", membro.id)
                .eq("permission", "marcacoes")
                .maybeSingle();

            if (permissaoError) {
                console.error(
                    "Erro ao verificar permissão de marcações:",
                    permissaoError
                );

                return NextResponse.json(
                    {
                        error:
                            "Não foi possível validar as permissões.",
                    },
                    {
                        status: 500,
                    }
                );
            }

            if (!permissaoMarcacoes) {
                return NextResponse.json(
                    {
                        error:
                            "Não tem permissão para gerir marcações.",
                    },
                    {
                        status: 403,
                    }
                );
            }
        }

        // ---------------------------------------------------------
        // Configuração do Booking
        // ---------------------------------------------------------

        const {
            data: configuracao,
            error: configuracaoError,
        } = await supabase
            .from("configuracoes_agendamento")
            .select(
                "agendamento_ativo, fuso_horario, intervalo_marcacao_minutos, antecedencia_minima_minutos, antecedencia_maxima_dias, capacidade_por_horario"
            )
            .eq("empresa_id", empresaId)
            .maybeSingle();

        if (configuracaoError) {
            return NextResponse.json(
                {
                    error:
                        "Não foi possível carregar a configuração do Booking.",
                },
                {
                    status: 500,
                }
            );
        }

        if (!configuracao?.agendamento_ativo) {
            return NextResponse.json(
                {
                    error:
                        "O Booking está suspenso.",
                    horarios: [],
                },
                {
                    status: 403,
                }
            );
        }

        const timeZone =
            configuracao.fuso_horario ||
            "Europe/Lisbon";

        // ---------------------------------------------------------
        // Serviço
        // ---------------------------------------------------------

        const {
            data: servico,
            error: servicoError,
        } = await supabase
            .from("servicos")
            .select(
                "id, duracao_minutos"
            )
            .eq("id", body.servico_id)
            .eq("empresa_id", empresaId)
            .eq("ativo", true)
            .maybeSingle();

        if (servicoError) {
            return NextResponse.json(
                {
                    error:
                        "Não foi possível carregar o serviço.",
                },
                {
                    status: 500,
                }
            );
        }

        if (!servico) {
            return NextResponse.json(
                {
                    error:
                        "Serviço inválido ou inativo.",
                },
                {
                    status: 400,
                }
            );
        }

        // ---------------------------------------------------------
        // Profissional
        // ---------------------------------------------------------

        const {
            data: profissional,
            error: profissionalError,
        } = await supabase
            .from("profissionais")
            .select("id")
            .eq("id", body.profissional_id)
            .eq("empresa_id", empresaId)
            .eq("ativo", true)
            .maybeSingle();

        if (profissionalError) {
            return NextResponse.json(
                {
                    error:
                        "Não foi possível carregar o profissional.",
                },
                {
                    status: 500,
                }
            );
        }

        if (!profissional) {
            return NextResponse.json(
                {
                    error:
                        "Profissional inválido ou inativo.",
                },
                {
                    status: 400,
                }
            );
        }

        // ---------------------------------------------------------
        // Validar associação profissional -> serviço
        // ---------------------------------------------------------

        const {
            data: associacao,
            error: associacaoError,
        } = await supabase
            .from("profissionais_servicos")
            .select("id")
            .eq(
                "empresa_id",
                empresaId
            )
            .eq(
                "profissional_id",
                body.profissional_id
            )
            .eq(
                "servico_id",
                body.servico_id
            )
            .maybeSingle();

        if (associacaoError) {
            return NextResponse.json(
                {
                    error:
                        "Não foi possível validar o serviço do profissional.",
                },
                {
                    status: 500,
                }
            );
        }

        if (!associacao) {
            return NextResponse.json(
                {
                    error:
                        "Este profissional não está associado ao serviço escolhido.",
                    horarios: [],
                },
                {
                    status: 400,
                }
            );
        }

        // ---------------------------------------------------------
        // Descobrir o dia da semana da data no calendário local
        // ---------------------------------------------------------

        const [year, month, day] =
            body.data
                .split("-")
                .map(Number);

        const calendarioDate =
            new Date(
                Date.UTC(
                    year,
                    month - 1,
                    day
                )
            );

        const diaSemana =
            calendarioDate.getUTCDay();

        // ---------------------------------------------------------
        // Disponibilidade semanal
        // ---------------------------------------------------------

        const {
            data: disponibilidades,
            error: disponibilidadeError,
        } = await supabase
            .from("disponibilidade")
            .select(
                "dia_semana, hora_inicio, hora_fim"
            )
            .eq(
                "empresa_id",
                empresaId
            )
            .eq(
                "profissional_id",
                body.profissional_id
            )
            .eq(
                "dia_semana",
                diaSemana
            )
            .eq("ativo", true)
            .order(
                "hora_inicio",
                {
                    ascending: true,
                }
            );

        if (disponibilidadeError) {
            return NextResponse.json(
                {
                    error:
                        "Não foi possível carregar a disponibilidade.",
                },
                {
                    status: 500,
                }
            );
        }

        const listaDisponibilidades =
            (disponibilidades ??
                []) as Disponibilidade[];

        if (
            listaDisponibilidades.length ===
            0
        ) {
            return NextResponse.json({
                horarios: [],
            });
        }

        // ---------------------------------------------------------
        // Limites reais do dia no fuso da empresa
        // ---------------------------------------------------------

        const inicioDiaUTC =
            zonedDateTimeToUTC(
                body.data,
                "00:00",
                timeZone
            );

        const proximoDia =
            new Date(
                inicioDiaUTC.getTime() +
                36 * 60 * 60 * 1000
            );

        const partesProximoDia =
            getDatePartsInTimeZone(
                proximoDia,
                timeZone
            );

        const proximoDiaString =
            `${partesProximoDia.year}-${String(
                partesProximoDia.month
            ).padStart(2, "0")}-${String(
                partesProximoDia.day
            ).padStart(2, "0")}`;

        const fimDiaUTC =
            zonedDateTimeToUTC(
                proximoDiaString,
                "00:00",
                timeZone
            );

        // ---------------------------------------------------------
        // Marcações existentes
        // ---------------------------------------------------------

        const {
            data: agendamentos,
            error: agendamentosError,
        } = await supabase
            .from("agendamentos")
            .select(
                "id, inicio, fim"
            )
            .eq(
                "empresa_id",
                empresaId
            )
            .eq(
                "profissional_id",
                body.profissional_id
            )
            .lt(
                "inicio",
                fimDiaUTC.toISOString()
            )
            .gt(
                "fim",
                inicioDiaUTC.toISOString()
            )
            .in(
                "estado",
                [
                    "pendente",
                    "confirmado",
                ]
            );

        if (agendamentosError) {
            return NextResponse.json(
                {
                    error:
                        "Não foi possível verificar as marcações existentes.",
                },
                {
                    status: 500,
                }
            );
        }

        const listaAgendamentos =
            (agendamentos ??
                []) as Agendamento[];

        // ---------------------------------------------------------
        // Bloqueios
        // ---------------------------------------------------------

        const {
            data: bloqueios,
            error: bloqueiosError,
        } = await supabase
            .from("bloqueios")
            .select(
                "inicio, fim"
            )
            .eq(
                "empresa_id",
                empresaId
            )
            .eq(
                "profissional_id",
                body.profissional_id
            )
            .lt(
                "inicio",
                fimDiaUTC.toISOString()
            )
            .gt(
                "fim",
                inicioDiaUTC.toISOString()
            );

        if (bloqueiosError) {
            return NextResponse.json(
                {
                    error:
                        "Não foi possível verificar os bloqueios.",
                },
                {
                    status: 500,
                }
            );
        }

        const listaBloqueios =
            (bloqueios ?? []) as Bloqueio[];

        const agora =
            new Date();

        const minimo =
            new Date(
                agora.getTime() +
                Number(
                    configuracao.antecedencia_minima_minutos
                ) *
                60 *
                1000
            );

        const maximo =
            new Date(
                agora.getTime() +
                Number(
                    configuracao.antecedencia_maxima_dias
                ) *
                24 *
                60 *
                60 *
                1000
            );

        const horarios: string[] = [];

        const duracao =
            Number(
                servico.duracao_minutos
            );

        const intervalo =
            Number(
                configuracao.intervalo_marcacao_minutos
            );

        const capacidade =
            Number(
                configuracao.capacidade_por_horario
            );

        for (
            const disponibilidade of listaDisponibilidades
        ) {
            const inicio =
                parseTime(
                    disponibilidade.hora_inicio
                );

            const fim =
                parseTime(
                    disponibilidade.hora_fim
                );

            for (
                let minuto = inicio;
                minuto + duracao <= fim;
                minuto += intervalo
            ) {
                const hora =
                    formatTime(minuto);

                const inicioLocal =
                    zonedDateTimeToUTC(
                        body.data,
                        hora,
                        timeZone
                    );

                const fimLocal =
                    new Date(
                        inicioLocal.getTime() +
                        duracao *
                        60 *
                        1000
                    );

                if (
                    inicioLocal < minimo ||
                    inicioLocal > maximo
                ) {
                    continue;
                }

                const inicioTimestamp =
                    inicioLocal.getTime();

                const fimTimestamp =
                    fimLocal.getTime();

                // -------------------------------------------------
                // Verificar marcações existentes
                // -------------------------------------------------

                let conflitos = 0;

                for (
                    const agendamento of listaAgendamentos
                ) {
                    if (
                        body.agendamento_id &&
                        agendamento.id ===
                        body.agendamento_id
                    ) {
                        continue;
                    }

                    const agendamentoInicio =
                        new Date(
                            agendamento.inicio
                        ).getTime();

                    const agendamentoFim =
                        new Date(
                            agendamento.fim
                        ).getTime();

                    if (
                        overlaps(
                            inicioTimestamp,
                            fimTimestamp,
                            agendamentoInicio,
                            agendamentoFim
                        )
                    ) {
                        conflitos++;
                    }
                }

                if (
                    conflitos >= capacidade
                ) {
                    continue;
                }

                // -------------------------------------------------
                // Verificar bloqueios
                // -------------------------------------------------

                let bloqueado = false;

                for (
                    const bloqueio of listaBloqueios
                ) {
                    const bloqueioInicio =
                        new Date(
                            bloqueio.inicio
                        ).getTime();

                    const bloqueioFim =
                        new Date(
                            bloqueio.fim
                        ).getTime();

                    if (
                        overlaps(
                            inicioTimestamp,
                            fimTimestamp,
                            bloqueioInicio,
                            bloqueioFim
                        )
                    ) {
                        bloqueado = true;
                        break;
                    }
                }

                if (bloqueado) {
                    continue;
                }

                horarios.push(hora);
            }
        }

        return NextResponse.json({
            horarios,
            timeZone,
        });
    } catch (error) {
        console.error(
            "Erro ao calcular disponibilidade:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Ocorreu um erro interno ao calcular a disponibilidade.",
            },
            {
                status: 500,
            }
        );
    }
}