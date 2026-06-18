import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly aiAgentUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.aiAgentUrl = process.env.AI_AGENT_URL ?? 'http://localhost:8001';
  }

  notifyMove(gameId: string, move: { actor: string; order: number; notation: string }): void {
    this.httpService
      .post(`${this.aiAgentUrl}/api/game/move`, {
        game_uuid: gameId,
        actor: move.actor,
        order: move.order,
        notation: move.notation,
      })
      .subscribe({
        error: (err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(`Agent call failed for game ${gameId}: ${msg}`);
        },
      });
  }
}
