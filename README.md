# WayNav · 路标导航

轻量、免费、开源的导航网站。左侧分类导航 + 右侧卡片内容区，支持多引擎搜索、本地收藏（无需登录）、后台可视化管理与 GitHub 数据同步。

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

**侧边栏**（左侧全高，可收起为仅图标模式 220px ↔ 64px）：

- 品牌 logo + 顶部固定「首页」入口（不随分类列表滚动，收起态只显示图标）
- 分类树：一级菜单可展开/收起、二级菜单缩进展示；收起侧栏后**悬停一级菜单**会浮出二级菜单面板，点击浮层项直接跳转
- 后台管理页的侧栏不显示「首页」，底部保留「返回主页」入口

**三个前台路由**（可分享、可前进后退，共用同一套侧栏 + 顶栏 + Hero 搜索栏）：

| 页面 | 路由 | 内容 |
| --- | --- | --- |
| 首页（默认） | `#/` | 本地收藏列表 |
| 搜索 | `#/search?q=xx` | 搜索结果（可带 `&type=` 指定搜索范围、`&id=` 记录来源分类） |
| 分类 | `#/nav?id=xx` | 置顶快捷方式 + 二级分类页签 + 网站卡片 |

- 站内搜索统一跳到 `#/search`；从分类页发起搜索会带上 `id`，因此「当前」范围仍是该分类
- 侧栏高亮只看 URL 里有没有 `?id=`：首页 / 搜索页没有 `id` 时侧栏停在「首页」，不会跳到上次选中的分类；
  分类页（`?id=xx`）则高亮该分类。`location` 记忆只在显式带 `?id=` 时更新
- 旧地址兼容：`#/?id=xx` 自动跳 `#/nav?id=xx`，`#/?q=xx` 自动跳 `#/search?q=xx`

**顶栏**仅覆盖右侧内容区：未滚动时透明（图标随背景自动切换明暗），滚动后变毛玻璃。右侧按钮依次为
主题切换（`showThemeToggle` 控制）、后台管理、退出登录（仅后台管理页显示，带二次确认）。

**Hero 大搜索框**：多引擎切换（站内 / Baidu / Bing / Google，可在 `search.json` 配置），
支持综合 / 分类 / 标题 / 描述 / 链接 / 当前分类等搜索维度。

**网站卡片**：hover 操作栏（每行 3 个、最多两行、整体靠右）按需显示
星标收藏 / 复制链接 / 编辑 / 移动 / 删除（编辑、移动、删除登录后可见）。

### 本地收藏（无需登录）

- 收藏只存浏览器 `localStorage`（键 `FAVORITES`），与云端数据、登录态完全解耦：未登录可用，退出登录也不会被清除
- 添加：网站卡片 hover 操作栏最左侧的**星标**按钮，已收藏为实心琥珀色，再点取消收藏；网站收录入口（`@apply`）不显示星标
- 每个收藏保存的是网站快照（名称 / 链接 / 图标 / 描述 / 收藏时间），因此分类被删除、或网站因 `ownVisible` 在未登录时被过滤，收藏依然可用
- 首页的收藏列表：点击卡片跳转，hover 操作栏只有**置顶 / 置底 / 复制链接 / 移除收藏**（本地操作，不涉及云端）

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

运行时另有若干 `localStorage` 键（均不会被上传到仓库）：

| 键 | 说明 |
| --- | --- |
| `token` | 登录用的 GitHub Token |
| `WEBSITE_DB` | 登录后的本地编辑缓存（构建时间戳变化时自动清除） |
| `SETTINGS_DB` | 后台修改的站点设置缓存 |
| `FAVORITES` | 本地收藏列表（与登录态无关，退出登录不清除） |
| `location` | 上次选中的分类 id |

## 登录与发布流程

1. **权限**：访客完全只读（`ownVisible` 节点被过滤、无任何写入口）；GitHub Token 登录后拥有全部写权限。
   本地收藏不属于云端数据，访客与登录用户都能自由增删
2. **编辑**：所有改动实时持久化到 `localStorage`（构建时间戳变化时自动清缓存，提示"检测到更新"）
3. **同步**：后台点「上传同步」/「上传 settings.json」，通过 GitHub Contents API 提交到
   `{gitRepoUrl}/{branch}` 的 `public/data/*.json`，触发 CI 重新部署
4. **图片上传**：编辑网站图标 / 侧边栏 logo 可直接上传本地图片，提交到图床仓库
   `{imageRepoUrl}/{imageBranch}` 的 `_upload/` 目录，并回填 jsDelivr CDN 地址

## 项目结构

```
src/
├── components/        # AppLayout（前台通用布局：侧栏 + 顶栏 + Hero 搜索栏）/
│                      # Sidebar / Header / SearchBar / Card / WebGroups / Favorites /
│                      # EditWebModal / EditClassModal / MoveWebModal / ui（Button/Input/Modal/Toast…）
├── lib/               # github（Contents API）、dfs（dfsNavs 遍历）、currentClass（当前分类解析）、
│                      # normalize（数据规范化）、utils（fuzzySearch 等）、tree、bookmark
├── pages/
│   ├── Home.tsx       # 首页（本地收藏）
│   ├── Search.tsx     # 搜索结果
│   ├── Nav.tsx        # 分类卡片
│   ├── Login.tsx      # 登录页（GitHub Token 校验）
│   ├── System.tsx     # 后台框架（侧栏 + 顶栏 + 子路由）
│   └── system/        # WebPanel / BookmarkPanel / SettingsPanel / InfoPanel
├── store/             # useNavStore（数据 + 权限）、useFavoriteStore（本地收藏）、
│                      # useModalStore、useThemeStore、toast
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
