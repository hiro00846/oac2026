'use client'

import { useState } from 'react'
import { isYouTubeUrl, extractYouTubeVideoId, getYouTubeEmbedUrl } from '@/lib/youtube'
import { VideoSourceType } from '@/types'

interface HeaderProps {
  onVideoLoad: (url: string, videoId: string, sourceType: VideoSourceType) => void
}

export default function Header({ onVideoLoad }: HeaderProps) {
  const [videoUrl, setVideoUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // サーバーにアップロードせず、直接Blob URLを作成して再生
    const blobUrl = URL.createObjectURL(file)
    const videoId = `file-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`
    onVideoLoad(blobUrl, videoId, 'file')
    
    // 入力フィールドをリセット
    e.target.value = ''
  }

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!videoUrl.trim()) return

    setIsLoading(true)
    try {
      // YouTube URLかどうかを判定
      if (isYouTubeUrl(videoUrl)) {
        const youtubeVideoId = extractYouTubeVideoId(videoUrl)
        if (youtubeVideoId) {
          const embedUrl = getYouTubeEmbedUrl(youtubeVideoId)
          onVideoLoad(embedUrl, `youtube-${youtubeVideoId}`, 'youtube')
        } else {
          alert('YouTube URLが無効です')
        }
      } else {
        // 通常のURLの場合は直接使用
        onVideoLoad(videoUrl, `url-${Date.now()}`, 'url')
      }
      setVideoUrl('')
    } catch (error) {
      console.error('Error loading video:', error)
      alert('動画の読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <header className="bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <h1 className="text-2xl font-bold">Video Snapshot App</h1>
        <div className="flex items-center gap-4">
          <form onSubmit={handleUrlSubmit} className="flex items-center gap-2 hidden">
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="動画URLまたはYouTube URLを入力"
              className="px-4 py-2 text-gray-900 rounded"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
              disabled={isLoading}
            >
              読み込み
            </button>
          </form>
          <label className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded cursor-pointer disabled:opacity-50">
            {isLoading ? '読み込み中...' : 'ファイル選択'}
            <input
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isLoading}
            />
          </label>
        </div>
      </div>
    </header>
  )
}

