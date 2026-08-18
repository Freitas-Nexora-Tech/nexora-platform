import type { NexoraTool } from "./index";

type GeocodingResult = {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone?: string;
};

type GeocodingResponse = {
  results?: GeocodingResult[];
};

type WeatherResponse = {
  current?: {
    time?: string;
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    precipitation?: number;
    rain?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  timezone?: string;
};

async function fetchComRetry(
  url: string,
  tentativas = 3
): Promise<Response> {
  let ultimoErro: unknown;

  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 8000);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        return response;
      }

      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      ultimoErro = new Error(
        `Serviço externo respondeu com HTTP ${response.status}`
      );
    } catch (error) {
      clearTimeout(timeout);
      ultimoErro = error;

      console.error(
        `Tentativa ${tentativa}/${tentativas} falhou ao contactar serviço meteorológico.`
      );
    }

    if (tentativa < tentativas) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw ultimoErro instanceof Error
    ? ultimoErro
    : new Error("Não foi possível contactar o serviço meteorológico.");
}

function descricaoTempo(codigo?: number): string {
  if (codigo === undefined) {
    return "Condição meteorológica não disponível";
  }

  if (codigo === 0) return "céu limpo";
  if ([1, 2, 3].includes(codigo)) {
    return "céu parcialmente nublado ou nublado";
  }
  if ([45, 48].includes(codigo)) return "nevoeiro";
  if ([51, 53, 55].includes(codigo)) return "chuvisco";
  if ([56, 57].includes(codigo)) return "chuvisco gelado";
  if ([61, 63, 65].includes(codigo)) return "chuva";
  if ([66, 67].includes(codigo)) return "chuva gelada";
  if ([71, 73, 75].includes(codigo)) return "neve";
  if (codigo === 77) return "grãos de neve";
  if ([80, 81, 82].includes(codigo)) return "aguaceiros";
  if ([85, 86].includes(codigo)) return "aguaceiros de neve";
  if (codigo === 95) return "trovoada";
  if ([96, 99].includes(codigo)) {
    return "trovoada com granizo";
  }

  return "condições meteorológicas variáveis";
}

export const weatherTool: NexoraTool = {
  name: "weather",

  description:
    "Consulta as condições meteorológicas atuais de uma cidade ou localização. Use esta ferramenta quando o utilizador perguntar pelo tempo, temperatura, chuva, vento ou condições meteorológicas atuais.",

  parameters: {
    type: "object",
    properties: {
      cidade: {
        type: "string",
        description:
          "Nome da cidade ou localização para consultar o tempo, por exemplo Porto, Lisboa ou Madrid.",
      },
    },
    required: ["cidade"],
    additionalProperties: false,
  },

  async execute(arguments_) {
    const cidade = arguments_.cidade;

    if (typeof cidade !== "string" || !cidade.trim()) {
      return {
        success: false,
        error: "É necessário indicar uma cidade.",
      };
    }

    const cidadePesquisada = cidade.trim();

    try {
      // 1. Procurar a localização
      const geocodingUrl =
        "https://geocoding-api.open-meteo.com/v1/search?" +
        new URLSearchParams({
          name: cidadePesquisada,
          count: "1",
          language: "pt",
          format: "json",
        }).toString();

      const geocodingResponse = await fetchComRetry(
        geocodingUrl
      );

      if (!geocodingResponse.ok) {
        return {
          success: false,
          error:
            "O serviço de localização não está disponível neste momento.",
        };
      }

      const geocodingData =
        (await geocodingResponse.json()) as GeocodingResponse;

      const local = geocodingData.results?.[0];

      if (!local) {
        return {
          success: false,
          error: `Não foi possível encontrar a localização "${cidadePesquisada}".`,
        };
      }

      // 2. Consultar meteorologia
      const weatherUrl =
        "https://api.open-meteo.com/v1/forecast?" +
        new URLSearchParams({
          latitude: String(local.latitude),
          longitude: String(local.longitude),
          current:
            "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m",
          timezone: local.timezone || "auto",
          temperature_unit: "celsius",
          wind_speed_unit: "kmh",
          precipitation_unit: "mm",
        }).toString();

      const weatherResponse = await fetchComRetry(
        weatherUrl
      );

      if (!weatherResponse.ok) {
        return {
          success: false,
          error:
            "O serviço meteorológico não está disponível neste momento.",
        };
      }

      const weatherData =
        (await weatherResponse.json()) as WeatherResponse;

      if (!weatherData.current) {
        return {
          success: false,
          error:
            "Não foi possível obter as condições meteorológicas atuais.",
        };
      }

      const current = weatherData.current;

      return {
        success: true,
        fonte: "Open-Meteo",

        localizacao: {
          cidade: local.name,
          pais: local.country || "",
          regiao: local.admin1 || "",
          latitude: local.latitude,
          longitude: local.longitude,
          timezone:
            weatherData.timezone ||
            local.timezone ||
            "",
        },

        tempo: {
          descricao: descricaoTempo(
            current.weather_code
          ),

          temperatura_c:
            current.temperature_2m ?? null,

          sensacao_termica_c:
            current.apparent_temperature ?? null,

          humidade_percentagem:
            current.relative_humidity_2m ?? null,

          precipitacao_mm:
            current.precipitation ?? null,

          chuva_mm:
            current.rain ?? null,

          vento_kmh:
            current.wind_speed_10m ?? null,

          codigo_meteorologico:
            current.weather_code ?? null,

          hora_observacao:
            current.time ?? null,
        },
      };
    } catch (error) {
      console.error(
        "Erro na ferramenta weather:",
        error
      );

      return {
        success: false,
        error:
          "Não foi possível consultar a meteorologia neste momento. Tente novamente.",
      };
    }
  },
};