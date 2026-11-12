# Architecture

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) |
| UI | React 19 |
| Language | TypeScript 5.9 (strict mode) |
| Styling | Tailwind CSS v4 + SCSS modules |
| Auth | NextAuth.js v4 (Google OAuth) |
| Data Fetching | TanStack Query v5 |
| Markdown Editor | md-editor-rt |
| Charts | Chart.js + Recharts |
| HTTP Client | Axios |
| Linter/Formatter | Biome v2.3.13 |

## Project Structure

```
app/                      # Next.js App Router
├── (Layout)/            # Layout components
│   ├── desktop/         # Desktop HeaderBar (search, avatar menu), SideRail
│   ├── mobile/          # Mobile HeaderBar, ToolBar (tab bar)
│   └── nav.ts           # Nav sections and the 我的 hub entries
├── (home)/              # Home page
│   ├── apis/            # Home page API calls
│   ├── desktop/         # Desktop home components
│   └── mobile/          # Mobile home components
├── [userID]/            # User profile page
├── admin/               # Admin panel
│   ├── (admin)/         # Admin shared config
│   ├── sig-leader/      # SIG leader management
│   ├── sig-advisor/     # SIG advisor management
│   ├── sig-members/     # SIG member list
│   ├── post/            # Post management
│   └── post-query/      # Post range query
├── api/                 # Next.js API Routes
│   ├── auth/            # NextAuth routes
│   └── version/         # Version check endpoint
├── about/               # 關於 MDSIG (info, dashboard, changelog, status)
├── changelog/           # changelog.json only (shown on /about)
├── confirm/             # Email confirmation page
├── events/              # 活動 (site-wide events)
├── explore/             # 探索
├── me/                  # 我的 hub, me/drafts
├── new/                 # New post page
├── post/[postID]/       # Post detail
│   ├── (post)/          # Post content components
│   └── edit/            # Edit post
├── styles/              # Global styles
│   ├── globals.css      # Tailwind + global CSS
│   └── variables.scss   # SCSS variables
├── device.tsx           # Responsive device detection
├── layout.tsx           # Root layout
├── page.tsx             # Home page
├── providers.tsx        # React Context Providers
└── not-found.tsx        # 404 page

components/              # Reusable components
├── Information/
├── NotFound/
├── PostCard/            # Compact post card, InfiniteThreadList
├── PostEditor/          # Post editor (desktop/mobile)
└── Threads/             # Older paged post lists (render PostCard)

modules/                 # Business logic modules
├── api/
│   └── getBranchVersion/
├── customStatusCode/
├── imageUploadAPI/
├── markdownToPlainText/
├── maxMatch/
├── validation/
└── sigAPI/
    └── function/        # API function implementations

interfaces/              # TypeScript type definitions
utils/                   # Utility hooks
public/                  # Static assets
```

## Desktop shell

`app/device.tsx` renders the header (with the site notices under it), the
58px side rail and the page in the `.wrap` grid (`app/styles/globals.css`):
row 1 the header across both columns, row 2 the rail and the page. There is
no floating dock. Phones get a fixed header and the five-tab bar. See
`docs/features.md` (Navigation shell).

Desktop pages scroll the window (owner decision 2026-11-13), not their
columns:

- The header row (`[data-shell="top"]`) is sticky at the top; the rail is
  sticky under it (`top: var(--shell-header-h)`, full window height, its
  SIG list scrolls inside when long).
- `:root` defines `--shell-header-h` (4rem) and `--shell-top` (header +
  site notices + 1.5rem): the `top` of every sticky side panel.
- Page columns have no `overflow-y-auto` and no `h-full`. `SplitBlock`'s
  side column is `sticky; top: var(--shell-top)` with a max height and
  its own thin scrollbar; `DocPage` is plain flow.
- Infinite lists observe the viewport (no scrolling ancestor), and the
  browser restores the scroll position on back / forward.
- Only `/admin` (`.layout-admin`) keeps a fixed-height layout, and phones
  keep their fixed header and tab bar with the page areas scrolling.
- Scrollbars: the page scrollbar and `.custom-scrollbar` (inner areas) are
  thin with a transparent track; inner thumbs stay faint until hovered.

## Responsive Design Pattern

Every UI feature must have both desktop and mobile implementations:
- Desktop: `desktop/` subdirectory
- Mobile: `mobile/` subdirectory
- Breakpoint detection: `useIsMobile` hook (breakpoint: 1024px)

## Dynamic Imports

The Markdown editor must be loaded client-side only:

```typescript
const Editor = dynamic(() => import("md-editor-rt"), { ssr: false });
```
