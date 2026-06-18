import { useEffect, useRef } from 'react'
import type { ChatEntry } from '../types/game'

interface Props {
  entries: ChatEntry[]
}

export default function ChatArea({ entries }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries.length])

  return (
    <div className="h-full overflow-y-auto space-y-1 text-sm">
      {entries.map((entry, i) => (
        <div key={i} className="flex items-baseline gap-2">
          {entry.actor === 'agent' ? (
            <span className="shrink-0 inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded bg-indigo-600 text-white">
              Agent
            </span>
          ) : (
            <span className="shrink-0 text-xs font-semibold text-blue-600">You</span>
          )}
          {entry.notation && (
            <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-gray-100 text-gray-600 border border-gray-200">
              {entry.notation}
            </span>
          )}
          <span className={entry.actor === 'agent' ? 'text-gray-800 text-sm' : 'text-blue-700 text-sm'}>
            {entry.text}
          </span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
