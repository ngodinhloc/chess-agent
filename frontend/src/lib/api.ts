import axios from 'axios'
import type { EngineLevel, GameInterface, GameHistoryItem } from '../types/game'

const http = axios.create({ baseURL: '' })

export async function newGame(userName: string, engineLevel: EngineLevel): Promise<{ id: string }> {
  const { data } = await http.post('/api/game/new', { userName, engineLevel })
  return data
}

export async function makeMove(
  id: string,
  payload: { actor: string; order: number; notation: string },
): Promise<{ accepted: true }> {
  const { data } = await http.post(`/api/game/${id}/move`, payload)
  return data
}

export async function pollGame(id: string): Promise<GameInterface> {
  const { data } = await http.get(`/api/game/${id}`)
  return data
}

export async function stopGame(id: string): Promise<{ stopped: true }> {
  const { data } = await http.post(`/api/game/${id}/stop`)
  return data
}

export async function getHistory(): Promise<GameHistoryItem[]> {
  const { data } = await http.get('/api/game/history')
  return data
}
