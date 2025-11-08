'use client'

import { Snapshot } from '@/types'

interface SidebarProps {
  snapshots: Snapshot[]
  onDelete: (snapshotId: string) => void
}

export default function Sidebar({ snapshots, onDelete }: SidebarProps) {
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
        <h2 className="text-xl font-bold mb-4">スナップショット一覧</h2>
        {snapshots.length === 0 ? (
          <p className="text-gray-500 text-center py-8">スナップショットがありません</p>
        ) : (
          <div className="space-y-4">
            {snapshots.map((snapshot) => {
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
                    タイムスタンプ: {snapshot.time}
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

