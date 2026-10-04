import { testTool } from "./test";
import { weatherTool } from "./weather";
import { webSearchTool } from "./web-search";
import { calculatorTool } from "./calculator";
import { currencyTool } from "./currency";
import { timeTool } from "./time";

import { bookingListarServicosTool } from "./booking-listar-servicos";
import { bookingListarProfissionaisTool } from "./booking-listar-profissionais";
import { bookingListarHorariosTool } from "./booking-listar-horarios";
import { bookingCriarPropostaTool } from "./booking-criar-proposta";
import { bookingConfirmarPropostaTool } from "./booking-confirmar-proposta";

export type ToolContext = {
    userId: string;
    companyId: string;
    conversationId?: string;
};

export type NexoraTool = {
    name: string;
    description: string;
    parameters: Record<string, unknown>;

    execute: (
        arguments_: Record<string, unknown>,
        context: ToolContext
    ) => Promise<unknown>;
};

export const nexoraTools: NexoraTool[] = [
    testTool,

    weatherTool,
    webSearchTool,
    calculatorTool,
    currencyTool,
    timeTool,

    bookingListarServicosTool,
    bookingListarProfissionaisTool,
    bookingListarHorariosTool,
    bookingCriarPropostaTool,
    bookingConfirmarPropostaTool,
];

export const nexoraToolDefinitions =
    nexoraTools.map((tool) => ({
        type: "function" as const,
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
        strict: true,
    }));