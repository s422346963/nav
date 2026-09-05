import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    // 构建时间戳：运行时与 localStorage 比对实现"检测到更新"的缓存失效
    __BUILD_DATETIME__: JSON.stringify(new Date().toISOString()),
  },
})
