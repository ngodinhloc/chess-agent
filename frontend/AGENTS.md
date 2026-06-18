# Frontend — Agent Instructions

Vite + React 19 + TypeScript app. Proxies all `/api/*` requests to the backend at `API_TARGET` (port 8000 in dev). The UI polls the backend every 2 seconds to receive agent moves and update the board.

## Stack

- **Vite 6** — dev server with `/api` proxy, Tailwind CSS 4 via `@tailwindcss/vite`
- **React 19** — functional components, hooks
- **Tailwind CSS 4** — utility-first, no component library
- **react-chessboard** — drag-and-drop chessboard (`<Chessboard position={fen} onPieceDrop={…} />`)
- **chess.js** — client-side board state and SAN move generation (`new Chess(fen).move({from, to})`)
- **axios** — all backend HTTP calls via `src/lib/api.ts`
- **TypeScript 5** — strict mode

## Key files

```
src/
  App.tsx                  Root — holds gameId/userName state, renders GameSetup or ChessGame
  main.tsx                 React entry point
  index.css                @import "tailwindcss"
  types/
    game.ts                GameInterface, GameMove, MovePair, ChatEntry, EngineLevel, Actor
  lib/
    api.ts                 newGame / makeMove / pollGame / stopGame
  components/
    GameSetup.tsx          Name input + engine level select + Start button
    ChessGame.tsx          Main game view — polling loop, optimistic move state
    ChessBoard.tsx         react-chessboard wrapper; rebuilds FEN from moves[]
    MoveList.tsx           Pairs moves into "1. e4 e5" display
    ChatArea.tsx           Chat log (agent commentary + local user messages) + input
```

## API proxy

`vite.config.ts` proxies `/api/*` → `process.env.API_TARGET ?? 'http://localhost:8000'`. Never call the backend URL directly — always use relative `/api/` paths via `src/lib/api.ts`.

## State and polling

`ChessGame` polls `GET /api/game/{id}` every 2 seconds via `setInterval`. On each poll it:
1. Updates `game` state with the full `GameInterface`
2. Clears `pendingMove` if the polled moves now include it
3. Extracts new agent commentary (`move.message` where non-empty) and appends to `localChat`

`allMoves` is derived (`useMemo`) by merging `game.moves` with `pendingMove`. This prevents board flicker between the moment the user drops a piece and the next poll confirming the move.

## Board interaction

`ChessBoard` derives FEN by replaying `moves[]` through a `new Chess()` instance. On `onPieceDrop`:
1. Calls `chess.move({ from, to, promotion: 'q' })` for client-side validation
2. If valid, calls `onMove(result.san, order)` which sets `pendingMove` and calls `api.makeMove()`
3. Returns `true` so `react-chessboard` holds the piece in place

The board is disabled (`arePiecesDraggable={false}`) while `isWaiting` (last chess move in `allMoves` is from the user) or when the game is stopped.

## Move pairing (MoveList)

Moves with `order === 0` or empty `notation` are skipped (greeting / game-over messages). The rest are grouped by `order` into `{ order, white: user_notation, black: agent_notation }` pairs for display as `1. e4 e5`.

## Chat

Agent commentary comes from `move.message` fields polled from the backend. User-typed chat messages are local only (`localChat` state) — they are not sent to the backend. `seenMessages` ref deduplicates agent messages across polls.

## Types (`src/types/game.ts`)

```typescript
type EngineLevel = 'Amateur' | 'Intermediate' | 'Professional'
type Actor       = 'user' | 'agent'
type GameStatus  = 'active' | 'stopped'

interface GameMove { actor: Actor; order: number; notation: string; message: string }
interface GameInterface {
  id: string; userName: string; engineLevel: EngineLevel;
  moves: GameMove[]; status: GameStatus; startedAt: string
}
```

## Environment

```
API_TARGET=http://localhost:8000   # used by vite.config.ts proxy at server start
```

## Dev commands

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint
```
