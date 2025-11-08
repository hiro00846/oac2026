'use client'

import { useState, useMemo } from 'react'
import { Snapshot } from '@/types'

interface SidebarProps {
  snapshots: Snapshot[]
  onDelete: (snapshotId: string) => void
  onTimeClick: (time: string) => void
}

type SortOrder = 'asc' | 'desc'

export default function Sidebar({ snapshots, onDelete, onTimeClick }: SidebarProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // タイムスタンプを秒数に変換（HH:MM:SS.S形式に対応）
  const timeToSeconds = (time: string): number => {
    const parts = time.split(':')
    if (parts.length === 3) {
      const secondsPart = parts[2].split('.')
      const s = Number(secondsPart[0]) || 0
      const dec = Number(secondsPart[1]) || 0
      return (Number(parts[0]) || 0) * 3600 + (Number(parts[1]) || 0) * 60 + s + dec / 10
    }
    return 0
  }

  // ソートされたスナップショット
  const sortedSnapshots = useMemo(() => {
    const sorted = [...snapshots].sort((a, b) => {
      const timeA = timeToSeconds(a.time)
      const timeB = timeToSeconds(b.time)
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA
    })
    return sorted
  }, [snapshots, sortOrder])
  const handleDownload = (snapshot: Snapshot) => {
    const url = snapshot.blobUrl || snapshot.url
    if (!url) return

    const link = document.createElement('a')
    link.href = url
    link.download = `snapshot_${snapshot.time.replace(/:/g, '-')}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <aside className="w-96 bg-gray-100 border-l border-gray-300 overflow-y-auto h-full">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">スナップショット一覧</h2>
          {sortedSnapshots.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortOrder('desc')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  sortOrder === 'desc'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                降順
              </button>
              <button
                onClick={() => setSortOrder('asc')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  sortOrder === 'asc'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                昇順
              </button>
            </div>
          )}
        </div>
        {sortedSnapshots.length === 0 ? (
          <p className="text-gray-500 text-center py-8">スナップショットがありません</p>
        ) : (
          <div className="space-y-4">
            {sortedSnapshots.map((snapshot) => {
              const imageUrl = snapshot.blobUrl || snapshot.url
              return (
                <div
                  key={snapshot.snapshotId}
                  className="bg-white rounded-lg shadow-md p-3 border border-gray-200"
                >
                  <div className="relative w-full aspect-video mb-2 bg-gray-200 rounded overflow-hidden">
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt={`Snapshot at ${snapshot.time}`}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    タイムスタンプ:{' '}
                    <button
                      onClick={() => onTimeClick(snapshot.time)}
                      className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-mono"
                    >
                      {snapshot.time}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(snapshot)}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                    >
                      ダウンロード
                    </button>
                    <button
                      onClick={() => onDelete(snapshot.snapshotId)}
                      className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}

