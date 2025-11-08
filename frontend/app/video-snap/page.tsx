'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import VideoPlayer from '@/components/VideoPlayer'
import Sidebar from '@/components/Sidebar'
import { Snapshot, VideoSourceType } from '@/types'

export default function VideoSnapPage() {
  const [videoUrl, setVideoUrl] = useState<string>('')
  const [videoId, setVideoId] = useState<string | null>(null)
  const [videoSourceType, setVideoSourceType] = useState<VideoSourceType>('file')
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [seekTo, setSeekTo] = useState<number | null>(null)
  const [videoFileName, setVideoFileName] = useState<string>('')

  const handleVideoLoad = (url: string, id: string, sourceType: VideoSourceType, fileName?: string) => {
    // 古いBlob URLをクリーンアップ
    if (videoUrl && videoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(videoUrl)
    }
    
    setVideoUrl(url)
    setVideoId(id)
    setVideoSourceType(sourceType)
    setVideoFileName(fileName || '')
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

    // 0.3秒以内のスナップショットが既に存在するかチェック
    const snapshotSeconds = timeToSeconds(snapshot.time)
    const hasNearTime = snapshots.some((s) => {
      if (s.snapshotId.startsWith('temp-')) return false
      const existingSeconds = timeToSeconds(s.time)
      return Math.abs(snapshotSeconds - existingSeconds) <= 0.3
    })

    if (hasNearTime) {
      // 0.3秒以内のスナップショットが既に存在する場合は追加しない
      console.log(`0.3秒以内（${snapshot.time}）のスナップショットは既に存在します`)
      return
    }

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

  const handleTimeClick = (time: string) => {
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

    const seconds = timeToSeconds(time)
    setSeekTo(seconds)
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
            existingTimes={snapshots
              .filter((s) => !s.snapshotId.startsWith('temp-'))
              .map((s) => s.time)}
            seekTo={seekTo}
            onSeekComplete={() => setSeekTo(null)}
          />
        </main>
        <Sidebar
          snapshots={snapshots}
          onDelete={handleDeleteSnapshot}
          onTimeClick={handleTimeClick}
          videoFileName={videoFileName}
        />
      </div>
    </div>
  )
}


