from langgraph.graph import StateGraph, START, END
from app.agent.contracts.agent_interface import AgentState
from app.agent.agent import Agent


class AgentGraph:
    def build(self):
        agent = Agent()

        graph = StateGraph(AgentState)
        graph.add_node("agent", agent.invoke)
        graph.add_edge(START, "agent")
        graph.add_edge("agent", END)
        return graph.compile()
