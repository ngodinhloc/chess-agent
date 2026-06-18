import logging
import chess
from fastapi import HTTPException
from app.routers.contracts.game_interface import (
    GameInterface, GameMove, Actor, MoveRequest,
)


class GameService:
    def __init__(self, graph, redis, logger: logging.Logger):
        self._graph = graph
        self._redis = redis
        self._logger = logger

    async def handle(self, request: MoveRequest) -> None:
        key = f"game:{request.game_uuid}"
        raw = await self._redis.get(key)
        if not raw:
            raise HTTPException(status_code=404, detail=f"Game {request.game_uuid} not found")

        game = GameInterface.model_validate_json(raw)

        if request.order == 0:
            await self._send_greeting(key, game)
            return

        # Rebuild board from all previously validated moves, skipping the
        # current user move that the backend just appended but hasn't been
        # validated yet.
        board = chess.Board()
        for move in game.moves:
            if not move.notation:
                continue
            if move.actor == Actor.user and move.order == request.order:
                continue  # will validate below
            try:
                board.push_san(move.notation)
            except Exception:
                pass

        if request.actor == Actor.user:
            try:
                board.push_san(request.notation)
            except (ValueError, chess.IllegalMoveError, chess.InvalidMoveError, chess.AmbiguousMoveError):
                self._logger.warning("Illegal move %s for game %s", request.notation, request.game_uuid)
                self._update_move_message(game, request.order, Actor.user, "That move is not legal. Try again!")
                await self._redis.set(key, game.model_dump_json())
                return

        if board.is_game_over():
            await self._handle_game_over(key, game, board, request.order)
            return

        legal_moves = [board.san(m) for m in board.legal_moves]
        if not legal_moves:
            await self._handle_game_over(key, game, board, request.order)
            return

        result = await self._graph.ainvoke({
            "messages": [],
            "fen": board.fen(),
            "legal_moves": legal_moves,
            "engine_level": game.engineLevel,
            "notation": "",
            "message": "",
        })

        agent_notation = result.get("notation", "")
        agent_message = result.get("message", "Your move!")

        if agent_notation not in legal_moves:
            self._logger.warning(
                "LLM chose illegal move '%s', falling back to first legal move", agent_notation
            )
            agent_notation = legal_moves[0]

        agent_move = GameMove(
            actor=Actor.agent,
            order=request.order,
            notation=agent_notation,
            message=agent_message,
        )
        game.moves.append(agent_move)
        await self._redis.set(key, game.model_dump_json())

    async def _send_greeting(self, key: str, game: GameInterface) -> None:
        greeting = GameMove(
            actor=Actor.agent,
            order=0,
            notation="",
            message=(
                f"Welcome, {game.userName}! I'm your chess opponent at {game.engineLevel} level. "
                "You play as White — make your first move!"
            ),
        )
        game.moves.append(greeting)
        await self._redis.set(key, game.model_dump_json())

    async def _handle_game_over(
        self, key: str, game: GameInterface, board: chess.Board, order: int
    ) -> None:
        if board.is_checkmate():
            message = "Checkmate! Well played!"
        elif board.is_stalemate():
            message = "Stalemate — it's a draw!"
        elif board.is_insufficient_material():
            message = "Draw by insufficient material."
        else:
            message = "Game over!"

        agent_move = GameMove(actor=Actor.agent, order=order, notation="", message=message)
        game.moves.append(agent_move)
        await self._redis.set(key, game.model_dump_json())

    @staticmethod
    def _update_move_message(game: GameInterface, order: int, actor: Actor, message: str) -> None:
        for move in reversed(game.moves):
            if move.order == order and move.actor == actor:
                move.message = message
                return
