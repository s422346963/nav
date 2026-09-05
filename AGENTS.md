# AGENTS.md — WayNav (路标导航)

Lightweight open-source navigation/start-page site: front page (category sidebar + site cards + multi-engine search) plus an admin backend that syncs data to GitHub. React 18 + TypeScript (strict) + Vite 6 + Tailwind CSS v4 + zustand + react-router-dom (HashRouter). The detailed Chinese README.md is the authoritative feature reference.

## Commands

- `npm run dev` — dev server on http://localhost:5173
- `npm run build` — `tsc --noEmit && vite build` (this is also the typecheck; there is **no test suite and no lint config**)
- `npm run preview` — preview `dist/` build

Verify changes with `npm run build` unless the user says otherwise.

## Architecture

- **Data source**: `public/data/*.json` is the read-only runtime database — `db.json` (3-level category tree + sites), `settings.json`, `search.json`. It gets baked into the build; edit it only via the admin backend's GitHub Contents API upload (which triggers CI on the *data repo* — no workflows live in this repo).
- **`src/lib/github.ts`** — GitHub API layer: `verifyToken`, `updateFileContent`, `uploadDb`, `uploadSettings`, `uploadImage` (images go to a separate image repo's `_upload/` dir and get jsDelivr CDN URLs back).
- **`src/store/`** — zustand stores. `useNavStore` holds nav data + auth/permissions and persists edits to `localStorage` (keys via `STORAGE_KEY_MAP`); pushing to GitHub is a separate explicit upload action. `useModalStore`, `useThemeStore`, `toast` are separate stores.
- **`src/lib/`** — pure helpers: `dfs` (nav tree traversal), `normalize`, `tree`, `utils` (fuzzySearch), `bookmark` (browser bookmark HTML import).
- **Routes (HashRouter, defined in `src/App.tsx`)**: `#/` Home, `#/login` (GitHub PAT login), `#/system/:tab` admin (`web` / `setting` / `info` / `bookmark`). Guests are fully read-only; `ownVisible` nodes are filtered for them.
- **Path alias**: `@/*` → `src/*`. Vite also injects globals `__BUILD_DATETIME__` and `__APP_VERSION__` (see `vite.config.ts`) — a changed build timestamp clears the localStorage cache ("检测到更新").
- **Code splitting**: route pages (`Home`/`System`/`Login` in `App.tsx`) and the four admin panels (`System.tsx`) are `React.lazy`-loaded; `vite.config.ts` routes all `node_modules` into a `vendor` chunk via `manualChunks`. Keep new pages/panels lazy — don't re-import them statically.

## Conventions & gotchas

- User-facing strings and comments are **Chinese**; type names use the `I` prefix (`IWebProps`, `INavProps`, `ISettings` in `src/types/nav.ts`).
- Tailwind v4 via the `@tailwindcss/vite` plugin — **no tailwind.config.js**; theme tokens and the `dark` custom variant live in `src/index.css` (`--color-primary` etc.). Dark mode toggles a `.dark` class.
- Shared UI primitives (Button/Input/Modal/Toast…) live in `src/components/ui.tsx`; icons come from `lucide-react`.
- Web-entry URL prefixes are load-bearing: `!` = raw HTML injected into description, `^` = open in same window, `@` = in-site route, `@apply` = collection entry.
- Site ordering is the numeric `index` field (drag/pin/top/bottom all mutate it); a site can be mirrored into multiple categories via `rId` — deletions must cascade through `rId`; pinning uses `top` + `topTypes`.
- Never store tokens/secrets in code — the PAT is user-entered at `#/login` and kept in localStorage only.
