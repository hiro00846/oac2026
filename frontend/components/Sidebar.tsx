'use client'

import { useState, useMemo } from 'react'
import { Snapshot } from '@/types'
import CropModal from './CropModal'

interface SidebarProps {
  snapshots: Snapshot[]
  onDelete: (snapshotId: string) => void
  onTimeClick: (time: string) => void
  videoFileName?: string
}

type SortOrder = 'asc' | 'desc'

export default function Sidebar({ snapshots, onDelete, onTimeClick, videoFileName }: SidebarProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedSnapshots, setSelectedSnapshots] = useState<Set<string>>(new Set())
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropImageUrl, setCropImageUrl] = useState<string>('')
  const [cropTime, setCropTime] = useState<string>('')

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

    // ファイル名を生成（拡張子なしの動画ファイル名＋タイムスタンプ）
    let fileName = 'snapshot'
    if (videoFileName) {
      // 拡張子を除いたファイル名を取得
      const nameWithoutExt = videoFileName.replace(/\.[^/.]+$/, '')
      fileName = nameWithoutExt
    }
    const timeString = snapshot.time.replace(/:/g, '-').replace(/\./g, '-')
    const downloadFileName = `${fileName}_${timeString}.jpg`

    const link = document.createElement('a')
    link.href = url
    link.download = downloadFileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleToggleSelect = (snapshotId: string) => {
    setSelectedSnapshots((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(snapshotId)) {
        newSet.delete(snapshotId)
      } else {
        newSet.add(snapshotId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedSnapshots.size === sortedSnapshots.length) {
      setSelectedSnapshots(new Set())
    } else {
      setSelectedSnapshots(new Set(sortedSnapshots.map((s) => s.snapshotId)))
    }
  }

  const handleBulkDownload = async () => {
    if (selectedSnapshots.size === 0) return

    const selected = sortedSnapshots.filter((s) => selectedSnapshots.has(s.snapshotId))
    
    // 1枚ずつダウンロード（少し遅延を入れて連続ダウンロードを防ぐ）
    for (let i = 0; i < selected.length; i++) {
      const snapshot = selected[i]
      await new Promise((resolve) => {
        setTimeout(() => {
          handleDownload(snapshot)
          resolve(undefined)
        }, i * 100) // 100ms間隔でダウンロード
      })
    }
  }

  const handleCrop = (snapshot: Snapshot) => {
    const url = snapshot.blobUrl || snapshot.url
    if (!url) return
    setCropImageUrl(url)
    setCropTime(snapshot.time)
    setCropModalOpen(true)
  }

  const handleCropDownload = (croppedImageBlob: Blob) => {
    // ファイル名を生成（拡張子なしの動画ファイル名＋タイムスタンプ＋_crop）
    let fileName = 'snapshot'
    if (videoFileName) {
      const nameWithoutExt = videoFileName.replace(/\.[^/.]+$/, '')
      fileName = nameWithoutExt
    }
    const timeString = cropTime.replace(/:/g, '-').replace(/\./g, '-')
    const downloadFileName = `${fileName}_${timeString}_crop.jpg`

    const url = URL.createObjectURL(croppedImageBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = downloadFileName
    // 強制ダウンロードのため、target属性を設定
    link.setAttribute('download', downloadFileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
        {sortedSnapshots.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            >
              {selectedSnapshots.size === sortedSnapshots.length ? 'すべて解除' : 'すべて選択'}
            </button>
            {selectedSnapshots.size > 0 && (
              <button
                onClick={handleBulkDownload}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                一括ダウンロード ({selectedSnapshots.size})
              </button>
            )}
          </div>
        )}
        {sortedSnapshots.length === 0 ? (
          <p className="text-gray-500 text-center py-8">スナップショットがありません</p>
        ) : (
          <div className="space-y-4">
            {sortedSnapshots.map((snapshot) => {
              const imageUrl = snapshot.blobUrl || snapshot.url
              return (
                <div
                  key={snapshot.snapshotId}
                  className="bg-white rounded-lg shadow-md p-3 border border-gray-200 relative"
                >
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedSnapshots.has(snapshot.snapshotId)}
                      onChange={() => handleToggleSelect(snapshot.snapshotId)}
                      className="w-5 h-5 cursor-pointer bg-white bg-opacity-70 border-2 border-gray-400 rounded"
                    />
                  </div>
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
                      onClick={() => handleCrop(snapshot)}
                      className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                    >
                      クロップ
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
      <CropModal
        isOpen={cropModalOpen}
        imageUrl={cropImageUrl}
        onClose={() => setCropModalOpen(false)}
        onDownload={handleCropDownload}
        videoFileName={videoFileName}
        time={cropTime}
      />
    </aside>
  )
}

