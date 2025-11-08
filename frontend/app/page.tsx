'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import VideoPlayer from '@/components/VideoPlayer'
import Sidebar from '@/components/Sidebar'
import { Snapshot, VideoSourceType } from '@/types'

export default function Home() {
  const [videoUrl, setVideoUrl] = useState<string>('')
  const [videoId, setVideoId] = useState<string | null>(null)
  const [videoSourceType, setVideoSourceType] = useState<VideoSourceType>('file')
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])

  const handleVideoLoad = (url: string, id: string, sourceType: VideoSourceType) => {
    // 古いBlob URLをクリーンアップ
    if (videoUrl && videoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(videoUrl)
    }
    
    setVideoUrl(url)
    setVideoId(id)
    setVideoSourceType(sourceType)
    // 既存のスナップショットを読み込む（YouTubeの場合はスキップ）
    if (sourceType !== 'youtube') {
      loadSnapshots(id)
    }
  }

  const loadSnapshots = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/video/${id}/snapshots`)
      if (response.ok) {
        const data = await response.json()
        setSnapshots(data)
      }
    } catch (error) {
      console.error('Failed to load snapshots:', error)
    }
  }

  const handleSnapshot = async (snapshot: Snapshot) => {
    // 一時的なスナップショットの場合は置き換え、そうでなければ追加
    if (snapshot.snapshotId.startsWith('temp-')) {
      setSnapshots((prev) => {
        const filtered = prev.filter((s) => !s.snapshotId.startsWith('temp-'))
        return [snapshot, ...filtered]
      })
    } else {
      setSnapshots((prev) => {
        // 既存の一時的なスナップショットを削除してから追加
        const filtered = prev.filter((s) => !s.snapshotId.startsWith('temp-'))
        return [snapshot, ...filtered]
      })
    }
  }

  const handleDeleteSnapshot = async (snapshotId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/snapshot/${snapshotId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setSnapshots((prev) => prev.filter((s) => s.snapshotId !== snapshotId))
      }
    } catch (error) {
      console.error('Failed to delete snapshot:', error)
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header onVideoLoad={handleVideoLoad} />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 p-4 overflow-hidden flex flex-col">
          <VideoPlayer
            videoUrl={videoUrl}
            videoId={videoId}
            videoSourceType={videoSourceType}
            onSnapshot={handleSnapshot}
          />
        </main>
        <Sidebar
          snapshots={snapshots}
          onDelete={handleDeleteSnapshot}
        />
      </div>
    </div>
  )
}

