'use client'

import { useEffect, useRef, useState } from 'react'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'

interface CropModalProps {
  isOpen: boolean
  imageUrl: string
  onClose: () => void
  onDownload: (croppedImageBlob: Blob) => void
  videoFileName?: string
  time?: string
}

export default function CropModal({
  isOpen,
  imageUrl,
  onClose,
  onDownload,
  videoFileName,
  time,
}: CropModalProps) {
  const imageRef = useRef<HTMLImageElement>(null)
  const previewRef = useRef<HTMLCanvasElement>(null)
  const cropperRef = useRef<Cropper | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')

  const handlePreviewCrop = () => {
    if (!cropperRef.current) {
      console.error('Cropper instance not found')
      return
    }

    if (!previewRef.current) {
      console.error('Preview canvas not found')
      return
    }

    if (!imageRef.current) {
      console.error('Image element not found')
      return
    }

    try {
      const croppedCanvas = cropperRef.current.getCroppedCanvas({
        width: 1440,
        height: 810,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high' as ImageSmoothingQuality,
      })

      if (!croppedCanvas) {
        console.error('Failed to get cropped canvas')
        return
      }

      const ctx = previewRef.current.getContext('2d')
      if (!ctx) {
        console.error('Failed to get canvas context')
        return
      }

      // 元の画像の表示サイズを取得
      const cropperContainer = cropperRef.current.getContainerData()
      const originalWidth = cropperContainer.width
      const originalHeight = cropperContainer.height

      // プレビューを元の画像と同じサイズに設定
      previewRef.current.width = originalWidth
      previewRef.current.height = originalHeight

      // キャンバスをクリア
      ctx.clearRect(0, 0, originalWidth, originalHeight)

      // 画像を描画（元の画像と同じサイズで表示）
      ctx.drawImage(croppedCanvas, 0, 0, originalWidth, originalHeight)
      
      // プレビューURLを設定（表示用）
      const dataUrl = previewRef.current.toDataURL('image/jpeg', 0.95)
      setPreviewUrl(dataUrl)
    } catch (error) {
      console.error('Error in handlePreviewCrop:', error)
    }
  }

  useEffect(() => {
    if (isOpen) {
      // モーダルが開かれたときにプレビューをリセット
      setPreviewUrl('')
      
      // 画像の読み込みを待ってからCropperを初期化
      const initCropper = () => {
        if (imageRef.current && !cropperRef.current && imageRef.current.complete) {
          cropperRef.current = new Cropper(imageRef.current, {
            aspectRatio: 16 / 9,
            viewMode: 1,
            guides: true,
            minCropBoxHeight: 100,
            minCropBoxWidth: 100,
            background: false,
            responsive: true,
            autoCropArea: 0.8,
            checkOrientation: false,
          })
        }
      }

      if (imageRef.current) {
        if (imageRef.current.complete) {
          initCropper()
        } else {
          imageRef.current.addEventListener('load', initCropper, { once: true })
        }
      }
    }

    return () => {
      if (cropperRef.current) {
        cropperRef.current.destroy()
        cropperRef.current = null
      }
    }
  }, [isOpen, imageUrl])

  const handleCrop = () => {
    if (!cropperRef.current) return

    setIsProcessing(true)

    // トリミングされた画像を1440x810pxで取得
    const croppedCanvas = cropperRef.current.getCroppedCanvas({
      width: 1440,
      height: 810,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high' as ImageSmoothingQuality,
    })

    if (!croppedCanvas) {
      setIsProcessing(false)
      return
    }

    // キャンバスからBlobを取得
    croppedCanvas.toBlob(
      (blob: Blob | null) => {
        setIsProcessing(false)
        if (blob) {
          onDownload(blob)
          // モーダルを開いたままにする（onClose()を削除）
        }
      },
      'image/jpeg',
      0.95
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">画像をトリミング</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            disabled={isProcessing}
          >
            ×
          </button>
        </div>
        <div className="p-4 flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* クロップ前（編集可能） */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">元の画像（編集）</h3>
              <div className="border border-gray-300 rounded overflow-hidden">
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Crop"
                  style={{ maxWidth: '100%', display: 'block' }}
                />
              </div>
              <div className="mt-2">
                <button
                  onClick={handlePreviewCrop}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                >
                  クロップ
                </button>
              </div>
            </div>
            {/* クロップ後（プレビュー） */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">プレビュー（1440x810px）</h3>
              <div className="border border-gray-300 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                <canvas
                  ref={previewRef}
                  className="max-w-full h-auto"
                  style={{ display: previewUrl ? 'block' : 'none', width: '100%' }}
                />
                {!previewUrl && (
                  <p className="text-gray-400 text-sm">「クロップ」ボタンをクリックしてプレビューを表示</p>
                )}
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <p>アスペクト比: 16:9</p>
            <p>出力サイズ: 1440x810px</p>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            disabled={isProcessing}
          >
            キャンセル
          </button>
          <button
            onClick={handleCrop}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isProcessing}
          >
            {isProcessing ? '処理中...' : 'ダウンロード'}
          </button>
        </div>
      </div>
    </div>
  )
}

