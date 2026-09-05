/// <reference types="vite/client" />

// 构建时间戳（vite.config.ts define 注入），用于本地缓存失效
declare const __BUILD_DATETIME__: string

// 应用版本号（vite.config.ts define 注入），网站信息面板展示
declare const __APP_VERSION__: string
