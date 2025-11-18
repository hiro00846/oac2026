"use client";

import { useEffect, useRef, useState } from "react";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

export default function ImageCropPage() {
  const imageRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<Cropper | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // ファイル処理の共通関数
  const handleFile = (file: File) => {
    // 画像ファイルかチェック
    if (!file.type.startsWith("image/")) {
      alert("画像ファイルを選択してください");
      return;
    }

    // 既存のBlob URLをクリーンアップ
    if (imageUrl && imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imageUrl);
    }
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setPreviewUrl("");

    // Cropperをリセット
    if (cropperRef.current) {
      cropperRef.current.destroy();
      cropperRef.current = null;
    }
  };

  // 画像ファイル選択時の処理
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

  // Cropperの初期化
  useEffect(() => {
    if (imageUrl && imageRef.current) {
      const initCropper = () => {
        if (
          imageRef.current &&
          !cropperRef.current &&
          imageRef.current.complete
        ) {
          cropperRef.current = new Cropper(imageRef.current, {
            aspectRatio: 16 / 9, // 1440x810のアスペクト比
            viewMode: 1,
            guides: true,
            minCropBoxHeight: 100,
            minCropBoxWidth: 100,
            background: false,
            responsive: true,
            autoCropArea: 0.8,
            checkOrientation: false,
          });
        }
      };

      if (imageRef.current.complete) {
        initCropper();
      } else {
        imageRef.current.addEventListener("load", initCropper, { once: true });
      }
    }

    return () => {
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
    };
  }, [imageUrl]);

  // クロップ処理
  const handleCrop = () => {
    if (!cropperRef.current) {
      alert("画像を選択してください");
      return;
    }

    setIsProcessing(true);

    try {
      // 1440x810pxでクロップされた画像を取得
      const croppedCanvas = cropperRef.current.getCroppedCanvas({
        width: 1440,
        height: 810,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high" as ImageSmoothingQuality,
      });

      if (!croppedCanvas) {
        alert("クロップに失敗しました");
        setIsProcessing(false);
        return;
      }

      // プレビュー用のURLを生成
      const dataUrl = croppedCanvas.toDataURL("image/jpeg", 0.95);
      setPreviewUrl(dataUrl);
    } catch (error) {
      console.error("Error in handleCrop:", error);
      alert("クロップ処理中にエラーが発生しました");
    } finally {
      setIsProcessing(false);
    }
  };

  // ダウンロード処理
  const handleDownload = () => {
    if (!previewUrl) {
      alert("先にクロップを実行してください");
      return;
    }

    // データURLからBlobを作成
    fetch(previewUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cropped-image-${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error("Download error:", error);
        alert("ダウンロードに失敗しました");
      });
  };

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imageUrl);
      }
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [imageUrl, previewUrl]);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">画像クロップツール</h1>

        {/* 2カラムレイアウト */}
        {imageUrl && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左側: 画像参照エリア（Cropper） */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4">元の画像（編集）</h2>
              <div
                className="border border-gray-300 rounded overflow-hidden bg-gray-100"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Crop"
                  style={{ maxWidth: "100%", display: "block" }}
                />
              </div>
              <div className="mt-4">
                <button
                  onClick={handleCrop}
                  disabled={isProcessing}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "処理中..." : "クロップ実行"}
                </button>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <p>アスペクト比: 16:9</p>
                <p>出力サイズ: 1440x810px</p>
              </div>
            </div>

            {/* 右側: クロップ結果 */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4">
                クロップ結果（1440x810px）
              </h2>
              <div className="border border-gray-300 rounded overflow-hidden bg-gray-100 flex items-center justify-center min-h-[300px]">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Cropped"
                    className="max-w-full h-auto"
                    style={{ width: "100%", height: "auto" }}
                  />
                ) : (
                  <p className="text-gray-400 text-sm text-center">
                    「クロップ実行」ボタンをクリックして
                    <br />
                    プレビューを表示してください
                  </p>
                )}
              </div>
              {previewUrl && (
                <div className="mt-4">
                  <button
                    onClick={handleDownload}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                  >
                    ダウンロード
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 画像が選択されていない場合のドロップゾーン */}
        {!imageUrl && (
          <div
            className={`bg-white rounded-lg shadow-md p-12 text-center border-2 border-dashed transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-4">
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
              <div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  画像をドラッグ＆ドロップ
                </p>
                <p className="text-sm text-gray-500 mb-4">または</p>
                <label className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer transition-colors">
                  ファイルを選択
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
