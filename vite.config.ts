import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { gzipSync, brotliCompressSync } from 'zlib'
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, resolve } from 'path'
import type { Plugin, ResolvedConfig } from 'vite'

/** Inline compression plugin — generates .gz and .br for every JS/CSS/HTML/SVG asset */
function compressionPlugin(): Plugin {
  let cfg: ResolvedConfig
  return {
    name: 'vite:compression',
    apply: 'build' as const,
    configResolved(c) { cfg = c },
    closeBundle() {
      const outDir = resolve(cfg.root, cfg.build.outDir ?? 'dist')
      const compress = (dir: string) => {
        try {
          for (const f of readdirSync(dir)) {
            const p = join(dir, f)
            if (statSync(p).isDirectory()) compress(p)
            else if (/\.(js|css|html|svg|json)$/.test(f)) {
              const buf = readFileSync(p)
              writeFileSync(p + '.gz', gzipSync(buf, { level: 9 }))
              writeFileSync(p + '.br', brotliCompressSync(buf))
            }
          }
        } catch {}
      }
      compress(outDir)
    },
  }
}

export default defineConfig({
  plugins: [react(), compressionPlugin()],

  build: {
    target: 'es2020',
    minify: 'esbuild',
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1500,

    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) return 'vendor-react'
          if (id.includes('/framer-motion/')) return 'vendor-motion'
          if (id.includes('/gsap/') || id.includes('/@gsap/')) return 'vendor-gsap'
          if (id.includes('/openai/') || id.includes('/ai/') || id.includes('/axios/')) return 'vendor-ai'
          if (id.includes('/react-markdown/') || id.includes('/remark') || id.includes('/unified/')) return 'vendor-markdown'
          return 'vendor'
        },
      },
    },
  },
})
