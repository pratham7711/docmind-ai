'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useDropzone, FileRejection } from 'react-dropzone'
import { uploadDocument } from '@/lib/api'
import { useToast } from '@/components/Toast'

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

function formatSize(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function estimatePages(bytes: number): number {
  // rough estimate: ~75KB per page of scanned PDF
  return Math.max(1, Math.round(bytes / (75 * 1024)))
}

export default function UploadPage() {
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace('/login')
    },
  })
  const router = useRouter()
  const { toast } = useToast()

  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((accepted: File[], rejected: FileRejection[]) => {
    setError(null)
    if (rejected.length > 0) {
      const msg = rejected[0].errors[0]?.message ?? 'Invalid file'
      setError(msg)
      return
    }
    if (accepted.length > 0) {
      setFile(accepted[0])
      setProgress(0)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: MAX_SIZE_BYTES,
    multiple: false,
    disabled: uploading,
  })

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError(null)
    setProgress(0)

    try {
      const result = await uploadDocument(file, (pct) => setProgress(pct))
      toast('PDF uploaded successfully!', 'success')
      router.push(`/chat/new?doc_id=${result.doc_id}`)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Upload failed. Please try again.'
      setError(message)
      toast(message, 'error')
      setUploading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
      {/* Top bar */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <a
          href="/dashboard"
          className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-sm"
        >
          ← Dashboard
        </a>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[#818cf8] font-bold text-xs">
            D
          </div>
          <span className="text-sm font-medium text-white/60">DocMind AI</span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Upload a PDF</h1>
            <p className="text-white/40 text-sm">
              Drop your document below to start asking questions.
            </p>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`
              relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer
              transition-all duration-200
              ${isDragActive
                ? 'border-indigo-500/70 bg-indigo-500/10 scale-[1.01]'
                : file
                  ? 'border-indigo-500/40 bg-indigo-500/5'
                  : 'border-white/15 bg-white/[0.02] hover:border-indigo-500/40 hover:bg-indigo-500/5'
              }
              ${uploading ? 'pointer-events-none opacity-75' : ''}
            `}
          >
            <input {...getInputProps()} />

            {file ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-2xl">
                  📄
                </div>
                <div>
                  <p className="font-medium text-white/90 truncate max-w-xs">{file.name}</p>
                  <p className="text-sm text-white/40 mt-0.5">
                    {formatSize(file.size)} · ~{estimatePages(file.size)} pages
                  </p>
                </div>
                {!uploading && (
                  <p className="text-xs text-indigo-300/70">
                    Click or drop to replace
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl">
                  📁
                </div>
                <div>
                  <p className="font-medium text-white/70">
                    {isDragActive ? 'Drop it here…' : 'Drop PDF here or click to browse'}
                  </p>
                  <p className="text-sm text-white/30 mt-1">PDF only · max 10 MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {uploading && (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-white/40 mb-2">
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`
              mt-5 w-full py-3.5 rounded-xl font-semibold text-sm transition-all
              ${file && !uploading
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 transform'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
              }
            `}
          >
            {uploading ? 'Uploading…' : 'Upload & Start Chat →'}
          </button>

          <p className="text-center text-xs text-white/20 mt-4">
            Your PDF is processed securely and never shared.
          </p>
        </div>
      </div>
    </div>
  )
}
