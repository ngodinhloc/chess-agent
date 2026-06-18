# AI Agent — Agent Instructions

FastAPI service that validates chess moves with `python-chess` and generates the engine's reply using a LangGraph + Claude pipeline. It reads and writes the `GameInterface` directly in Redis.

## Stack

- **FastAPI** — one router: `/api/game/move`
- **LangGraph** — single-node graph (no tools, no conditionals)
- **langchain-anthropic** — Claude `claude-sonnet-4-6` for move selection and commentary
- **python-chess** — move validation, board reconstruction, legal move enumeration
- **redis[asyncio]** — reads/writes `GameInterface` JSON in Redis
- **pydantic-settings** — typed config from `.env`

## File structure

```
app/
  main.py                        FastAPI app, CORS middleware, router registration
  container.py                   Dependency injection (cached_property singletons)
  configs/
    settings.py                  Settings — anthropic_api_key, redis_url, cors_origins, …
  routers/
    health_router.py             GET /api/health → { status: 'ok' }
    game_router.py               POST /api/game/move → handle_move()
    contracts/
      game_interface.py          Pydantic models: GameInterface, GameMove, MoveRequest,
                                 GameStatus, Actor
  services/
    redis_client.py              Lazy singleton aioredis client
    game_service.py              Core logic — validate move, invoke graph, update Redis
  agent/
    agent.py                     Agent class — invokes Claude, parses JSON response
    agent_graph.py               AgentGraph.build() — single-node LangGraph
    contracts/
      agent_interface.py         AgentState (extends MessagesState + fen, legal_moves, …)
```

## `/api/game/move` flow

Receives `{ game_uuid, actor, order, notation }` from the backend (fire-and-forget).

```
1. Load GameInterface from Redis key game:{game_uuid}
2. If order == 0 → append greeting move, return
3. Rebuild chess.Board() by replaying all previous moves,
   skipping the current user move (actor==user, order==N) — validated next
4. Validate request.notation via board.push_san(); on failure:
   - Update that move's message field: "That move is not legal. Try again!"
   - Write back to Redis, return
5. Check board.is_game_over() → append game-over message if true, return
6. Enumerate legal_moves = [board.san(m) for m in board.legal_moves]
7. Invoke LangGraph: ainvoke({ fen, legal_moves, engine_level, … })
8. Claude returns JSON { notation, message }
9. Validate agent notation is in legal_moves; fall back to legal_moves[0] if not
10. Append agent GameMove to game.moves, write to Redis
```

**Critical:** Step 3 skips the current user move when rebuilding the board because the backend already appended it to Redis before calling this endpoint. Re-pushing it would cause a double-push error.

## LangGraph agent

Single-node graph: `START → agent → END`

The `agent.py` builds a prompt with the board FEN, legal moves list, and engine level, then calls Claude without tools. Claude responds with a raw JSON object `{"notation": "e5", "message": "..."}`. The service parses this with a simple `find("{") / rfind("}")` extraction and falls back gracefully on parse failure.

Engine level behavior (in the system prompt):
- **Amateur** — suboptimal moves, occasional blunders, encouraging tone
- **Intermediate** — reasonable play, conversational
- **Professional** — strong strategic/tactical play, analytical

## GameInterface Python models (`routers/contracts/game_interface.py`)

Mirror the TypeScript contracts in the backend exactly. Keep in sync when modifying either side.

```python
class GameStatus(str, Enum):  active = "active", stopped = "stopped"
class Actor(str, Enum):        user = "user",  agent = "agent"
class GameMove(BaseModel):     actor, order, notation, message
class GameInterface(BaseModel):id, userName, engineLevel, moves, status, startedAt
class MoveRequest(BaseModel):  game_uuid, actor, order, notation
```

Serialise with `model.model_dump_json()` — Pydantic v2 outputs enum string values and ISO timestamps automatically.

## Environment

```
ANTHROPIC_API_KEY=          # required
REDIS_URL=redis://localhost:6379
CORS_ORIGINS=http://localhost:3000
LANGSMITH_API_KEY=          # optional
LANGSMITH_TRACING=false     # optional
LANGSMITH_PROJECT=chess-app
```

## Dev commands

```bash
pip install .
uvicorn app.main:app --reload --port 8001   # http://localhost:8001
```
