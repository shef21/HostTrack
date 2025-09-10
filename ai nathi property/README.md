# AI Nathi Property - Portfolio Manager

An AI-powered chat application for real-time property portfolio management for short-term rentals.

## Tech Stack
- **Backend**: FastAPI (Python)
- **Frontend**: React (TypeScript)
- **Database**: Supabase (PostgreSQL + PGVector)
- **AI**: OpenAI (GPT-4 + Embeddings)
- **Deployment**: Railway (Backend) + Vercel (Frontend)

## Project Structure
```
ai-nathi-property/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Core configuration
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities
│   ├── requirements.txt
│   └── main.py
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utilities
│   ├── package.json
│   └── public/
└── shared/                 # Shared types and utilities
    └── types/
```

## Quick Start
1. Clone repository
2. Set up environment variables
3. Install dependencies
4. Run backend: `cd backend && uvicorn main:app --reload`
5. Run frontend: `cd frontend && npm start`

## Environment Variables
See `.env.example` files in backend and frontend directories.
