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
| Linter/Formatter | Biome v2.2.5 |

## Project Structure

```
app/                      # Next.js App Router
├── (Layout)/            # Layout components
│   ├── desktop/         # Desktop HeaderBar, ToolBar
│   └── mobile/          # Mobile HeaderBar, ToolBar
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
│   ├── version/         # Version check endpoint
│   └── webhook/         # Webhook handlers
├── changelog/           # Changelog page
├── confirm/             # Email confirmation page
├── dashboard/           # User dashboard
├── data/                # Data statistics
├── info/                # Info page
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
├── PostEditor/          # Post editor (desktop/mobile)
└── Threads/             # Post list components

modules/                 # Business logic modules
├── api/
├── customStatusCode/
├── getSigDataById/
├── getSigListAPI/
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
