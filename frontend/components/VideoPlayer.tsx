"use client";

import { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { Snapshot, VideoSourceType } from "@/types";

interface VideoPlayerProps {
  videoUrl: string;
  videoId: string | null;
  videoSourceType: VideoSourceType;
  onSnapshot: (snapshot: Snapshot) => void;
  existingTimes?: string[];
  seekTo?: number | null;
  onSeekComplete?: () => void;
}

export default function VideoPlayer({
  videoUrl,
  videoId,
  videoSourceType,
  onSnapshot,
  existingTimes = [],
  seekTo,
  onSeekComplete,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTime, setCurrentTime] = useState<string>("00:00:00");

  useEffect(() => {
    if (!videoRef.current || !videoUrl) return;

    // Blob URLの場合はcrossOriginは不要、通常のURLの場合は設定
    if (videoRef.current && !videoUrl.startsWith("blob:")) {
      videoRef.current.crossOrigin = "anonymous";
    } else if (videoRef.current && videoUrl.startsWith("blob:")) {
      videoRef.current.crossOrigin = null;
    }

    // video.jsプレイヤーを初期化
    if (!playerRef.current) {
      playerRef.current = videojs(videoRef.current, {
        controls: true,
        responsive: true,
        fluid: false,
        aspectRatio: "16:9",
        crossorigin: videoUrl.startsWith("blob:") ? undefined : "anonymous",
        userActions: {
          hotkeys: false,
          doubleClick: false,
        },
        pictureInPicture: {
          ui: false,
        },
      });

      // タイムコード更新のイベントリスナー
      playerRef.current.on("timeupdate", () => {
        const time = playerRef.current?.currentTime() || 0;
        setCurrentTime(formatTime(time));
      });
    } else {
      // 既存のプレイヤーのsrcを更新
      playerRef.current.src({ type: "video/mp4", src: videoUrl });
      // crossOriginも更新
      if (videoRef.current) {
        if (videoUrl.startsWith("blob:")) {
          videoRef.current.crossOrigin = null;
        } else {
          videoRef.current.crossOrigin = "anonymous";
        }
      }
      // タイムコード更新のイベントリスナーを再設定
      playerRef.current.off("timeupdate");
      playerRef.current.on("timeupdate", () => {
        const time = playerRef.current?.currentTime() || 0;
        setCurrentTime(formatTime(time));
      });
    }

    // クリーンアップ（コンポーネントのアンマウント時のみ）
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [videoUrl]);

  // seekToが変更されたら動画の再生位置を変更
  useEffect(() => {
    if (seekTo !== null && seekTo !== undefined && playerRef.current) {
      playerRef.current.currentTime(seekTo);
      if (onSeekComplete) {
        onSeekComplete();
      }
    }
  }, [seekTo, onSeekComplete]);

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const dec = Math.floor((seconds % 1) * 10); // 0.1秒単位
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(s).padStart(2, "0")}.${dec}`;
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

        // タイムスタンプを秒数に変換（HH:MM:SS.S形式に対応）
        const timeToSeconds = (time: string): number => {
          const parts = time.split(":");
          if (parts.length === 3) {
            const secondsPart = parts[2].split(".");
            const s = Number(secondsPart[0]) || 0;
            const dec = Number(secondsPart[1]) || 0;
            return (
              (Number(parts[0]) || 0) * 3600 +
              (Number(parts[1]) || 0) * 60 +
              s +
              dec / 10
            );
          }
          return 0;
        };

        // 0.3秒以内のスナップショットが既に存在するかチェック
        const currentSeconds = currentTime;
        const hasNearTime = existingTimes.some((existingTime) => {
          const existingSeconds = timeToSeconds(existingTime);
          return Math.abs(currentSeconds - existingSeconds) <= 0.3;
        });

        if (hasNearTime) {
          alert(`0.3秒以内（${timeString}）のスナップショットは既に存在します`);
          return;
        }

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
      <div className="h-full flex flex-col max-h-full">
        <div
          className="flex-shrink-0 rounded-lg mb-4 relative"
          style={{
            maxHeight: "calc(100vh - 200px)",
            paddingBottom: "56.25%",
            width: "100%",
          }}
        >
          <iframe
            src={videoUrl}
            className="absolute top-0 left-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube video player"
          />
        </div>
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
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
    <div className="h-full flex flex-col max-h-full">
      <div
        className="flex-shrink-0 rounded-lg mb-4 flex flex-col items-center justify-center p-2"
        style={{ maxHeight: "calc(100vh - 250px)" }}
      >
        {/* タイムコードとスナップボタン */}
        <div
          className="flex items-center gap-2 mb-2 w-full"
          style={{ maxWidth: "85%" }}
        >
          <div className="px-4 py-2 bg-gray-800 text-white text-sm font-mono rounded">
            {currentTime}
          </div>
          <button
            onClick={handleSnap}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow-lg transition-colors flex items-center gap-2"
            disabled={!videoId}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span>Snap</span>
          </button>
        </div>
        <div
          className="w-full"
          style={{
            maxWidth: "85%",
            maxHeight: "calc(100vh - 300px)",
            aspectRatio: "16/9",
            position: "relative",
          }}
        >
          <video
            ref={videoRef}
            className="video-js vjs-big-play-centered"
            playsInline
            crossOrigin={videoUrl.startsWith("blob:") ? undefined : "anonymous"}
            data-setup="{}"
            onDoubleClick={(e) => e.preventDefault()}
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
