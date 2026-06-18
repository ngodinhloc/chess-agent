# Backend — Agent Instructions

NestJS 11 API that manages chess game state. It owns state (PostgreSQL + Redis) and delegates AI move generation to the ai-engine service via fire-and-forget HTTP calls.

## Stack

- **NestJS 11** — modules, controllers, services, middleware
- **TypeORM 0.3** — PostgreSQL, `synchronize: true` in dev (no migration files)
- **ioredis 5** — Redis client, global `RedisService`
- **@nestjs/axios** — HTTP calls to ai-engine
- **class-validator / class-transformer** — DTO validation via global `ValidationPipe`

## Module structure

```
src/
  main.ts
  app.module.ts
  game/
    contracts/
      game.interface.ts       GameInterface, GameMove, GameStatus, Actor, EngineLevel
    controllers/
      game.controller.ts      POST /api/game/new
                              POST /api/game/:id/move   (202)
                              POST /api/game/:id/stop
                              GET  /api/game/:id
    services/
      game.service.ts         Business logic — reads/writes PostgreSQL + Redis
      agent.service.ts        Fire-and-forget POST to ai-engine /api/game/move
    dto/
      new-game.dto.ts         { userName: string; engineLevel: string }
      make-move.dto.ts        { actor: string; order: number; notation: string }
  database/
    database.module.ts        TypeORM root configuration
    entities/
      game.entity.ts          uuid, user_name, engine_level, moves (jsonb),
                              started_at, created_at, modified_at
  redis/
    redis.module.ts           @Global() module
    services/
      redis.service.ts        getJson<T> / setJson / del
  health/
    controllers/
      health.controller.ts    GET /api/health → { status: 'ok' }
  common/
    middleware/
      logging.middleware.ts   HTTP request/response logger
```

## Redis key convention

`game:{uuid}` → JSON-serialised `GameInterface`

Written by the backend on `newGame` and `recordMove`. Updated in place by the ai-engine when it appends the agent's move. `stopGame` persists to PostgreSQL then deletes the key.

## GameInterface (canonical — `contracts/game.interface.ts`)

```typescript
enum GameStatus  { active = 'active', stopped = 'stopped' }
enum Actor       { user = 'user', agent = 'agent' }
type EngineLevel = 'Amateur' | 'Intermediate' | 'Professional'

interface GameMove {
  actor: Actor; order: number; notation: string; message: string
}
interface GameInterface {
  id: string; userName: string; engineLevel: EngineLevel;
  moves: GameMove[]; status: GameStatus; startedAt: Date
}
```

## Async AI call pattern

`AgentService.notifyMove(gameId, move)` fires a non-blocking `.subscribe()` on the Axios Observable — the HTTP request is sent but the endpoint returns immediately. **Never `await` inside `notifyMove`.**

The ai-engine is called:
- On `newGame` with `{ actor: 'agent', order: 0, notation: '' }` — triggers greeting
- On `recordMove` with the user's move payload — triggers move validation + agent reply

## State flow

```
newGame()
  1. Insert row in DB (games table)
  2. Write GameInterface to Redis (moves: [])
  3. Notify ai-engine → greeting appended to Redis asynchronously

recordMove()
  1. Load GameInterface from Redis
  2. Append user move (message: '') to moves[]
  3. Write back to Redis
  4. Notify ai-engine → validates move, appends agent move to Redis asynchronously

stopGame()
  1. Load GameInterface from Redis
  2. Persist full game (with all moves) to DB
  3. Delete Redis key

getGame()
  1. Redis hit → return GameInterface
  2. Redis miss → load from DB, return as stopped game
```

## Environment

```
PORT=8000
DATABASE_URL=postgresql://chess:chess@localhost:5432/chess
REDIS_URL=redis://localhost:6379
AI_AGENT_URL=http://localhost:8001
CORS_ORIGINS=http://localhost:3000
```

## Dev commands

```bash
npm install
npm run start:dev   # http://localhost:8000 with watch mode
npm run build
npm run lint
```
