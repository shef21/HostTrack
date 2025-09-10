export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatResponse {
  response: string;
  conversation_id: string;
  timestamp: string;
}

export interface Memory {
  id: string;
  title: string;
  content: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface MemoryCreate {
  title: string;
  content: string;
  category?: string;
}

export interface IngestResponse {
  message: string;
  records_processed: number;
  records_stored: number;
  errors: string[];
}

export interface Property {
  id: string;
  source: string;
  property_data: Record<string, any>;
  processed_at: string;
}
