import json
import logging
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage
from pydantic import BaseModel
from app.agent.contracts.agent_interface import AgentState
from app.configs.settings import settings

logger = logging.getLogger(__name__)


class ChessMove(BaseModel):
    notation: str
    message: str


_SYSTEM_TEMPLATE = """You are a chess engine. Your engine level is: {level}.

Current board position (FEN): {fen}
Legal moves available: {legal_moves}

You MUST choose exactly one move from the legal moves list above.

Engine level behavior:
- Amateur: Play suboptimally, make occasional blunders, be encouraging and friendly.
- Intermediate: Play reasonably well, mix solid moves with occasional errors, be conversational.
- Professional: Play like a strong engine, choose the best strategic or tactical move, be concise and analytical.

Respond with a JSON object only:
{{"notation": "<one_move_from_legal_moves>", "message": "<brief comment about your move>"}}"""


class Agent:
    def __init__(self):
        self._llm = ChatAnthropic(
            model="claude-sonnet-4-6",
            api_key=settings.anthropic_api_key,
            max_tokens=512,
        )

    async def invoke(self, state: AgentState) -> dict:
        prompt = _SYSTEM_TEMPLATE.format(
            level=state["engine_level"],
            fen=state["fen"],
            legal_moves=", ".join(state["legal_moves"]),
        )
        response = await self._llm.ainvoke([HumanMessage(content=prompt)])
        content = response.content if isinstance(response.content, str) else ""

        try:
            start = content.find("{")
            end = content.rfind("}") + 1
            parsed = json.loads(content[start:end])
            notation = parsed.get("notation", "")
            message = parsed.get("message", "")
        except Exception:
            logger.warning("Failed to parse LLM response: %s", content)
            notation = ""
            message = "Your move!"

        return {"notation": notation, "message": message, "messages": []}
