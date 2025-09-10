from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import chat, memory, ingest
from app.core.config import settings

app = FastAPI(
    title="AI Nathi Property API",
    description="AI-powered property portfolio management chat API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",  # Local development
        "http://localhost:5000"   # Alternative local port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(memory.router, prefix="/api/memory", tags=["memory"])
app.include_router(ingest.router, prefix="/api/ingest", tags=["ingest"])

@app.get("/")
async def root():
    return {"message": "AI Nathi Property API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
