from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

from app.services.supabase_client import supabase_client
from app.services.openai_client import openai_client

router = APIRouter()

class MemoryCreate(BaseModel):
    title: str
    content: str
    category: Optional[str] = None
    user_id: str = "default_user"

class MemoryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None

class MemoryResponse(BaseModel):
    id: str
    title: str
    content: str
    category: Optional[str]
    created_at: datetime
    updated_at: datetime

@router.post("/", response_model=MemoryResponse)
async def create_memory(memory: MemoryCreate):
    """Create a new memory entry"""
    try:
        supabase = supabase_client.get_client()
        
        memory_data = {
            "id": str(uuid.uuid4()),
            "user_id": memory.user_id,
            "title": memory.title,
            "content": memory.content,
            "category": memory.category,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("user_memory").insert(memory_data).execute()
        
        # Create embedding for the memory
        await create_memory_embedding(memory_data["id"], memory.content)
        
        return MemoryResponse(
            id=memory_data["id"],
            title=memory.title,
            content=memory.content,
            category=memory.category,
            created_at=datetime.fromisoformat(memory_data["created_at"]),
            updated_at=datetime.fromisoformat(memory_data["updated_at"])
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating memory: {str(e)}")

@router.get("/", response_model=List[MemoryResponse])
async def get_memories(user_id: str = "default_user"):
    """Get all memories for a user"""
    try:
        supabase = supabase_client.get_client()
        result = supabase.table("user_memory").select("*").eq(
            "user_id", user_id
        ).order("created_at", desc=True).execute()
        
        memories = []
        for memory in result.data:
            memories.append(MemoryResponse(
                id=memory["id"],
                title=memory["title"],
                content=memory["content"],
                category=memory["category"],
                created_at=datetime.fromisoformat(memory["created_at"]),
                updated_at=datetime.fromisoformat(memory["updated_at"])
            ))
        
        return memories
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving memories: {str(e)}")

@router.get("/{memory_id}", response_model=MemoryResponse)
async def get_memory(memory_id: str):
    """Get a specific memory by ID"""
    try:
        supabase = supabase_client.get_client()
        result = supabase.table("user_memory").select("*").eq("id", memory_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Memory not found")
        
        memory = result.data[0]
        return MemoryResponse(
            id=memory["id"],
            title=memory["title"],
            content=memory["content"],
            category=memory["category"],
            created_at=datetime.fromisoformat(memory["created_at"]),
            updated_at=datetime.fromisoformat(memory["updated_at"])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving memory: {str(e)}")

@router.put("/{memory_id}", response_model=MemoryResponse)
async def update_memory(memory_id: str, memory_update: MemoryUpdate):
    """Update a memory entry"""
    try:
        supabase = supabase_client.get_client()
        
        # Get existing memory
        existing = supabase.table("user_memory").select("*").eq("id", memory_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Memory not found")
        
        # Prepare update data
        update_data = {"updated_at": datetime.utcnow().isoformat()}
        if memory_update.title is not None:
            update_data["title"] = memory_update.title
        if memory_update.content is not None:
            update_data["content"] = memory_update.content
        if memory_update.category is not None:
            update_data["category"] = memory_update.category
        
        # Update memory
        result = supabase.table("user_memory").update(update_data).eq("id", memory_id).execute()
        
        # Update embedding if content changed
        if memory_update.content is not None:
            await create_memory_embedding(memory_id, memory_update.content)
        
        updated_memory = result.data[0]
        return MemoryResponse(
            id=updated_memory["id"],
            title=updated_memory["title"],
            content=updated_memory["content"],
            category=updated_memory["category"],
            created_at=datetime.fromisoformat(updated_memory["created_at"]),
            updated_at=datetime.fromisoformat(updated_memory["updated_at"])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating memory: {str(e)}")

@router.delete("/{memory_id}")
async def delete_memory(memory_id: str):
    """Delete a memory entry"""
    try:
        supabase = supabase_client.get_client()
        
        # Check if memory exists
        existing = supabase.table("user_memory").select("*").eq("id", memory_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Memory not found")
        
        # Delete memory
        supabase.table("user_memory").delete().eq("id", memory_id).execute()
        
        # Delete associated embedding
        supabase.table("vector_embeddings").delete().eq("content_id", memory_id).execute()
        
        return {"message": "Memory deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting memory: {str(e)}")

async def create_memory_embedding(memory_id: str, content: str):
    """Create embedding for memory content"""
    try:
        embedding = await openai_client.get_embedding(content)
        
        supabase = supabase_client.get_client()
        supabase.table("vector_embeddings").insert({
            "content_id": memory_id,
            "content_type": "memory",
            "content": content,
            "embedding": embedding,
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        
    except Exception as e:
        print(f"Error creating memory embedding: {e}")
