"use client";

import { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { Snapshot, VideoSourceType } from "@/types";

interface VideoPlayerProps {
  videoUrl: string;
  videoId: string | null;
  videoSourceType: VideoSourceType;
  onSnapshot: (snapshot: Snapshot) => void;
}

export default function VideoPlayer({
  videoUrl,
  videoId,
  videoSourceType,
  onSnapshot,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!videoRef.current || !videoUrl) return;

    // video要素にcrossOrigin属性を設定
    if (videoRef.current) {
      videoRef.current.crossOrigin = "anonymous";
    }

    // video.jsプレイヤーを初期化
    if (!playerRef.current) {
      playerRef.current = videojs(videoRef.current, {
        controls: true,
        responsive: true,
        fluid: true,
        crossorigin: "anonymous",
      });
    } else {
      // 既存のプレイヤーのsrcを更新
      playerRef.current.src({ type: "video/mp4", src: videoUrl });
      // crossOriginも更新
      if (videoRef.current) {
        videoRef.current.crossOrigin = "anonymous";
      }
    }

    // クリーンアップ
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [videoUrl]);

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(s).padStart(2, "0")}`;
  };

  const handleSnap = async () => {
    if (
      !playerRef.current ||
      !videoId ||
      !canvasRef.current ||
      !videoRef.current
    )
      return;

    const player = playerRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Canvasに現在のフレームを描画
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Blobを生成
    canvas.toBlob(
      async (blob) => {
        if (!blob) return;

        const currentTime = player.currentTime() || 0;
        const timeString = formatTime(currentTime);

        // Blob URLを作成して即時表示
        const blobUrl = URL.createObjectURL(blob);
        const tempSnapshot: Snapshot = {
          snapshotId: `temp-${Date.now()}`,
          url: "",
          time: timeString,
          blobUrl,
        };

        // 即座にサイドバーに表示
        onSnapshot(tempSnapshot);

        // バックエンドへ送信
        try {
          const formData = new FormData();
          formData.append("file", blob, "snapshot.jpg");
          formData.append("videoId", videoId);
          formData.append("time", timeString);

          const response = await fetch("http://localhost:3001/api/snapshot", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            // 実際のスナップショットデータで更新
            const actualSnapshot: Snapshot = {
              snapshotId: data.snapshotId,
              url: `http://localhost:3001${data.url}`,
              time: data.time,
              blobUrl,
            };
            // 一時的なスナップショットを実際のものに置き換え
            onSnapshot(actualSnapshot);
          } else {
            console.error("Failed to save snapshot");
          }
        } catch (error) {
          console.error("Error saving snapshot:", error);
        }
      },
      "image/jpeg",
      0.9
    );
  };

  if (!videoUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <p className="text-gray-500 text-lg">動画を読み込んでください</p>
      </div>
    );
  }

  // YouTubeの場合はiframeで表示（スナップショット機能は利用不可）
  if (videoSourceType === "youtube") {
    return (
      <div className="h-full flex flex-col">
        <div
          className="flex-1 bg-black rounded-lg overflow-hidden mb-4 relative"
          style={{ paddingBottom: "56.25%" }}
        >
          <iframe
            src={videoUrl}
            className="absolute top-0 left-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube video player"
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <button
            disabled
            className="px-8 py-3 bg-gray-400 text-white font-bold rounded-lg shadow-lg cursor-not-allowed"
          >
            Snap（YouTubeでは利用不可）
          </button>
          <p className="text-sm text-gray-500 text-center max-w-md">
            YouTubeの動画はセキュリティ上の理由により、スナップショット機能は利用できません
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 bg-black rounded-lg overflow-hidden mb-4">
        <video
          ref={videoRef}
          className="video-js vjs-big-play-centered"
          playsInline
          crossOrigin="anonymous"
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      </div>
      <div className="flex justify-center">
        <button
          onClick={handleSnap}
          className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg transition-colors"
          disabled={!videoId}
        >
          Snap
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
