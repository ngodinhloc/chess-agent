import type { GameHistoryItem } from '../types/game'

interface Props {
  items: GameHistoryItem[]
  loading: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  onNewGame: () => void
  isOpen: boolean
  onToggle: () => void
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const levelColor: Record<string, string> = {
  Amateur: 'bg-green-100 text-green-700',
  Intermediate: 'bg-yellow-100 text-yellow-700',
  Professional: 'bg-red-100 text-red-700',
}

export default function GameHistory({ items, loading, selectedId, onSelect, onNewGame, isOpen, onToggle }: Props) {
  return (
    <aside
      className={`flex-shrink-0 bg-white border-r border-gray-200 flex flex-col transition-all duration-200 ${
        isOpen ? 'w-64' : 'w-10'
      }`}
    >
      {/* Toggle button + title */}
      <div className={`h-12 flex items-center gap-2 border-b border-gray-200 ${isOpen ? 'px-3' : 'justify-center'}`}>
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-gray-100 text-gray-500 shrink-0"
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? '' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
          </svg>
        </button>
        {isOpen && <span className="text-base font-bold text-gray-900 truncate">Chess Engine</span>}
      </div>

      {/* New Game button — always visible */}
      <div className={`border-b border-gray-200 ${isOpen ? 'p-3' : 'flex justify-center py-3'}`}>
        <button
          onClick={onNewGame}
          title="New Game"
          className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors ${
            isOpen ? 'w-full justify-center px-3 py-2 text-sm font-medium' : 'p-1.5'
          }`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {isOpen && <span>New Game</span>}
        </button>
      </div>

      {/* History list */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            History
          </div>
          {loading ? (
            <div className="p-4 text-sm text-gray-400 text-center">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-sm text-gray-400 text-center">No games yet</div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`w-full text-left px-3 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selectedId === item.id ? 'bg-blue-50 border-l-2 border-l-blue-400' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-sm font-medium text-gray-800 truncate">{item.userName}</span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${
                      levelColor[item.engineLevel] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {item.engineLevel}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {formatDate(item.startedAt)} · {item.totalMoves} move{item.totalMoves !== 1 ? 's' : ''}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </aside>
  )
}
