import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from '../../redis/services/redis.service';
import { Game } from '../../database/entities/game.entity';
import { GameInterface, GameHistoryItem, GameMove, GameStatus, Actor, EngineLevel } from '../contracts/game.interface';
import { AgentService } from './agent.service';
import { NewGameDto } from '../dto/new-game.dto';
import { MakeMoveDto } from '../dto/make-move.dto';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepo: Repository<Game>,
    private readonly redisService: RedisService,
    private readonly agentService: AgentService,
  ) {}

  private redisKey(id: string): string {
    return `game:${id}`;
  }

  async newGame(dto: NewGameDto): Promise<{ id: string }> {
    const id = uuidv4();
    const now = new Date();

    const gameObject: GameInterface = {
      id,
      userName: dto.userName,
      engineLevel: dto.engineLevel as EngineLevel,
      moves: [],
      status: GameStatus.active,
      startedAt: now,
    };

    const entity = this.gameRepo.create({
      uuid: id,
      userName: dto.userName,
      engineLevel: dto.engineLevel,
      moves: [],
      startedAt: now,
    });
    await this.gameRepo.save(entity);
    await this.redisService.setJson(this.redisKey(id), gameObject);

    this.agentService.notifyMove(id, { actor: Actor.agent, order: 0, notation: '' });
    return { id };
  }

  async recordMove(id: string, dto: MakeMoveDto): Promise<{ accepted: true }> {
    const game = await this.redisService.getJson<GameInterface>(this.redisKey(id));
    if (!game) throw new NotFoundException(`Game ${id} not found`);

    const move: GameMove = {
      actor: dto.actor as Actor,
      order: dto.order,
      notation: dto.notation,
      message: '',
    };

    game.moves.push(move);
    await this.redisService.setJson(this.redisKey(id), game);

    this.agentService.notifyMove(id, { actor: dto.actor, order: dto.order, notation: dto.notation });
    return { accepted: true };
  }

  async stopGame(id: string): Promise<{ stopped: true }> {
    const game = await this.redisService.getJson<GameInterface>(this.redisKey(id));
    if (!game) throw new NotFoundException(`Game ${id} not found`);

    await this.gameRepo.save({
      uuid: id,
      userName: game.userName,
      engineLevel: game.engineLevel,
      moves: game.moves as unknown as Record<string, unknown>[],
      startedAt: game.startedAt,
    });

    await this.redisService.del(this.redisKey(id));
    return { stopped: true };
  }

  async getHistory(): Promise<GameHistoryItem[]> {
    const entities = await this.gameRepo.find({
      order: { startedAt: 'DESC' },
      take: 50,
    });

    return entities.map((e) => ({
      id: e.uuid,
      userName: e.userName,
      engineLevel: e.engineLevel as EngineLevel,
      startedAt: e.startedAt,
      totalMoves: (e.moves as unknown as GameMove[]).filter((m) => m.notation).length,
    }));
  }

  async getGame(id: string): Promise<GameInterface> {
    const cached = await this.redisService.getJson<GameInterface>(this.redisKey(id));
    if (cached) return cached;

    const entity = await this.gameRepo.findOne({ where: { uuid: id } });
    if (!entity) throw new NotFoundException(`Game ${id} not found`);

    return {
      id: entity.uuid,
      userName: entity.userName,
      engineLevel: entity.engineLevel as EngineLevel,
      moves: entity.moves as unknown as GameMove[],
      status: GameStatus.stopped,
      startedAt: entity.startedAt,
    };
  }
}
