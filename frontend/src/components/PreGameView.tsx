import ChessBoard from './ChessBoard'
import MoveList from './MoveList'

export default function PreGameView() {
  return (
    <div className="flex gap-6 items-stretch opacity-40 pointer-events-none select-none">
      <div className="shrink-0">
        <ChessBoard moves={[]} onMove={() => {}} disabled={true} />
      </div>
      <div className="w-56 border border-gray-200 rounded p-3 overflow-hidden">
        <MoveList moves={[]} />
      </div>
    </div>
  )
}
