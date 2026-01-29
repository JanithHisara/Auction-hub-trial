'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'

interface Props {
  images: string[]
  onChange: (images: string[]) => void
}

export default function ImageUploader({ images, onChange }: Props) {
  const [uploading, setUploading] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleFileSelect = async (index: number, file: File) => {
    setError(null)
    setUploading(index)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Upload failed')
      }

      const { url } = await res.json()
      const newImages = [...images]
      newImages[index] = url
      onChange(newImages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(null)
    }
  }

  const handleDrop = (index: number, e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(index, file)
    }
  }

  const addImage = () => {
    onChange([...images, ''])
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages.length > 0 ? newImages : [''])
  }

  const updateImageUrl = (index: number, url: string) => {
    const newImages = [...images]
    newImages[index] = url
    onChange(newImages)
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {images.map((url, index) => (
        <div key={index} className="space-y-2">
          {/* Upload Zone / Preview */}
          <div
            onDrop={(e) => handleDrop(index, e)}
            onDragOver={(e) => e.preventDefault()}
            className={`relative border-2 border-dashed rounded-xl transition-all ${
              url 
                ? 'border-emerald-500/30 bg-emerald-500/5' 
                : 'border-[var(--border)] hover:border-[var(--gold)]/50 bg-[var(--surface)]'
            }`}
          >
            {url ? (
              // Image Preview
              <div className="relative aspect-video">
                <img
                  src={url}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => updateImageUrl(index, '')}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : uploading === index ? (
              // Uploading State
              <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)]">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-sm">Uploading...</p>
              </div>
            ) : (
              // Upload Zone
              <label className="flex flex-col items-center justify-center py-12 cursor-pointer">
                <input
                  ref={(el) => { fileInputRefs.current[index] = el }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(index, file)
                  }}
                />
                <Upload className="w-8 h-8 text-[var(--text-muted)] mb-2" />
                <p className="text-sm text-[var(--text-secondary)]">
                  Drop image or <span className="text-[var(--gold)]">browse</span>
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Max 5MB • JPG, PNG, WebP, GIF
                </p>
              </label>
            )}
          </div>

          {/* URL Input (alternative) */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="url"
                value={url}
                onChange={(e) => updateImageUrl(index, e.target.value)}
                placeholder="Or paste image URL..."
                className="w-full pl-10 text-sm"
              />
            </div>
            {images.length > 1 && (
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="p-2.5 bg-red-500/20 border border-red-500/40 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addImage}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] rounded-lg hover:border-[var(--gold)]/50 transition-colors w-full justify-center"
      >
        <Upload className="w-4 h-4" /> Add Another Image
      </button>
    </div>
  )
}
