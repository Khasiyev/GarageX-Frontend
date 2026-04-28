import api from './api';

export interface AskAiRequest {
  question: string;
}

export interface AskAiResponse {
  answer: string;
}

export const aiService = {
  ask: (data: AskAiRequest) => api.post<{ success: boolean; data: AskAiResponse; message: string }>('/ai/ask', data),
};
