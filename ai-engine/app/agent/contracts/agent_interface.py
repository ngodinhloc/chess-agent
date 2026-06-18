from typing import Annotated
from langgraph.graph import MessagesState


class AgentState(MessagesState):
    fen: str
    legal_moves: list[str]
    engine_level: str
    notation: str
    message: str
