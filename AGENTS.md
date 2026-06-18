# Chess Agent — Agent Instructions

A chess-playing web app where the user plays against a Claude-powered AI engine. The architecture mirrors `tourguide-agent`: polling-based UI updates via Redis, fire-and-forget AI calls, and dual-storage (Redis hot / PostgreSQL warm).

## Services

| Service   | Port | Directory   | Stack                               |
|-----------|------|-------------|-------------------------------------|
| postgres  | 5432 | —           | PostgreSQL 17                       |
| redis     | 6379 | —           | Redis 7                             |
| ai-engine  | 8001 | `ai-engine/` | FastAPI + LangGraph + python-chess  |
| backend   | 8000 | `backend/`  | NestJS 11 + TypeORM                 |
| frontend  | 3000 | `frontend/` | Vite + React 19 + Tailwind CSS 4    |

## Running the full stack

```bash
# Set ANTHROPIC_API_KEY in ai-engine/.env first
docker compose up --build
```

Service-specific dev setup is in each service's `AGENTS.md`.

## Request flow

```
User drags piece on board
  → POST /api/game/{id}/move   (frontend → backend, 202)
  → backend appends move to Redis, fires ai-engine (fire-and-forget)
  → POST /api/game/move        (backend → ai-engine)
  → ai-engine validates move with python-chess, asks Claude for reply
  → ai-engine appends agent move to Redis

Frontend polls GET /api/game/{id} every 2s
  → backend returns GameInterface from Redis (or DB fallback)
  → frontend rebuilds board FEN from moves array, updates move list + chat
```

## Shared data contract

The `GameInterface` is stored as JSON in Redis under key `game:{uuid}` and persisted to PostgreSQL on stop. Both the backend (TypeScript) and ai-engine (Python) read and write this shape.

```
GameInterface {
  id: string
  userName: string
  engineLevel: "Amateur" | "Intermediate" | "Professional"
  moves: GameMove[]
  status: "active" | "stopped"
  startedAt: Date
}

GameMove {
  actor: "user" | "agent"
  order: int          // move pair number (1, 2, 3…); 0 = greeting
  notation: string    // SAN (e.g. "e4", "Nf3"); empty for greeting / game-over messages
  message: string     // agent's commentary; empty for user moves initially
}
```

Keep the TypeScript contracts (`backend/src/game/contracts/game.interface.ts`) and the Python Pydantic models (`ai-engine/app/routers/contracts/game_interface.py`) in sync when making changes.
