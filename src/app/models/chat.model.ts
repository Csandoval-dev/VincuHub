// src/app/models/chat.model.ts

export interface ChatMessage {
  id: string;
  contenido: string;
  esUsuario: boolean;
  timestamp: Date;
  enviando?: boolean;
}

export interface ChatBotConfig {
  mensajeBienvenida: string;
  preguntasFrecuentes: PreguntaFrecuente[];
  sistemaPrompt: string;
}

export interface PreguntaFrecuente {
  pregunta: string;
  categoria: string;
}

export interface ChatGPTRequest {
  model: string;
  messages: ChatGPTMessage[];
  temperature: number;
  max_tokens: number;
}

export interface ChatGPTMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatGPTResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}