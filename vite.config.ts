import { defineConfig } from 'vite'
import pkg from './package.json'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // 第三方依赖单独拆 chunk：应用代码更新时 vendor 长缓存不失效
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    // 构建时间戳：运行时与 localStorage 比对实现"检测到更新"的缓存失效
    __BUILD_DATETIME__: JSON.stringify(new Date().toISOString()),
    // 应用版本号：网站信息面板展示
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
})
