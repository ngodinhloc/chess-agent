import { useEffect, useRef } from 'react'
import type { GameMove } from '../types/game'

interface HalfMove {
  notation: string
  plyIndex: number
}

interface PliedPair {
  order: number
  white: HalfMove | null
  black: HalfMove | null
}

interface Props {
  moves: GameMove[]
  selectedPly?: number | null
  onSelectPly?: (plyIndex: number) => void
}

function buildPliedPairs(moves: GameMove[]): PliedPair[] {
  const chessMoves = moves.filter((m) => m.notation && m.order > 0)
  const map = new Map<number, PliedPair>()

  chessMoves.forEach((move, plyIndex) => {
    if (!map.has(move.order)) {
      map.set(move.order, { order: move.order, white: null, black: null })
    }
    const pair = map.get(move.order)!
    if (move.actor === 'user') pair.white = { notation: move.notation, plyIndex }
    else pair.black = { notation: move.notation, plyIndex }
  })

  return Array.from(map.values()).sort((a, b) => a.order - b.order)
}

export default function MoveList({ moves, selectedPly, onSelectPly }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement | HTMLSpanElement>(null)
  const pairs = buildPliedPairs(moves)
  const interactive = !!onSelectPly

  // Auto-scroll to selected move when ply changes; otherwise scroll to bottom
  useEffect(() => {
    if (selectedPly != null) {
      selectedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [selectedPly, pairs.length])

  function cellClass(plyIndex: number) {
    const selected = selectedPly === plyIndex
    return [
      'text-left font-mono',
      interactive ? 'cursor-pointer rounded px-1 hover:bg-blue-50' : '',
      selected ? 'bg-blue-100 text-blue-700 font-semibold' : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2 px-1">Moves</h2>
      <div className="flex-1 overflow-y-auto text-sm">
        {pairs.length === 0 ? (
          <p className="text-gray-400 text-xs px-1">No moves yet</p>
        ) : (
          pairs.map((pair) => (
            <div key={pair.order} className="flex gap-1 px-1 py-0.5 rounded hover:bg-gray-50">
              <span className="text-gray-400 w-6 shrink-0 font-mono">{pair.order}.</span>

              {pair.white &&
                (interactive ? (
                  <button
                    ref={selectedPly === pair.white.plyIndex ? (selectedRef as React.RefObject<HTMLButtonElement>) : undefined}
                    onClick={() => onSelectPly!(pair.white!.plyIndex)}
                    className={`w-16 shrink-0 ${cellClass(pair.white.plyIndex)}`}
                  >
                    {pair.white.notation}
                  </button>
                ) : (
                  <span className="w-16 shrink-0 font-mono font-medium">{pair.white.notation}</span>
                ))}

              {pair.black &&
                (interactive ? (
                  <button
                    ref={selectedPly === pair.black.plyIndex ? (selectedRef as React.RefObject<HTMLButtonElement>) : undefined}
                    onClick={() => onSelectPly!(pair.black!.plyIndex)}
                    className={cellClass(pair.black.plyIndex)}
                  >
                    {pair.black.notation}
                  </button>
                ) : (
                  <span className="font-mono text-gray-600">{pair.black.notation}</span>
                ))}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
