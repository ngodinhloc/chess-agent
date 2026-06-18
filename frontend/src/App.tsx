import { useCallback, useEffect, useState } from 'react'
import type { EngineLevel, GameHistoryItem } from './types/game'
import * as api from './lib/api'
import GameSetup from './components/GameSetup'
import ChessGame from './components/ChessGame'
import GameHistory from './components/GameHistory'
import PreGameView from './components/PreGameView'

export default function App() {
  const [gameId, setGameId] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [history, setHistory] = useState<GameHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const refreshHistory = useCallback(async () => {
    try {
      const items = await api.getHistory()
      setHistory(items)
    } catch {
      // non-critical
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshHistory()
  }, [refreshHistory])

  async function handleStart(name: string, level: EngineLevel) {
    setStarting(true)
    setError(null)
    try {
      const { id } = await api.newGame(name, level)
      setUserName(name)
      setGameId(id)
      refreshHistory()
    } catch {
      setError('Failed to start game. Is the backend running?')
    } finally {
      setStarting(false)
    }
  }

  function handleStop() {
    setGameId(null)
    setUserName('')
    refreshHistory()
  }

  function handleSelectGame(id: string) {
    setGameId(id)
    setUserName('')
  }

  function handleNewGame() {
    setGameId(null)
    setUserName('')
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <GameHistory
        items={history}
        loading={historyLoading}
        selectedId={gameId}
        onSelect={handleSelectGame}
        onNewGame={handleNewGame}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
      />

      <div className="flex-1 min-w-0 px-4 py-6">
        {gameId ? (
          <ChessGame gameId={gameId} userName={userName} onStop={handleStop} />
        ) : (
          <>
            <div className="mb-6">
              <GameSetup onStart={handleStart} loading={starting} />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
            <PreGameView />
          </>
        )}
      </div>
    </div>
  )
}
