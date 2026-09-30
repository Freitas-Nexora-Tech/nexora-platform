import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type Body = {
    servico_id?: string;
    profissional_id?: string;
    data?: string;
    hora?: string;
    nome?: string;
    email?: string;
    telefone?: string;
    notas?: string | null;
};

type Disponibilidade = {
    dia_semana: number;
    hora_inicio: string;
    hora_fim: string;
};

type Agendamento = {
    inicio: string;
    fim: string;
    estado: string;
};

type Bloqueio = {
    inicio: string;
    fim: string;
};

function isValidDate(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}

function parseTime(value: string) {
    const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
    return hours * 60 + minutes;
}

function formatTime(totalMinutes: number) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0",
    )}`;
}

function overlaps(
    startA: number,
    endA: number,
    startB: number,
    endB: number,
) {
    return startA < endB && endA > startB;
}

function zonedDateTimeToUTC(
    date: string,
    time: string,
    timeZone: string,
) {
    const [year, month, day] = date.split("-").map(Number);
    const [hours, minutes] = time.split(":").map(Number);

    const targetUTC = Date.UTC(
        year,
        month - 1,
        day,
        hours,
        minutes,
        0,
        0,
    );

    let guess = new Date(targetUTC);

    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    });

    for (let i = 0; i < 4; i++) {
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
                values[part.type] = Number(part.value);
            }
        }

        const representedUTC = Date.UTC(
            values.year,
            values.month - 1,
            values.day,
            values.hour,
            values.minute,
            values.second,
        );

        const difference = targetUTC - representedUTC;

        if (difference === 0) {
            break;
        }

        guess = new Date(guess.getTime() + difference);
    }

    return guess;
}

function getDatePartsInTimeZone(
    date: Date,
    timeZone: string,
) {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });

    const parts = formatter.formatToParts(date);
    const values: Record<string, number> = {};

    for (const part of parts) {
        if (
            part.type === "year" ||
            part.type === "month" ||
            part.type === "day"
        ) {
            values[part.type] = Number(part.value);
        }
    }

    return values;
}

export async function POST(
    request: Request,
    context: {
        params: Promise<{
            empresaId: string;
        }>;
    },
) {
    try {
        const { empresaId } = await context.params;

        if (!empresaId) {
            return NextResponse.json(
                { error: "Empresa inválida." },
                { status: 400 },
            );
        }

        const body = (await request.json()) as Body;

        const servicoId = body.servico_id?.trim() ?? "";
        const profissionalId = body.profissional_id?.trim() ?? "";
        const data = body.data?.trim() ?? "";
        const hora = body.hora?.trim() ?? "";
        const nome = body.nome?.trim() ?? "";
        const email = body.email?.trim().toLowerCase() ?? "";
        const telefone = body.telefone?.trim() ?? "";
        const notas = body.notas?.trim() || null;

        if (
            !servicoId ||
            !profissionalId ||
            !data ||
            !hora ||
            !nome ||
            !email ||
            !telefone
        ) {
            return NextResponse.json(
                {
                    error:
                        "Serviço, profissional, data, horário e dados do cliente são obrigatórios.",
                },
                { status: 400 },
            );
        }

        if (!isValidDate(data) || !/^\d{2}:\d{2}$/.test(hora)) {
            return NextResponse.json(
                { error: "Data ou horário inválido." },
                { status: 400 },
            );
        }

        if (nome.length < 2) {
            return NextResponse.json(
                { error: "Introduza um nome válido." },
                { status: 400 },
            );
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { error: "Introduza um email válido." },
                { status: 400 },
            );
        }

        if (telefone.length < 6) {
            return NextResponse.json(
                { error: "Introduza um telefone válido." },
                { status: 400 },
            );
        }

        if (notas && notas.length > 2000) {
            return NextResponse.json(
                { error: "As observações são demasiado longas." },
                { status: 400 },
            );
        }

        const supabase = createSupabaseAdminClient();

        const { data: empresa, error: empresaError } = await supabase
            .from("companies")
            .select("id, name")
            .eq("id", empresaId)
            .maybeSingle();

        if (empresaError) {
            return NextResponse.json(
                { error: "Não foi possível validar a empresa." },
                { status: 500 },
            );
        }

        if (!empresa) {
            return NextResponse.json(
                { error: "Empresa não encontrada." },
                { status: 404 },
            );
        }

        const { data: configuracao, error: configuracaoError } =
            await supabase
                .from("configuracoes_agendamento")
                .select(
                    "agendamento_ativo, fuso_horario, intervalo_marcacao_minutos, antecedencia_minima_minutos, antecedencia_maxima_dias, capacidade_por_horario",
                )
                .eq("empresa_id", empresaId)
                .maybeSingle();

        if (configuracaoError) {
            return NextResponse.json(
                {
                    error:
                        "Não foi possível carregar a configuração do Booking.",
                },
                { status: 500 },
            );
        }

        if (!configuracao?.agendamento_ativo) {
            return NextResponse.json(
                { error: "O Booking está temporariamente indisponível." },
                { status: 403 },
            );
        }

        const timeZone =
            configuracao.fuso_horario || "Europe/Lisbon";

        const { data: servico, error: servicoError } = await supabase
            .from("servicos")
            .select("id, nome, duracao_minutos, preco")
            .eq("id", servicoId)
            .eq("empresa_id", empresaId)
            .eq("ativo", true)
            .maybeSingle();

        if (servicoError) {
            return NextResponse.json(
                { error: "Não foi possível validar o serviço." },
                { status: 500 },
            );
        }

        if (!servico) {
            return NextResponse.json(
                { error: "O serviço selecionado não está disponível." },
                { status: 400 },
            );
        }

        const { data: profissional, error: profissionalError } =
            await supabase
                .from("profissionais")
                .select("id, nome")
                .eq("id", profissionalId)
                .eq("empresa_id", empresaId)
                .eq("ativo", true)
                .maybeSingle();

        if (profissionalError) {
            return NextResponse.json(
                { error: "Não foi possível validar o profissional." },
                { status: 500 },
            );
        }

        if (!profissional) {
            return NextResponse.json(
                {
                    error:
                        "O profissional selecionado não está disponível.",
                },
                { status: 400 },
            );
        }

        const { data: associacao, error: associacaoError } =
            await supabase
                .from("profissionais_servicos")
                .select("id")
                .eq("empresa_id", empresaId)
                .eq("profissional_id", profissionalId)
                .eq("servico_id", servicoId)
                .maybeSingle();

        if (associacaoError) {
            return NextResponse.json(
                {
                    error:
                        "Não foi possível validar o serviço do profissional.",
                },
                { status: 500 },
            );
        }

        if (!associacao) {
            return NextResponse.json(
                {
                    error:
                        "Este profissional não está associado ao serviço escolhido.",
                },
                { status: 400 },
            );
        }

        const [year, month, day] = data.split("-").map(Number);
        const calendarioDate = new Date(
            Date.UTC(year, month - 1, day),
        );
        const diaSemana = calendarioDate.getUTCDay();

        const { data: disponibilidades, error: disponibilidadeError } =
            await supabase
                .from("disponibilidade")
                .select("dia_semana, hora_inicio, hora_fim")
                .eq("empresa_id", empresaId)
                .eq("profissional_id", profissionalId)
                .eq("dia_semana", diaSemana)
                .eq("ativo", true)
                .order("hora_inicio", { ascending: true });

        if (disponibilidadeError) {
            return NextResponse.json(
                {
                    error:
                        "Não foi possível validar a disponibilidade.",
                },
                { status: 500 },
            );
        }

        const listaDisponibilidades =
            (disponibilidades ?? []) as Disponibilidade[];

        const inicioDiaUTC = zonedDateTimeToUTC(
            data,
            "00:00",
            timeZone,
        );

        const proximoDia = new Date(
            inicioDiaUTC.getTime() + 36 * 60 * 60 * 1000,
        );

        const partesProximoDia = getDatePartsInTimeZone(
            proximoDia,
            timeZone,
        );

        const proximoDiaString =
            `${partesProximoDia.year}-${String(
                partesProximoDia.month,
            ).padStart(2, "0")}-${String(
                partesProximoDia.day,
            ).padStart(2, "0")}`;

        const fimDiaUTC = zonedDateTimeToUTC(
            proximoDiaString,
            "00:00",
            timeZone,
        );

        const { data: agendamentos, error: agendamentosError } =
            await supabase
                .from("agendamentos")
                .select("inicio, fim, estado")
                .eq("empresa_id", empresaId)
                .eq("profissional_id", profissionalId)
                .lt("inicio", fimDiaUTC.toISOString())
                .gt("fim", inicioDiaUTC.toISOString())
                .in("estado", ["pendente", "confirmado"]);

        if (agendamentosError) {
            return NextResponse.json(
                {
                    error:
                        "Não foi possível verificar as marcações existentes.",
                },
                { status: 500 },
            );
        }

        const listaAgendamentos =
            (agendamentos ?? []) as Agendamento[];

        const { data: bloqueios, error: bloqueiosError } =
            await supabase
                .from("bloqueios")
                .select("inicio, fim")
                .eq("empresa_id", empresaId)
                .eq("profissional_id", profissionalId)
                .lt("inicio", fimDiaUTC.toISOString())
                .gt("fim", inicioDiaUTC.toISOString());

        if (bloqueiosError) {
            return NextResponse.json(
                {
                    error:
                        "Não foi possível verificar os bloqueios.",
                },
                { status: 500 },
            );
        }

        const listaBloqueios =
            (bloqueios ?? []) as Bloqueio[];

        const inicioUTC = zonedDateTimeToUTC(
            data,
            hora,
            timeZone,
        );

        const duracao = Number(servico.duracao_minutos);
        const fimUTC = new Date(
            inicioUTC.getTime() + duracao * 60 * 1000,
        );

        const agora = new Date();
        const minimo = new Date(
            agora.getTime() +
                Number(
                    configuracao.antecedencia_minima_minutos,
                ) *
                    60 *
                    1000,
        );
        const maximo = new Date(
            agora.getTime() +
                Number(configuracao.antecedencia_maxima_dias) *
                    24 *
                    60 *
                    60 *
                    1000,
        );

        if (inicioUTC < minimo || inicioUTC > maximo) {
            return NextResponse.json(
                {
                    error:
                        "Este horário já não está dentro do período permitido para marcação.",
                },
                { status: 409 },
            );
        }

        const horaSelecionadaEmMinutos = parseTime(hora);
        const intervalo = Number(
            configuracao.intervalo_marcacao_minutos,
        );

        const pertenceADisponibilidade = listaDisponibilidades.some(
            (disponibilidade) => {
                const inicio = parseTime(
                    disponibilidade.hora_inicio,
                );
                const fim = parseTime(
                    disponibilidade.hora_fim,
                );

                return (
                    horaSelecionadaEmMinutos >= inicio &&
                    horaSelecionadaEmMinutos + duracao <= fim &&
                    (horaSelecionadaEmMinutos - inicio) %
                        intervalo ===
                        0
                );
            },
        );

        if (!pertenceADisponibilidade) {
            return NextResponse.json(
                {
                    error:
                        "O horário selecionado já não está disponível.",
                },
                { status: 409 },
            );
        }

        let conflitos = 0;

        for (const agendamento of listaAgendamentos) {
            if (
                overlaps(
                    inicioUTC.getTime(),
                    fimUTC.getTime(),
                    new Date(agendamento.inicio).getTime(),
                    new Date(agendamento.fim).getTime(),
                )
            ) {
                conflitos += 1;
            }
        }

        for (const bloqueio of listaBloqueios) {
            if (
                overlaps(
                    inicioUTC.getTime(),
                    fimUTC.getTime(),
                    new Date(bloqueio.inicio).getTime(),
                    new Date(bloqueio.fim).getTime(),
                )
            ) {
                return NextResponse.json(
                    {
                        error:
                            "Este horário ficou indisponível. Escolha outro horário.",
                    },
                    { status: 409 },
                );
            }
        }

        const capacidade = Math.max(
            1,
            Number(configuracao.capacidade_por_horario) || 1,
        );

        if (conflitos >= capacidade) {
            return NextResponse.json(
                {
                    error:
                        "Este horário acabou de ser ocupado. Escolha outro horário.",
                },
                { status: 409 },
            );
        }

        let clienteId: string | null = null;

        const { data: clientePorEmail } = await supabase
            .from("clientes")
            .select("id")
            .eq("empresa_id", empresaId)
            .ilike("email", email)
            .limit(1)
            .maybeSingle();

        if (clientePorEmail) {
            clienteId = clientePorEmail.id;

            const { error: atualizarClienteError } = await supabase
                .from("clientes")
                .update({
                    nome,
                    telefone,
                    notas,
                })
                .eq("id", clienteId)
                .eq("empresa_id", empresaId);

            if (atualizarClienteError) {
                return NextResponse.json(
                    {
                        error:
                            "Não foi possível atualizar os dados do cliente.",
                    },
                    { status: 500 },
                );
            }
        } else {
            const { data: clienteCriado, error: clienteError } =
                await supabase
                    .from("clientes")
                    .insert({
                        empresa_id: empresaId,
                        nome,
                        email,
                        telefone,
                        notas,
                    })
                    .select("id, nome, email, telefone, notas")
                    .single();

            if (clienteError || !clienteCriado) {
                return NextResponse.json(
                    {
                        error:
                            "Não foi possível registar os dados do cliente.",
                    },
                    { status: 500 },
                );
            }

            clienteId = clienteCriado.id;
        }

        const { data: agendamento, error: criarError } =
            await supabase
                .from("agendamentos")
                .insert({
                    empresa_id: empresaId,
                    cliente_id: clienteId,
                    servico_id: servicoId,
                    profissional_id: profissionalId,
                    inicio: inicioUTC.toISOString(),
                    fim: fimUTC.toISOString(),
                    valor: servico.preco,
                    estado: "pendente",
                    notas,
                })
                .select(
                    "id, empresa_id, cliente_id, servico_id, profissional_id, inicio, fim, valor, estado, notas",
                )
                .single();

        if (criarError || !agendamento) {
            return NextResponse.json(
                {
                    error:
                        "Não foi possível criar a marcação. O horário pode ter sido ocupado entretanto.",
                },
                { status: 409 },
            );
        }

        return NextResponse.json(
            {
                success: true,
                agendamento,
                cliente: {
                    id: clienteId,
                    nome,
                    email,
                    telefone,
                },
                empresa: {
                    id: empresa.id,
                    name: empresa.name,
                },
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("Erro na marcação pública:", error);

        return NextResponse.json(
            {
                error:
                    "Não foi possível concluir a marcação neste momento.",
            },
            { status: 500 },
        );
    }
}
