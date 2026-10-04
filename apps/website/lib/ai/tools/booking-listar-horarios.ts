import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type { NexoraTool } from "./index";

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
        values[part.type] = Number(part.value);
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
      values[part.type] = Number(part.value);
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
  return (
    startA < endB &&
    endA > startB
  );
}

async function calcularHorariosProfissional(
  supabase: ReturnType<
    typeof createSupabaseAdminClient
  >,
  empresaId: string,
  servicoId: string,
  profissionalId: string,
  data: string,
  configuracao: {
    fuso_horario: string | null;
    intervalo_marcacao_minutos: number;
    antecedencia_minima_minutos: number;
    antecedencia_maxima_dias: number;
    capacidade_por_horario: number;
  },
  servico: {
    id: string;
    nome: string;
    duracao_minutos: number;
  },
  profissional: {
    id: string;
    nome: string;
  }
) {
  const timeZone =
    configuracao.fuso_horario ||
    "Europe/Lisbon";

  const [year, month, day] =
    data.split("-").map(Number);

  const calendarioDate = new Date(
    Date.UTC(
      year,
      month - 1,
      day
    )
  );

  const diaSemana =
    calendarioDate.getUTCDay();

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
      profissionalId
    )
    .eq(
      "dia_semana",
      diaSemana
    )
    .eq("ativo", true)
    .order("hora_inicio", {
      ascending: true,
    });

  if (disponibilidadeError) {
    throw new Error(
      "Não foi possível carregar a disponibilidade."
    );
  }

  const listaDisponibilidades =
    (disponibilidades ??
      []) as Disponibilidade[];

  if (
    listaDisponibilidades.length ===
    0
  ) {
    return {
      profissional: {
        id: profissional.id,
        nome: profissional.nome,
      },
      horarios: [],
    };
  }

  const inicioDiaUTC =
    zonedDateTimeToUTC(
      data,
      "00:00",
      timeZone
    );

  const proximoDia = new Date(
    inicioDiaUTC.getTime() +
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
    ).padStart(2, "0")}-${String(
      partesProximoDia.day
    ).padStart(2, "0")}`;

  const fimDiaUTC =
    zonedDateTimeToUTC(
      proximoDiaString,
      "00:00",
      timeZone
    );

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
      profissionalId
    )
    .lt(
      "inicio",
      fimDiaUTC.toISOString()
    )
    .gt(
      "fim",
      inicioDiaUTC.toISOString()
    )
    .in("estado", [
      "pendente",
      "confirmado",
    ]);

  if (agendamentosError) {
    throw new Error(
      "Não foi possível verificar as marcações existentes."
    );
  }

  const listaAgendamentos =
    (agendamentos ??
      []) as Agendamento[];

  const {
    data: bloqueios,
    error: bloqueiosError,
  } = await supabase
    .from("bloqueios")
    .select("inicio, fim")
    .eq(
      "empresa_id",
      empresaId
    )
    .eq(
      "profissional_id",
      profissionalId
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
    throw new Error(
      "Não foi possível verificar os bloqueios."
    );
  }

  const listaBloqueios =
    (bloqueios ??
      []) as Bloqueio[];

  const agora = new Date();

  const minimo = new Date(
    agora.getTime() +
      Number(
        configuracao.antecedencia_minima_minutos
      ) *
        60 *
        1000
  );

  const maximo = new Date(
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

  const duracao = Number(
    servico.duracao_minutos
  );

  const intervalo = Number(
    configuracao.intervalo_marcacao_minutos
  );

  const capacidade = Number(
    configuracao.capacidade_por_horario
  );

  for (
    const disponibilidade of
      listaDisponibilidades
  ) {
    const inicio = parseTime(
      disponibilidade.hora_inicio
    );

    const fim = parseTime(
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
          data,
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

      let conflitos = 0;

      for (
        const agendamento of
          listaAgendamentos
      ) {
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

      let bloqueado = false;

      for (
        const bloqueio of
          listaBloqueios
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

  return {
    profissional: {
      id: profissional.id,
      nome: profissional.nome,
    },
    horarios,
  };
}

export const bookingListarHorariosTool: NexoraTool = {
  name: "booking_listar_horarios",

  description:
    "Consulta os horários realmente disponíveis no Booking para um serviço e uma data. O profissional é opcional: se o utilizador indicar um profissional específico, consulta apenas esse profissional; se não indicar, consulta todos os profissionais ativos que realizam o serviço e apresenta os horários disponíveis por profissional. Deve ser usada para perguntas como 'que horários há hoje para massagem?', 'quando posso marcar manicure?' ou 'que horários tem a Isabelle amanhã?'.",

  parameters: {
    type: "object",
    properties: {
      servico_id: {
        type: "string",
        description:
          "ID interno do serviço escolhido.",
      },

      profissional_id: {
        type: ["string", "null"],
        description:
          "ID interno do profissional. Deve ser preenchido apenas quando o utilizador indicar um profissional específico. Caso contrário, usar null.",
      },

      data: {
        type: "string",
        description:
          "Data pretendida no formato YYYY-MM-DD.",
      },
    },

    required: [
      "servico_id",
      "profissional_id",
      "data",
    ],

    additionalProperties: false,
  },

  async execute(
    arguments_,
    context
  ) {
    const servicoId =
      arguments_.servico_id;

    const profissionalId =
      typeof arguments_.profissional_id ===
        "string" &&
      arguments_.profissional_id.trim()
        ? arguments_.profissional_id
        : null;

    const data =
      arguments_.data;

    if (
      typeof servicoId !== "string" ||
      !servicoId.trim()
    ) {
      return {
        success: false,
        error:
          "É necessário indicar o serviço.",
      };
    }

    if (
      typeof data !== "string" ||
      !isValidDate(data)
    ) {
      return {
        success: false,
        error:
          "A data é obrigatória e deve estar no formato YYYY-MM-DD.",
      };
    }

    const supabase =
      createSupabaseAdminClient();

    const {
      data: configuracao,
      error: configuracaoError,
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

    if (configuracaoError) {
      console.error(
        "Erro ao carregar configuração do Booking:",
        configuracaoError
      );

      return {
        success: false,
        error:
          "Não foi possível carregar a configuração do Booking.",
      };
    }

    if (
      !configuracao?.agendamento_ativo
    ) {
      return {
        success: false,
        error:
          "O agendamento online está suspenso.",
        horarios: [],
      };
    }

    const {
      data: servico,
      error: servicoError,
    } = await supabase
      .from("servicos")
      .select(
        "id, nome, duracao_minutos"
      )
      .eq("id", servicoId)
      .eq(
        "empresa_id",
        context.companyId
      )
      .eq("ativo", true)
      .maybeSingle();

    if (servicoError) {
      console.error(
        "Erro ao carregar serviço:",
        servicoError
      );

      return {
        success: false,
        error:
          "Não foi possível carregar o serviço.",
      };
    }

    if (!servico) {
      return {
        success: false,
        error:
          "Serviço inválido ou inativo.",
      };
    }

    /*
     * Se foi indicado um profissional,
     * validamos e consultamos apenas esse.
     */
    if (profissionalId) {
      const {
        data: profissional,
        error: profissionalError,
      } = await supabase
        .from("profissionais")
        .select("id, nome")
        .eq(
          "id",
          profissionalId
        )
        .eq(
          "empresa_id",
          context.companyId
        )
        .eq("ativo", true)
        .maybeSingle();

      if (profissionalError) {
        return {
          success: false,
          error:
            "Não foi possível carregar o profissional.",
        };
      }

      if (!profissional) {
        return {
          success: false,
          error:
            "Profissional inválido ou inativo.",
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
          profissionalId
        )
        .eq(
          "servico_id",
          servicoId
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
          horarios: [],
        };
      }

      try {
        const resultado =
          await calcularHorariosProfissional(
            supabase,
            context.companyId,
            servicoId,
            profissionalId,
            data,
            configuracao,
            servico,
            profissional
          );

        return {
          success: true,
          data,
          servico: {
            id: servico.id,
            nome: servico.nome,
            duracao_minutos:
              servico.duracao_minutos,
          },
          profissional:
            resultado.profissional,
          horarios:
            resultado.horarios,
          timeZone:
            configuracao.fuso_horario ||
            "Europe/Lisbon",
        };
      } catch (error) {
        console.error(
          "Erro ao calcular horários:",
          error
        );

        return {
          success: false,
          error:
            "Não foi possível calcular os horários disponíveis.",
        };
      }
    }

    /*
     * Sem profissional:
     * procurar todos os profissionais ativos
     * associados ao serviço.
     */
    const {
      data: associacoes,
      error: associacoesError,
    } = await supabase
      .from("profissionais_servicos")
      .select(
        "profissional_id"
      )
      .eq(
        "empresa_id",
        context.companyId
      )
      .eq(
        "servico_id",
        servicoId
      );

    if (associacoesError) {
      return {
        success: false,
        error:
          "Não foi possível obter os profissionais do serviço.",
      };
    }

    const profissionalIds =
      Array.from(
        new Set(
          (associacoes ?? []).map(
            (associacao) =>
              associacao.profissional_id
          )
        )
      );

    if (
      profissionalIds.length ===
      0
    ) {
      return {
        success: true,
        data,
        servico: {
          id: servico.id,
          nome: servico.nome,
        },
        profissionais: [],
        horarios: [],
        timeZone:
          configuracao.fuso_horario ||
          "Europe/Lisbon",
      };
    }

    const {
      data: profissionais,
      error: profissionaisError,
    } = await supabase
      .from("profissionais")
      .select("id, nome")
      .eq(
        "empresa_id",
        context.companyId
      )
      .eq("ativo", true)
      .in(
        "id",
        profissionalIds
      )
      .order("nome", {
        ascending: true,
      });

    if (profissionaisError) {
      return {
        success: false,
        error:
          "Não foi possível obter os profissionais disponíveis.",
      };
    }

    const resultados = [];

    for (
      const profissional of
        profissionais ?? []
    ) {
      try {
        const resultado =
          await calcularHorariosProfissional(
            supabase,
            context.companyId,
            servicoId,
            profissional.id,
            data,
            configuracao,
            servico,
            profissional
          );

        resultados.push(
          resultado
        );
      } catch (error) {
        console.error(
          `Erro ao calcular horários do profissional ${profissional.id}:`,
          error
        );
      }
    }

    return {
      success: true,
      data,
      servico: {
        id: servico.id,
        nome: servico.nome,
        duracao_minutos:
          servico.duracao_minutos,
      },
      profissionais:
        resultados,
      timeZone:
        configuracao.fuso_horario ||
        "Europe/Lisbon",
    };
  },
};