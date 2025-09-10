import axios from 'axios';
import { ChatResponse, Memory, MemoryCreate, IngestResponse, Property } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chatApi = {
  sendMessage: async (message: string, conversationId?: string): Promise<ChatResponse> => {
    const response = await api.post('/api/chat/', {
      message,
      conversation_id: conversationId,
      user_id: 'default_user', // For MVP
    });
    return response.data;
  },

  getConversation: async (conversationId: string) => {
    const response = await api.get(`/api/chat/conversations/${conversationId}`);
    return response.data;
  },
};

export const memoryApi = {
  getMemories: async (): Promise<Memory[]> => {
    const response = await api.get('/api/memory/');
    return response.data;
  },

  createMemory: async (memory: MemoryCreate): Promise<Memory> => {
    const response = await api.post('/api/memory/', {
      ...memory,
      user_id: 'default_user', // For MVP
    });
    return response.data;
  },

  updateMemory: async (id: string, memory: Partial<MemoryCreate>): Promise<Memory> => {
    const response = await api.put(`/api/memory/${id}`, memory);
    return response.data;
  },

  deleteMemory: async (id: string): Promise<void> => {
    await api.delete(`/api/memory/${id}`);
  },
};

export const ingestApi = {
  uploadFile: async (file: File): Promise<IngestResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/api/ingest/scraper', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getProperties: async (limit: number = 50): Promise<{ properties: Property[] }> => {
    const response = await api.get(`/api/ingest/properties?limit=${limit}`);
    return response.data;
  },
};

export default api;
