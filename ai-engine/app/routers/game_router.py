from fastapi import APIRouter, Depends
from app.routers.contracts.game_interface import MoveRequest
from app.services.game_service import GameService
from app.container import container

router = APIRouter()


@router.post("/game/move", status_code=200)
async def handle_move(
    request: MoveRequest,
    service: GameService = Depends(lambda: container.game_service),
) -> dict:
    await service.handle(request)
    return {"ok": True}
