# AGENTS.md — WayNav（路标导航）

轻量、免费、开源的导航网站：前台由一套共享布局承载三个页面——首页 `#/`（本地收藏）、搜索 `#/search`（多引擎 + 站内搜索结果）、分类 `#/nav`（侧栏分类树 + 网站卡片），另有把数据同步到 GitHub 的后台管理。技术栈：React 18 + TypeScript（strict）+ Vite 6 + Tailwind CSS v4 + zustand + react-router-dom（HashRouter）。功能细节以中文 `README.md` 为准。

## 常用命令

- `npm run dev` — 开发服务器 http://localhost:5173
- `npm run build` — `tsc --noEmit && vite build`（同时就是类型检查；**没有测试用例，也没有 lint 配置**）
- `npm run preview` — 预览 `dist/` 构建产物

除用户另有说明外，用 `npm run build` 验证改动。

## 架构

- **数据源**：`public/data/*.json` 是运行时只读数据库——`db.json`（三级分类树 + 网站）、`settings.json`、`search.json`，会被打进构建产物；只能通过后台的 GitHub Contents API 上传修改（会触发*数据仓库*的 CI，本仓库不含任何 workflow）。
- **`src/lib/github.ts`** — GitHub API 层：`verifyToken`、`updateFileContent`、`uploadDb`、`uploadSettings`、`uploadImage`（图片提交到独立图床仓库的 `_upload/` 目录，回填 jsDelivr CDN 地址）。
- **`src/store/`** — zustand stores。`useNavStore` 持有导航数据 + 登录态/权限，编辑结果持久化到 `localStorage`（键见 `STORAGE_KEY_MAP`），推送到 GitHub 是单独的显式上传动作。`useFavoriteStore` 是纯客户端的收藏列表（`FAVORITES` 键，存 name/url/icon/desc 快照，因此分类被删或未登录过滤后依然可用；永不上传）。`useUiStore` 存前台布局状态（桌面端侧栏开合 + 已展开的一级分类），**必须放在 store**：在 `/`、`/search`、`/nav` 之间切换会重建 `AppLayout`/`Sidebar`，局部 state 会被静默重置。`useModalStore`、`useThemeStore`、`toast` 各自独立。
- **`src/components/`** — `AppLayout`（前台外壳：Sidebar + Header + Hero `SearchBar` + BackTop + 三个全局编辑弹窗 + `createWebKey` 快捷键；三个页面只传内容、`currentOneId`/`currentTwoId`、`homeActive`、`defaultParentId`；`currentOneId` 为 null 时（首页 / 无来源分类的搜索页）会清空已展开的分类树）、`Sidebar`（品牌 + 分类滚动区上方的固定「首页」入口；一级项可展开/收起，侧栏收起时悬停一级项弹出 `fixed` 定位的二级浮层）、`Header`（右侧：主题切换 → 后台管理 → 退出登录）、`Card`（hover 操作栏：收藏/复制/编辑/移动/删除）、`Favorites`（首页列表：仅复制链接 / 移除收藏），以及各编辑弹窗与 `ui.tsx` 基础组件。
- **`src/lib/`** — 纯工具：`dfs`（导航树遍历）、`normalize`（数据规范化）、`tree`、`utils`（fuzzySearch 等）、`bookmark`（浏览器书签 HTML 导入）、`currentClass`（`useCurrentClass()`：按 `?id=` → `localStorage.location` → 第一个分类解析当前分类，三个前台页面共用）。
- **路由（HashRouter，定义在 `src/App.tsx`）**：前台三个页面共用一套布局——`#/` 首页（`Favorites`）、`#/search?q=`（`Search`，保留 `&id=`/`&type=`）、`#/nav?id=`（`Nav`，卡片列表）；旧地址 `#/?id=`/`#/?q=` 由 `LegacyHome` 重定向。侧栏选中态只看 URL 是否带 `?id=`，因此从首页发起的搜索仍高亮「首页」，不会跳到记忆中的分类；`localStorage.location` 只在显式带 `?id=` 时写入。另有 `#/login`（GitHub PAT 登录）、`#/system/:tab` 后台（`web` / `setting` / `info` / `bookmark`）。访客完全只读，`ownVisible` 节点会被过滤。
- **路径别名**：`@/*` → `src/*`。Vite 还注入全局量 `__BUILD_DATETIME__`、`__APP_VERSION__`（见 `vite.config.ts`）——构建时间戳变化会清除 localStorage 缓存（提示「检测到更新」）。
- **代码分割**：路由页面（`App.tsx` 里的 `Home`/`Search`/`Nav`/`System`/`Login`）和后台四个面板（`System.tsx`）都用 `React.lazy`；`vite.config.ts` 通过 `manualChunks` 把 `node_modules` 统一归入 `vendor` chunk。新增页面/面板保持懒加载，不要改成静态导入。`App.tsx` 会在空闲时预取 `Search`/`Nav`：Suspense 在最外层，不预取的话刷新后首次点菜单会挂起整页。

## 约定与坑

- 面向用户的文案与注释一律**中文**；类型名用 `I` 前缀（`src/types/nav.ts` 里的 `IWebProps`、`INavProps`、`ISettings`）。
- Tailwind v4 走 `@tailwindcss/vite` 插件——**没有 tailwind.config.js**；主题变量与 `dark` 自定义 variant 都在 `src/index.css`（`--color-primary` 等）。暗黑模式切换 `.dark` class。
- 通用 UI 基础组件（Button/Input/Modal/Toast…）在 `src/components/ui.tsx`；图标来自 `lucide-react`。
- 网站 URL 前缀是有语义的：`!` = 描述里注入原始 HTML、`^` = 本窗口打开、`@` = 站内路由、`@apply` = 收集入口。
- 网站排序用数字字段 `index`（拖拽/置顶/置底都会改它）；一个网站可通过 `rId` 镜像到多个分类，删除必须沿 `rId` 级联；置顶用 `top` + `topTypes`。
- 永远不要把 token/密钥写进代码——PAT 由用户在 `#/login` 输入，只存 localStorage。
- 收藏仅存在于客户端（`FAVORITES` 键），绝不能上传/同步；`useNavStore.logout()` 会清 `token`/`WEBSITE_DB`/`SETTINGS_DB`，但有意保留收藏。
- 卡片 hover 操作栏靠右对齐、宽度锁死（`w-[86px]`、`flex-wrap justify-end`），每行 3 个、最多两行（5 个按钮）。按钮必须保持纯图标 `flex` 盒（约 21px）：行内按钮会继承 `line-height` 撑到约 32px 高，两行就会溢出约 60px 的卡片。
- 侧栏收起态的悬停浮层挂在「一级项分组 div」的子节点上（鼠标移入浮层不会触发分组的 mouseleave），但按视口坐标 `position: fixed` 定位——侧栏的 `overflow-hidden` 不会裁剪它；nav 滚动时会关闭浮层，因为位置会失效。
- 二级菜单的展开动画（`grid-template-rows` 过渡）需要首帧处于「收起」状态：前台页面间跳转会重建 `Sidebar`，若首帧就应用持久化的展开态，元素一上来就是展开的，过渡不会触发。因此用 `animateOpen`（挂载后隔两帧置为 true）门控 `grid-rows-[1fr]`，改这块时不要删掉。
