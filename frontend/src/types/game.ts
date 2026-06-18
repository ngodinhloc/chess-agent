export type EngineLevel = 'Amateur' | 'Intermediate' | 'Professional';
export type Actor = 'user' | 'agent';
export type GameStatus = 'active' | 'stopped';

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
  startedAt: string;
}

export interface MovePair {
  order: number;
  white: string;
  black: string;
}

export interface ChatEntry {
  actor: Actor;
  text: string;
  notation?: string;
}

export interface GameHistoryItem {
  id: string;
  userName: string;
  engineLevel: EngineLevel;
  startedAt: string;
  totalMoves: number;
}
