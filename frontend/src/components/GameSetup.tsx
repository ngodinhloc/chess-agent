import { useState } from 'react'
import type { EngineLevel } from '../types/game'

interface Props {
  onStart: (userName: string, engineLevel: EngineLevel) => void
  loading: boolean
}

export default function GameSetup({ onStart, loading }: Props) {
  const [userName, setUserName] = useState('')
  const [engineLevel, setEngineLevel] = useState<EngineLevel>('Amateur')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userName.trim()) return
    onStart(userName.trim(), engineLevel)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 flex-wrap">
      <input
        type="text"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        placeholder="Your name"
        className="px-3 py-2 rounded border border-gray-300 focus:outline-none focus:border-blue-500 text-sm w-44"
        disabled={loading}
      />
      <select
        value={engineLevel}
        onChange={(e) => setEngineLevel(e.target.value as EngineLevel)}
        className="px-3 py-2 rounded border border-gray-300 focus:outline-none focus:border-blue-500 text-sm"
        disabled={loading}
      >
        <option value="Amateur">Amateur</option>
        <option value="Intermediate">Intermediate</option>
        <option value="Professional">Professional</option>
      </select>
      <button
        type="submit"
        disabled={loading || !userName.trim()}
        className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Starting…' : 'Start Game'}
      </button>
    </form>
  )
}
