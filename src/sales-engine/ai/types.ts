export type AIMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
};

export type AITool = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type AIInput = {
  messages: AIMessage[];
  temperature?: number;
};

export type AIToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type AIResponse = {
  provider: string;
  model: string;
  content: string;
  toolCalls: AIToolCall[];
};

export type AIToolResponse = AIResponse;

export interface AIProvider {
  readonly name: string;
  generateResponse(input: AIInput): Promise<AIResponse>;
  generateResponseStream?(input: AIInput, onToken: (token: string) => void): Promise<AIResponse>;
  generateWithTools(input: AIInput, tools: AITool[]): Promise<AIToolResponse>;
}
