"use client";

import { useState } from "react";
import Header from "@/components/Header";
import VideoPlayer from "@/components/VideoPlayer";
import Sidebar from "@/components/Sidebar";
import { Snapshot, VideoSourceType } from "@/types";

export default function VideoSnapPage() {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoSourceType, setVideoSourceType] =
    useState<VideoSourceType>("file");
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [seekTo, setSeekTo] = useState<number | null>(null);
  const [videoFileName, setVideoFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  const handleVideoLoad = (
    url: string,
    id: string,
    sourceType: VideoSourceType,
    fileName?: string
  ) => {
    // 古いBlob URLをクリーンアップ
    if (videoUrl && videoUrl.startsWith("blob:")) {
      URL.revokeObjectURL(videoUrl);
    }

    setVideoUrl(url);
    setVideoId(id);
    setVideoSourceType(sourceType);
    setVideoFileName(fileName || "");
    // 既存のスナップショットを読み込む（YouTubeの場合はスキップ）
    if (sourceType !== "youtube") {
      loadSnapshots(id);
    }
  };

  // ファイル処理の共通関数
  const handleFile = (file: File) => {
    // 動画ファイルかチェック
    if (!file.type.startsWith("video/")) {
      alert("動画ファイルを選択してください");
      return;
    }

    // サーバーにアップロードせず、直接Blob URLを作成して再生
    const blobUrl = URL.createObjectURL(file);
    const id = `file-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, "_")}`;
    handleVideoLoad(blobUrl, id, "file", file.name);
  };

  // 動画ファイル選択時の処理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  // ドラッグ＆ドロップ処理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const loadSnapshots = async (id: string) => {
    // ファイルベースの動画で、まだバックエンドに保存されていない場合はスキップ
    if (id.startsWith("file-")) {
      // ファイルベースの動画は、まだバックエンドに保存されていない可能性があるため
      // エラーを無視して空の配列を設定
      setSnapshots([]);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/api/video/${id}/snapshots`
      );
      if (response.ok) {
        const data = await response.json();
        setSnapshots(data);
      } else if (response.status === 404) {
        // 動画IDが存在しない場合は空の配列を設定
        setSnapshots([]);
      }
    } catch (error) {
      // バックエンドが起動していない場合やネットワークエラーの場合
      // エラーをログに記録するが、アプリケーションの動作は継続
      console.warn(
        "Failed to load snapshots (backend may not be running):",
        error
      );
      setSnapshots([]);
    }
  };

  const handleSnapshot = async (snapshot: Snapshot) => {
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

    // 0.3秒以内のスナップショットが既に存在するかチェック（すべてのスナップショットをチェック）
    const snapshotSeconds = timeToSeconds(snapshot.time);
    const hasNearTime = snapshots.some((s) => {
      const existingSeconds = timeToSeconds(s.time);
      return Math.abs(snapshotSeconds - existingSeconds) <= 0.3;
    });

    if (hasNearTime) {
      // 0.3秒以内のスナップショットが既に存在する場合は追加しない
      console.log(
        `0.3秒以内（${snapshot.time}）のスナップショットは既に存在します`
      );
      return;
    }

    // 一時的なスナップショットの場合は、そのまま追加（既存の一時的なスナップショットは保持）
    if (snapshot.snapshotId.startsWith("temp-")) {
      setSnapshots((prev) => {
        // 既存のスナップショットを保持し、新しい一時的なスナップショットを先頭に追加
        return [snapshot, ...prev];
      });
    } else {
      // 実際のスナップショットの場合は、対応する一時的なスナップショットを置き換え
      setSnapshots((prev) => {
        // 同じsnapshotIdが既に存在する場合は更新
        const existingIndex = prev.findIndex(
          (s) => s.snapshotId === snapshot.snapshotId
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = snapshot;
          return updated;
        } else {
          // 対応する一時的なスナップショット（同じ時間のもの）を探して置き換え
          const tempIndex = prev.findIndex(
            (s) => s.snapshotId.startsWith("temp-") && s.time === snapshot.time
          );
          if (tempIndex >= 0) {
            // 一時的なスナップショットを実際のものに置き換え
            const updated = [...prev];
            updated[tempIndex] = snapshot;
            return updated;
          } else {
            // 対応する一時的なスナップショットがない場合は、新しいスナップショットを追加
            return [snapshot, ...prev];
          }
        }
      });
    }
  };

  const handleDeleteSnapshot = async (snapshotId: string) => {
    // 一時的なスナップショット（temp-で始まる）の場合は、バックエンドAPIを呼ばずに直接削除
    if (snapshotId.startsWith("temp-")) {
      setSnapshots((prev) => {
        const snapshot = prev.find((s) => s.snapshotId === snapshotId);
        // Blob URLをクリーンアップ
        if (snapshot?.blobUrl) {
          URL.revokeObjectURL(snapshot.blobUrl);
        }
        return prev.filter((s) => s.snapshotId !== snapshotId);
      });
      return;
    }

    // 実際のスナップショットの場合は、バックエンドAPIを呼び出して削除
    try {
      const response = await fetch(
        `http://localhost:3001/api/snapshot/${snapshotId}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        // バックエンドから削除成功した場合、ローカルからも削除
        setSnapshots((prev) => {
          const snapshot = prev.find((s) => s.snapshotId === snapshotId);
          // Blob URLをクリーンアップ
          if (snapshot?.blobUrl) {
            URL.revokeObjectURL(snapshot.blobUrl);
          }
          return prev.filter((s) => s.snapshotId !== snapshotId);
        });
      } else {
        // バックエンドエラーの場合でも、ローカルからは削除（オフライン対応）
        console.warn(
          "Failed to delete snapshot from backend (status:",
          response.status,
          "), removing from local state"
        );
        setSnapshots((prev) => {
          const snapshot = prev.find((s) => s.snapshotId === snapshotId);
          // Blob URLをクリーンアップ
          if (snapshot?.blobUrl) {
            URL.revokeObjectURL(snapshot.blobUrl);
          }
          return prev.filter((s) => s.snapshotId !== snapshotId);
        });
      }
    } catch (error) {
      // ネットワークエラーの場合でも、ローカルからは削除（オフライン対応）
      console.warn(
        "Failed to delete snapshot (backend may not be running), removing from local state:",
        error
      );
      setSnapshots((prev) => {
        const snapshot = prev.find((s) => s.snapshotId === snapshotId);
        // Blob URLをクリーンアップ
        if (snapshot?.blobUrl) {
          URL.revokeObjectURL(snapshot.blobUrl);
        }
        return prev.filter((s) => s.snapshotId !== snapshotId);
      });
    }
  };

  const handleTimeClick = (time: string) => {
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

    const seconds = timeToSeconds(time);
    setSeekTo(seconds);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header onVideoLoad={handleVideoLoad} />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 p-4 overflow-hidden flex flex-col">
          {videoUrl ? (
            <div
              className="h-full"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <VideoPlayer
                videoUrl={videoUrl}
                videoId={videoId}
                videoSourceType={videoSourceType}
                onSnapshot={handleSnapshot}
                existingTimes={snapshots
                  .filter((s) => !s.snapshotId.startsWith("temp-"))
                  .map((s) => s.time)}
                seekTo={seekTo}
                onSeekComplete={() => setSeekTo(null)}
              />
            </div>
          ) : (
            <div
              className={`bg-white rounded-lg shadow-md border-2 border-dashed transition-colors flex items-center justify-center mx-auto my-auto ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              style={{ width: "800px", height: "400px" }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-4 p-8">
                <svg
                  className="w-16 h-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    動画をドラッグ＆ドロップ
                  </p>
                  <p className="text-sm text-gray-500 mb-4">または</p>
                  <label className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer transition-colors">
                    ファイルを選択
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </main>
        <Sidebar
          snapshots={snapshots}
          onDelete={handleDeleteSnapshot}
          onTimeClick={handleTimeClick}
          videoFileName={videoFileName}
        />
      </div>
    </div>
  );
}
