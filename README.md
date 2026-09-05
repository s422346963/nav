# nav-react

「发现导航」React 重构版（Side 主题），从 `navbin/`（Angular 20）精简移植。

## 技术栈

- React 18 + TypeScript（strict）
- Vite 6 + Tailwind CSS v4
- zustand（状态管理）+ react-router-dom（HashRouter）
- lucide-react（图标）

## 快速开始

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc --noEmit && vite build → dist/
```

## 数据

`public/data/*.json`（db / settings / tag / search）复制自 `navbin/data`，作为只读数据库打进构建产物。

- **未登录**：仅可浏览，`ownVisible` 节点被过滤。
- **登录**（GitHub Token，需仓库 Contents 读写权限）：可前台编辑（卡片 hover 操作 / 快捷键 `E` 新增）、`/system` 后台管理，全部改动持久化在 `localStorage`。
- **发布**：后台 → 设置 → 填写 owner/repo/branch → 上传 `db.json` / `settings.json` 回仓库，触发 CI 部署。
- **缓存失效**：构建时间戳（Vite `define` 注入）与本地记录比对，站点重新部署后自动清除本地编辑缓存，提示"检测到更新"。

## 与原项目的主要差异

仅保留 Side 主题；移除多主题、小组件、i18n、PWA、SEO 脚本、爬虫、自有部署后端、Gitee/GitLab 支持；UI 原语为手写极简组件（未引入 shadcn/Radix）。数据结构、遍历器（`dfsNavs`）、规范化默认值、URL 前缀（`!`/`^`/`@`/`@apply`）、`rId` 级联、置顶（`top`/`topTypes`）、书签增量导入导出等机制与原项目保持兼容。
