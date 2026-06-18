# Chess Engine

An AI-powered chess game where you play against Claude at three skill levels. You play as White via a drag-and-drop board. After each move, Claude picks a legal reply and writes natural-language commentary in the chat panel. Move quality and commentary style both adapt to the engine level — Amateur blunders occasionally and narrates its own reasoning; Professional plays sharply and responds analytically. Games are persisted so history can be replayed move by move, with commentary preserved alongside each position.

---

## Screenshots

**Game setup — history sidebar, engine level selector, greyed-out board**

The left sidebar lists previous games with level badges and move counts. The level dropdown shows Amateur / Intermediate / Professional. The board and move list are greyed out until Start is clicked.

![Game setup with history sidebar and level selector open](./screenshot_1.png)

**Professional-level game in progress — Thinking… indicator and analytical commentary**

The amber "Thinking…" badge appears while Claude is processing. The move list tracks the game. The chat panel shows terse, analytical commentary — explaining opening theory and strategic ideas rather than narrating the move.

![Professional game with Thinking indicator and analytical commentary in chat](./screenshot_2.png)

**Amateur-level game — casual commentary and full move history**

The same game captured in `moves.json`: Ken vs Amateur Engine, Polish Opening (1.b4). The engine's commentary is casual and emoji-filled — celebrating material grabs, admitting it might be missing something, and cheering the opponent on.

![Amateur game with Polish Opening and casual emoji commentary](./screenshot_3.png)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Browser                                                     │
│  React + Vite frontend  (port 3000)                          │
│  · Drag-and-drop chessboard (react-chessboard + chess.js)   │
│  · Move list, chat panel, collapsible history sidebar        │
│  · Ply-by-ply replay of completed games                      │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTP  /api/*  (Vite proxy)
┌────────────────────────▼─────────────────────────────────────┐
│  Backend  (NestJS · port 8000)                               │
│  · REST game API                                             │
│  · PostgreSQL  — persists completed games                    │
│  · Redis       — live game state during play                 │
│  · Fires async POST to AI Engine on every move (fire-and-forget)│
└──────────┬───────────────────────────┬───────────────────────┘
           │ async POST /api/game/move  │ read / write
           │                           │
┌──────────▼────────────────┐  ┌───────▼────────────┐
│  AI Engine                │  │  Redis             │
│  FastAPI · port 8001      │─▶│  key: game:{uuid}  │
│  LangGraph single node    │  └────────────────────┘
│  python-chess validation  │
│  Claude picks the move    │
└───────────────────────────┘
```

**Redis is the shared live-state channel.** The backend fires the engine request without waiting for it, so the HTTP response returns in milliseconds. The frontend polls every two seconds and picks up the engine's move as soon as it lands in Redis.

**PostgreSQL is the persistent store.** When the user stops a game, the full `GameMove[]` array is written to the `moves` column and the Redis key is deleted. History reads come from PostgreSQL; live reads come from Redis.

---

## Services

| Service | Port | Directory | Stack |
|---------|------|-----------|-------|
| postgres | 5432 | — | PostgreSQL 17 |
| redis | 6379 | — | Redis 7 |
| ai-engine | 8001 | `ai-engine/` | FastAPI + LangGraph + python-chess |
| backend | 8000 | `backend/` | NestJS 11 + TypeORM |
| frontend | 3000 | `frontend/` | Vite + React 19 + Tailwind CSS 4 |

### Frontend (port 3000)

- Game setup form: username, engine level (Amateur / Intermediate / Professional), Start button
- Drag-and-drop board via `react-chessboard`; client-side FEN tracking with `chess.js`
- Polls `GET /api/game/{id}` every 2 seconds while the game is active
- Move list renders white/black pairs (`1. e4 e5`); in history view each half-move is clickable and replays the board at that ply
- Chat panel shows engine commentary alongside each move, tagged with a notation badge
- Collapsible history sidebar; New Game button always visible

### Backend (port 8000)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/game/new` | Create game in PostgreSQL + Redis, trigger greeting, return `{ id }` |
| `POST` | `/api/game/:id/move` | Append user move to Redis, trigger AI Engine (202) |
| `POST` | `/api/game/:id/stop` | Persist moves to PostgreSQL, delete Redis key |
| `GET` | `/api/game/history` | Last 50 games from PostgreSQL |
| `GET` | `/api/game/:id` | Live game from Redis, or persisted game from PostgreSQL |
| `GET` | `/api/health` | Health check |

### AI Engine (port 8001)

Receives `POST /api/game/move` from the backend. Rebuilds the board by replaying all prior moves with `python-chess`, validates the user's move, then invokes Claude to pick a reply and write a comment. Both are stored together in the same `GameMove` record.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/game/move` | Validate move, run engine, append response to Redis |
| `GET` | `/api/health` | Health check |

---

## Data model

```
EngineLevel:  Amateur | Intermediate | Professional
Actor:        user    | agent
GameStatus:   active  | stopped

GameMove {
  actor:    Actor
  order:    number      // move pair number; 0 = greeting
  notation: string      // SAN; empty for greeting and game-over messages
  message:  string      // engine commentary or error text
}

GameInterface {
  id:          uuid
  userName:    string
  engineLevel: EngineLevel
  moves:       GameMove[]
  status:      GameStatus
  startedAt:   datetime
}
```

User and engine responses to the same move share the same `order` number. The greeting sits at `order: 0` with an empty `notation`. Filtering `notation && order > 0` gives the chess-move list for board replay.

---

## Quick start

```bash
# 1. Set the Anthropic API key
cp ai-engine/.env.example ai-engine/.env
# edit ai-engine/.env and set ANTHROPIC_API_KEY

# 2. Start all services
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000).

| Key | Where to get |
|-----|-------------|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
