import { testTool } from "./test";
import { weatherTool } from "./weather";
import { webSearchTool } from "./web-search";
import { calculatorTool } from "./calculator";
import { currencyTool } from "./currency";
import { timeTool } from "./time";

export type ToolContext = {
  userId: string;
  companyId: string;
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
];

export const nexoraToolDefinitions =
  nexoraTools.map((tool) => ({
    type: "function" as const,
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    strict: true,
  }));