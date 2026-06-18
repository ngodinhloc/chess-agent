import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { GameService } from '../services/game.service';
import { NewGameDto } from '../dto/new-game.dto';
import { MakeMoveDto } from '../dto/make-move.dto';

@Controller('api/game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('new')
  newGame(@Body() dto: NewGameDto): Promise<{ id: string }> {
    return this.gameService.newGame(dto);
  }

  @Post(':id/move')
  @HttpCode(202)
  recordMove(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MakeMoveDto,
  ): Promise<{ accepted: true }> {
    return this.gameService.recordMove(id, dto);
  }

  @Post(':id/stop')
  stopGame(@Param('id', ParseUUIDPipe) id: string): Promise<{ stopped: true }> {
    return this.gameService.stopGame(id);
  }

  @Get('history')
  getHistory() {
    return this.gameService.getHistory();
  }

  @Get(':id')
  getGame(@Param('id', ParseUUIDPipe) id: string) {
    return this.gameService.getGame(id);
  }
}
