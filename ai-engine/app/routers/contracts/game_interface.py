from enum import Enum
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class GameStatus(str, Enum):
    active = "active"
    stopped = "stopped"


class Actor(str, Enum):
    user = "user"
    agent = "agent"


class GameMove(BaseModel):
    actor: Actor
    order: int
    notation: str
    message: str = ""


class GameInterface(BaseModel):
    id: str
    userName: str
    engineLevel: str
    moves: list[GameMove] = []
    status: GameStatus
    startedAt: Optional[datetime] = None


class MoveRequest(BaseModel):
    game_uuid: str
    actor: str
    order: int
    notation: str
