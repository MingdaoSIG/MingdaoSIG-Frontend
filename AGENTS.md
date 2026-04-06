# MDSIG Frontend - AI Agent Guide

MDSIG (Mingdao Special Interest Group) 是一個專為明道中學設計的社群分享平台，讓學生與教師能夠交流前瞻趨勢、時事議題，迸發更多學習火花。

## 專案概述

- **名稱**: MDSIG 2.0 Frontend
- **版本**: 2.18.9
- **技術棧**: Next.js 15 + React 19 + TypeScript + Tailwind CSS v4
- **套件管理**: pnpm (v10.18.2)
- **Node 版本**: 23

## 技術架構

### 核心框架與函式庫

| 類別 | 技術 |
|------|------|
| 框架 | Next.js 15 (App Router) |
| UI 函式庫 | React 19 |
| 語言 | TypeScript 5.9 |
| 樣式 | Tailwind CSS v4 + SCSS |
| 認證 | NextAuth.js v4 (Google OAuth) |
| 資料獲取 | TanStack Query (React Query) |
| Markdown 編輯器 | md-editor-rt |
| 提示框 | SweetAlert2 |
| 圖表 | Chart.js + Recharts |
| HTTP 客戶端 | Axios |

### 建置與開發工具

- **建置工具**: Next.js Turbopack
- **程式碼格式化**: Biome (v2.2.5)
- **CSS 處理**: PostCSS with Tailwind CSS plugin
- **字型**: Noto Sans TC (Google Fonts)

## 專案結構

```
app/                      # Next.js App Router
├── (Layout)/            # 版面配置元件
│   ├── desktop/         # 桌面版 HeaderBar, ToolBar
│   └── mobile/          # 行動版 HeaderBar, ToolBar
├── (home)/              # 首頁
│   ├── apis/            # 首頁 API 呼叫
│   ├── desktop/         # 桌面版首頁元件
│   └── mobile/          # 行動版首頁元件
├── [userID]/            # 使用者個人頁面
├── admin/               # 管理後台
│   ├── (admin)/         # 管理後台共用配置
│   ├── sig-leader/      # SIG 領導者管理
│   ├── sig-advisor/     # SIG 指導老師管理
│   ├── sig-members/     # SIG 成員名單
│   ├── post/            # 貼文管理
│   └── post-query/      # 區間發文查詢
├── api/                 # Next.js API Routes
│   ├── auth/            # NextAuth 認證路由
│   ├── export/          # 匯出功能
│   └── webhook/         # Webhook 處理
├── confirm/             # 電子郵件確認頁面
├── dashboard/           # 使用者儀表板
├── data/                # 數據統計頁面
├── info/                # 資訊頁面
├── new/                 # 新增貼文頁面
├── post/[postID]/       # 貼文詳細頁面
│   ├── (post)/          # 貼文內容元件
│   └── edit/            # 編輯貼文
├── styles/              # 全域樣式
│   ├── globals.css      # Tailwind + 全域 CSS
│   └── variables.scss   # SCSS 變數
├── device.tsx           # 響應式裝置偵測
├── layout.tsx           # 根佈局
├── page.tsx             # 首頁
├── providers.tsx        # React Context Providers
└── not-found.tsx        # 404 頁面

components/              # 可複用元件
├── Information/         # 資訊顯示元件
├── NotFound/            # 404 元件
├── PostEditor/          # 貼文編輯器 (桌面/行動版)
└── Threads/             # 貼文列表元件

modules/                 # 業務邏輯模組
├── api/                 # API 相關工具
├── customStatusCode/    # 自定義狀態碼
├── getSigDataById/      # 取得 SIG 資料
├── getSigListAPI/       # 取得 SIG 列表
├── imageUploadAPI/      # 圖片上傳
├── markdownToPlainText/ # Markdown 轉純文字
├── maxMatch/            # 文字匹配工具
├── sigAPI/              # SIG API 統一入口
│   └── function/        # API 函式實作
└── ...

interfaces/              # TypeScript 型別定義
├── Thread.d.ts          # 貼文型別
├── User.d.ts            # 使用者型別
├── Sig.d.ts             # SIG 型別
├── comments.d.ts        # 留言型別
├── Image.interface.ts   # 圖片型別
└── Request.d.ts         # 請求相關型別

utils/                   # 工具 Hooks
├── useAlert/            # 提示框 Hook
├── useFetch/            # 資料獲取 Hook
├── useIsMobile/         # 行動裝置偵測
├── useLocalStorage/     # LocalStorage Hook
├── usePost/             # 貼文相關 Hook
└── useUserAccount/      # 使用者帳號管理

public/                  # 靜態資源
├── badges/              # 徽章圖示
├── icons/               # 介面圖示
├── images/              # 圖片資源
└── videos/              # 影片資源
```

## 開發指令

```bash
# 安裝依賴
pnpm install

# 開發伺服器 (使用 Turbopack)
pnpm dev

# 建置專案 (使用 Turbopack)
pnpm build

# 生產環境啟動
pnpm start

# 程式碼格式化
pnpm lint
```

## 環境變數

專案使用 `.env.local` 儲存環境變數，參考 `.env.local.example`：

```bash
# API 設定
NEXT_PUBLIC_API_URL=https://api.sig.mingdao.edu.tw

# NextAuth 設定
NEXTAUTH_URL=https://sig.mingdao.edu.tw
NEXTAUTH_SECRET=your-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 重要提醒

- `NEXT_PUBLIC_API_URL`: 後端 API 基礎 URL
- 認證僅限 `@ms.mingdao.edu.tw` 明道中學信箱
- NextAuth 使用 Google Provider 進行 OAuth 登入

## 程式碼風格規範

### Biome 配置

專案使用 Biome 進行程式碼格式化和檢查：

- **縮排**: 2 個空格
- **引號**: 雙引號
- **分號**: 自動處理
- **最大行寬**: 預設
- **Import 排序**: 自動組織

### 命名規範

| 類型 | 規範 | 範例 |
|------|------|------|
| 元件檔案 | PascalCase | `PostEditor.tsx` |
| 工具函式 | camelCase | `useFetch.ts` |
| 型別定義 | PascalCase | `TThread`, `User` |
| 樣式檔案 | camelCase + `.module.scss` | `ThreadsList.module.scss` |
| 常數 | UPPER_SNAKE_CASE | `API_BASE_URL` |

### 元件開發規範

1. **響應式設計**: 必須同時提供桌面版 (`desktop/`) 和行動版 (`mobile/`) 實作
2. **裝置偵測**: 使用 `useIsMobile` Hook (斷點: 1024px)
3. **動態載入**: Markdown 編輯器使用 `dynamic(() => import(...), { ssr: false })`
4. **型別定義**: 所有 Props 必須有明確型別

### Import 順序

```typescript
// 1. 第三方套件
import { useState } from "react";
import Image from "next/image";

// 2. 內部型別
import type { TThread } from "@/interfaces/Thread";

// 3. 內部模組
import markdownToPlainText from "@/modules/markdownToPlainText";

// 4. 內部元件/樣式
import style from "./ThreadsList.module.scss";
```

## API 架構

### 自定義狀態碼

專案使用自定義狀態碼 (`modules/customStatusCode/index.ts`)：

| 代碼 | 意義 |
|------|------|
| 2000 | OK - 成功 |
| 4000 | Not found - 找不到 |
| 4001 | Forbidden - 無權限 |
| 401x | Invalid xxx - 無效的參數 |
| 410x | DB Error - 資料庫錯誤 |
| 5000 | Unknown error - 未知錯誤 |

### API 請求模組

位於 `modules/sigAPI/function/_request.ts`，提供統一的 HTTP 請求處理：

```typescript
// GET 請求
const data = await request.get("default", "/post/list", {
  token: "jwt-token",
  requestQuery: { skip: 0, limit: 10 }
});

// POST 請求
const result = await request.post("default", "/post", body, {
  token: "jwt-token"
});
```

### 認證流程

1. 使用 NextAuth.js 進行 Google OAuth
2. 僅接受 `@ms.mingdao.edu.tw` 網域
3. 登入後交換平台 JWT Token
4. Token 儲存於 localStorage (`token` key)

## 使用者權限系統

```typescript
// Permission 等級 (interfaces/User.d.ts)
0: view                    // 僅檢視
1: like, comment           // 按讚、留言、申請加入
2: add new thread (SIG)    // 在特定 SIG 發文
3: add new thread (ALL)    // 在所有 SIG 發文
4: delete member           // 刪除成員
5: review member request   // 審核加入申請
6: delete comment          // 刪除留言
7: manage member permission // 管理成員權限
8: manage thread            // 管理所有貼文
```

## 資料型別

### 貼文 (TThread)

```typescript
interface TThread {
  _id?: string;           // 貼文 ID
  sig: string;            // 所屬 SIG ID
  title: string;          // 標題
  cover: string;          // 封面圖片
  content: string;        // 內容 (Markdown)
  user: string;           // 作者 ID
  hashtag?: string[];     // 標籤
  like?: string[];        // 按讚使用者列表
  likes?: number;         // 按讚數
  comments?: number;      // 留言數
  priority?: number;      // 優先順序
  pinned?: boolean;       // 置頂
  removed?: boolean;      // 是否刪除
  createdAt?: string;     // 建立時間
  updatedAt?: string;     // 更新時間
}
```

### 使用者 (User)

```typescript
interface User {
  _id?: string;           // 使用者 ID
  customId?: string;      // 自定義 ID
  email?: string;         // 信箱
  name?: string;          // 姓名
  code?: string;          // 學號
  class?: string;         // 班級
  identity?: Identity;    // 身份 (teacher/student/alumni)
  sig?: string[];         // 加入的 SIG
  displayName?: string;   // 顯示名稱
  description?: string;   // 描述
  avatar?: string;        // 大頭貼
  badge?: string[];       // 徽章
  follower?: string[];    // 追隨者
  permission?: Permission; // 權限等級
}
```

### SIG

```typescript
interface Sig {
  _id: string;            // SIG ID
  name: string;           // SIG 名稱
  description?: string;   // 描述
  avatar?: string;        // 大頭貼
  follower?: string[];    // 追隨者
  customId?: string;      // 自定義 ID
  moderator?: string[];   // 管理者
  leader?: string[];      // 領導者
  removed?: boolean;      // 是否刪除
  badge?: string[];       // 徽章
}
```

## 特殊功能說明

### 圖片上傳

- 支援格式: webp, jpeg, png, tiff
- 大小限制: 5MB
- 上傳模組: `modules/imageUploadAPI/index.ts`

### Markdown 編輯器

- 使用 `md-editor-rt` 套件
- 預覽主題: github
- 語言: en-US (自定義翻譯於 `layout.tsx`)

### 公告系統

- 公告 SIG ID: `652d60b842cdf6a660c2b778`
- 公告停留時間: 7 天
- 公告樣式: 白色背景、無封面圖

### 無限滾動

貼文列表使用無限滾動載入，實作於 `components/Threads/desktop/ThreadsList.tsx`：

```typescript
// 滾動到底部前 600px 觸發載入
const isNearBottom = scrollTop + clientHeight >= scrollHeight - 600;
```

## 部署注意事項

1. **建置輸出**: `.next/` 目錄
2. **快取控制**: 已於 `next.config.js` 設定 `no-cache` headers
3. **圖片設定**: 允許所有遠端圖片來源
4. **環境變數**: 部署前確認所有環境變數已設定

## 開發注意事項

1. **Session 管理**: 使用 `useUserAccount` Hook 處理登入狀態
2. **API URL**: 一律使用 `process.env.NEXT_PUBLIC_API_URL`
3. **型別檢查**: 開啟 strict mode，所有程式碼必須通過 TypeScript 檢查
4. **本地儲存**: 編輯器內容會自動保存至 localStorage (`editorContent`, `postData`)

## 常見問題排解

### Turbopack 問題

若遇到模組解析問題，檢查 `next.config.js` 中的 `turbopack.resolveAlias` 設定。

### 認證問題

- 確認 `NEXTAUTH_SECRET` 已設定
- 確認 Google OAuth 設定中的 redirect URI 正確

### API 連線問題

- 確認 `NEXT_PUBLIC_API_URL` 設定正確
- 檢查瀏覽器開發者工具 Network 分頁

## 相關連結

- 專案網站: https://sig.mingdao.edu.tw
- 開發團隊: OnCloud, HACO, Lazp, Meru
- 所屬機構: 明道中學 (Mingdao High School)
