import openai
from app.core.config import settings
from typing import List, Dict, Any

class OpenAIClient:
    def __init__(self):
        openai.api_key = settings.OPENAI_API_KEY
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
    
    async def get_embedding(self, text: str) -> List[float]:
        """Get embedding for text using OpenAI's embedding model"""
        response = self.client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    
    async def get_chat_completion(self, messages: List[Dict[str, str]], context: str = "") -> str:
        """Get chat completion with context"""
        system_message = {
            "role": "system",
            "content": f"""You are an AI assistant specialized in property portfolio management for short-term rentals. 
            You help users analyze their property investments, market trends, and optimize their rental strategies.
            
            Context from user's data:
            {context}
            
            Always provide helpful, accurate, and actionable advice based on the provided context. 
            If you don't have enough information, ask clarifying questions."""
        }
        
        full_messages = [system_message] + messages
        
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=full_messages,
            max_tokens=1000,
            temperature=0.7
        )
        
        return response.choices[0].message.content

# Global instance
openai_client = OpenAIClient()
