import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChatEntry, GameInterface, GameMove } from '../types/game'
import * as api from '../lib/api'
import ChessBoard from './ChessBoard'
import MoveList from './MoveList'
import ChatArea from './ChatArea'

interface Props {
  gameId: string
  userName: string
  onStop: () => void
}

function extractChatEntries(moves: GameMove[]): ChatEntry[] {
  return moves
    .filter((m) => m.message)
    .map((m) => ({ actor: m.actor, text: m.message, notation: m.notation || undefined }))
}

export default function ChessGame({ gameId, userName, onStop }: Props) {
  const [game, setGame] = useState<GameInterface | null>(null)
  const [pendingMove, setPendingMove] = useState<GameMove | null>(null)
  const [localChat, setLocalChat] = useState<ChatEntry[]>([])
  const [stopping, setStopping] = useState(false)
  const [selectedPly, setSelectedPly] = useState<number | null>(null)
  const seenMessages = useRef(new Set<string>())

  const allMoves = useMemo<GameMove[]>(() => {
    const base = game?.moves ?? []
    if (!pendingMove) return base
    const confirmed = base.some(
      (m) => m.actor === 'user' && m.order === pendingMove.order && m.notation === pendingMove.notation,
    )
    return confirmed ? base : [...base, pendingMove]
  }, [game?.moves, pendingMove])

  // Ordered chess-only plies used for ply navigation
  const chessMoves = useMemo(() => allMoves.filter((m) => m.notation && m.order > 0), [allMoves])

  // Moves fed to the board: sliced to selectedPly when reviewing history
  const boardMoves = useMemo<GameMove[]>(() => {
    if (selectedPly === null) return allMoves
    return chessMoves.slice(0, selectedPly + 1)
  }, [allMoves, chessMoves, selectedPly])

  useEffect(() => {
    let active = true
    seenMessages.current = new Set()
    setGame(null)
    setPendingMove(null)
    setLocalChat([])
    setSelectedPly(null)

    async function poll() {
      try {
        const data = await api.pollGame(gameId)
        if (!active) return
        setGame(data)

        setPendingMove((prev) => {
          if (!prev) return null
          const confirmed = data.moves.some(
            (m) => m.actor === 'user' && m.order === prev.order && m.notation === prev.notation,
          )
          return confirmed ? null : prev
        })

        const incoming = extractChatEntries(data.moves)
        const newEntries = incoming.filter((e) => {
          const key = `${e.actor}:${e.text}`
          if (seenMessages.current.has(key)) return false
          seenMessages.current.add(key)
          return true
        })
        if (newEntries.length > 0) {
          setLocalChat((prev) => [...prev, ...newEntries])
        }

        if (data.status === 'stopped') clearInterval(interval)
      } catch {
        // swallow transient poll errors
      }
    }

    poll()
    const interval = setInterval(poll, 2000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [gameId])

  async function handleMove(notation: string, order: number) {
    const move: GameMove = { actor: 'user', order, notation, message: '' }
    setPendingMove(move)
    try {
      await api.makeMove(gameId, { actor: 'user', order, notation })
    } catch {
      setPendingMove(null)
    }
  }

  async function handleStop() {
    if (game?.status === 'stopped') {
      onStop()
      return
    }
    setStopping(true)
    try {
      await api.stopGame(gameId)
    } finally {
      setStopping(false)
      onStop()
    }
  }

const isStopped = game?.status === 'stopped'
  const isWaiting = !isStopped && chessMoves.length > 0 && chessMoves.at(-1)?.actor === 'user'
  const displayName = userName || game?.userName || '—'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-6 items-stretch">
        {/* Board column: engine label → board → user label */}
        <div className="shrink-0 flex flex-col gap-2">
          {/* Engine level (black / top side) */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-800 border border-gray-600 inline-block" />
              <span className="text-sm font-semibold text-gray-700">
                {game?.engineLevel ?? '—'} Engine
              </span>
            </div>
            {isWaiting && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                Thinking…
              </span>
            )}
          </div>

          <ChessBoard
            moves={boardMoves}
            onMove={handleMove}
            disabled={isWaiting || !game || isStopped}
          />

          {/* User (white / bottom side) */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-white border-2 border-gray-400 inline-block" />
              <span className="text-sm font-semibold text-gray-700">{displayName}</span>
              {isStopped && <span className="text-xs text-gray-400 italic">finished</span>}
            </div>
            {game?.status === 'active' && (
              <button
                onClick={handleStop}
                disabled={stopping}
                className="px-3 py-1 text-sm text-white rounded bg-red-500 hover:bg-red-600 disabled:opacity-50"
              >
                {stopping ? 'Stopping…' : 'Stop Game'}
              </button>
            )}
          </div>
        </div>

        {/* Move list */}
        <div className="w-44 border border-gray-200 rounded p-3 overflow-hidden">
          <MoveList
            moves={allMoves}
            selectedPly={isStopped ? selectedPly : undefined}
            onSelectPly={isStopped ? setSelectedPly : undefined}
          />
        </div>

        {/* Chat */}
        <div className="flex-1 border border-gray-200 rounded p-3 overflow-hidden">
          <ChatArea entries={localChat} />
        </div>
      </div>
    </div>
  )
}
