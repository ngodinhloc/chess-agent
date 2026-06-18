import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { GameController } from './controllers/game.controller';
import { GameService } from './services/game.service';
import { AgentService } from './services/agent.service';
import { Game } from '../database/entities/game.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game]),
    HttpModule.registerAsync({
      useFactory: () => ({
        timeout: 120_000,
        maxRedirects: 0,
      }),
    }),
  ],
  controllers: [GameController],
  providers: [GameService, AgentService],
})
export class GameModule {}
