import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import type { GameMove } from '../types/game'

interface Props {
  moves: GameMove[]
  onMove: (notation: string, order: number) => void
  disabled: boolean
}

function buildFen(moves: GameMove[]): string {
  const chess = new Chess()
  for (const move of moves) {
    if (!move.notation) continue
    try {
      chess.move(move.notation)
    } catch {
      break
    }
  }
  return chess.fen()
}

function nextUserOrder(moves: GameMove[]): number {
  return moves.filter((m) => m.actor === 'user').length + 1
}

export default function ChessBoard({ moves, onMove, disabled }: Props) {
  const fen = buildFen(moves)

  function onPieceDrop(sourceSquare: string, targetSquare: string): boolean {
    if (disabled) return false

    const chess = new Chess(fen)
    try {
      const result = chess.move({ from: sourceSquare, to: targetSquare, promotion: 'q' })
      if (!result) return false
      onMove(result.san, nextUserOrder(moves))
      return true
    } catch {
      return false
    }
  }

  return (
    <div className="rounded-lg border-2 border-gray-300 shadow-lg overflow-hidden">
      <Chessboard
        position={fen}
        onPieceDrop={onPieceDrop}
        boardWidth={600}
        arePiecesDraggable={!disabled}
      />
    </div>
  )
}
