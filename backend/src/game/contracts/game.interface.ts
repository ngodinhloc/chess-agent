export enum GameStatus {
  active = 'active',
  stopped = 'stopped',
}

export enum Actor {
  user = 'user',
  agent = 'agent',
}

export type EngineLevel = 'Amateur' | 'Intermediate' | 'Professional';

export interface GameMove {
  actor: Actor;
  order: number;
  notation: string;
  message: string;
}

export interface GameInterface {
  id: string;
  userName: string;
  engineLevel: EngineLevel;
  moves: GameMove[];
  status: GameStatus;
  startedAt: Date;
}

export interface GameHistoryItem {
  id: string;
  userName: string;
  engineLevel: EngineLevel;
  startedAt: Date;
  totalMoves: number;
}
