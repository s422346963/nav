# WayNav · 路标导航

轻量、免费、开源的导航网站。左侧分类导航 + 右侧卡片内容区，支持多引擎搜索、后台可视化管理与 GitHub 数据同步。

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
npm run preview  # 本地预览构建产物
```

## 功能特性

### 前台（`#/`）

- 左侧全高侧边栏（品牌 logo + 分类树 + 底部入口），可收起为仅图标模式（220px ↔ 64px）
- 顶栏仅覆盖右侧内容区：未滚动时透明（图标随背景自动切换明暗），滚动后变毛玻璃
- Hero 区大搜索框：多引擎切换（站内 / Baidu / Bing / Google，可在 `search.json` 配置），
  支持综合 / 分类 / 标题 / 描述 / 链接 / 当前分类等搜索维度
- 网站卡片：收藏置顶、复制链接、编辑、移动、删除（登录后显示操作按钮）

### 后台管理（`#/system/xxx`）

- 访问门禁：未登录自动跳转 `#/login`，填写 GitHub Personal Access Token（需仓库 Contents 读写权限）校验通过后进入
- 子路由区分页签，刷新不丢失：`/system/web`、`/system/setting`、`/system/info`、`/system/bookmark`
- **网站管理**：
  - 表格化管理一级 / 二级 / 三级分类与网站（勾选批量删除、行内编辑）
  - 行拖拽排序 + 置顶 / 置底
  - 上传同步（db.json 到仓库）/ 撤销本地修改 / 下载备份 / 导入备份
  - 「检索异常网站」：仅检测当前选中分类，每批 5 个并发（no-cors + favicon 图片双层探测）
- **网站设置**：与 `settings.json` 逐项对应、一项一行，底部固定「保存设置」/「上传 settings.json」
- **书签导入**：解析浏览器书签 HTML，增量导入（按 URL 去重）
- **网站信息**：Token（脱敏显示）、构建时间（北京时间）、当前版本

## 数据与配置

`public/data/*.json` 是唯一数据源（只读数据库），运行时打进构建产物：

| 文件 | 说明 |
| --- | --- |
| `db.json` | 三级分类 + 网站树 |
| `settings.json` | 站点配置（见下表） |
| `search.json` | 搜索引擎列表 |

### settings.json 字段

| 字段 | 说明 |
| --- | --- |
| `favicon` | 站点图标，站内搜索图标同源 |
| `title` | 站点标题（浏览器标签页标题） |
| `showThemeToggle` | 顶栏显示主题切换按钮 |
| `createWebKey` | 新增网站快捷键（默认 `E`） |
| `sideLogo` / `sideTitle` | 侧边栏品牌图 / 标题（留空回退 favicon / title） |
| `gitHubCDN` | CDN 域名替换目标（默认 `cdn.jsdelivr.net`） |
| `gitRepoUrl` / `branch` | 数据仓库与分支（GitHub URL，后台可改，优先于 localStorage 配置） |
| `imageRepoUrl` / `imageBranch` | 图床仓库与分支（图片上传专用，不配置则无法上传图片） |
| `apiUrl` | 网站信息抓取 API（URL 失焦自动填充名称 / 图标 / 描述） |

以上字段均可在后台「网站设置」面板逐项修改并上传同步。

## 登录与发布流程

1. **权限**：访客完全只读（`ownVisible` 节点被过滤、无任何写入口）；GitHub Token 登录后拥有全部写权限
2. **编辑**：所有改动实时持久化到 `localStorage`（构建时间戳变化时自动清缓存，提示"检测到更新"）
3. **同步**：后台点「上传同步」/「上传 settings.json」，通过 GitHub Contents API 提交到
   `{gitRepoUrl}/{branch}` 的 `public/data/*.json`，触发 CI 重新部署
4. **图片上传**：编辑网站图标 / 侧边栏 logo 可直接上传本地图片，提交到图床仓库
   `{imageRepoUrl}/{imageBranch}` 的 `_upload/` 目录，并回填 jsDelivr CDN 地址

## 项目结构

```
src/
├── components/        # Sidebar / Header / SearchBar / Card / WebGroups /
│                      # EditWebModal / EditClassModal / MoveWebModal / ui（Button/Input/Modal/Toast…）
├── lib/               # github（Contents API）、dfs（dfsNavs 遍历）、
│                      # normalize（数据规范化）、utils（fuzzySearch 等）、tree、bookmark
├── pages/
│   ├── Home.tsx       # 前台主页
│   ├── Login.tsx      # 登录页（GitHub Token 校验）
│   ├── System.tsx     # 后台框架（侧栏 + 顶栏 + 子路由）
│   └── system/        # WebPanel / BookmarkPanel / SettingsPanel / InfoPanel
├── store/             # useNavStore（数据 + 权限）、useModalStore、useThemeStore、toast
└── types/             # 数据模型（INavProps / IWebProps / ISettings…）
```

## 数据模型约定

- **三级分类树**：一级 → 二级 → 三级 → 网站（`db.json`），分类节点带 `title`，网站节点带 `url`
- **URL 前缀**：`!` 开头表示原始 HTML（描述中注入执行）、`^` 本窗口打开、`@` 站内路由、`@apply` 收集入口
- **`rId` 镜像**：一个网站可镜像到多个分类，删除时通过 `rId` 级联清理
- **置顶**：`top` 标记快捷方式，`topTypes` 决定置顶的主题位置
- **`ownVisible`**：仅登录可见，未登录时整枝过滤
- **排序**：节点按 `index` 字段升序排列（拖拽 / 置顶 / 置底 / 上移下移均调整该值）

## 许可证

本项目基于 [GNU General Public License v3.0 (GPL-3.0)](https://www.gnu.org/licenses/gpl-3.0.html) 开源，
完整许可证文本见 [LICENSE](LICENSE)：

- 任何人可自由使用、修改、分发本项目
- 修改或衍生代码必须同样以 GPL-3.0 开源
- 分发时必须保留版权与许可证声明
