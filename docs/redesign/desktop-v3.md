# MDSIG Desktop Redesign (v3)

| 項目 | 內容 |
| --- | --- |
| 狀態 | 定案，實作中（`feature/desktop-redesign`） |
| 日期 | 2026-10-15 |
| 範圍 | 桌機版（≥1024px）。行動版不在本次範圍 |
| 視覺參考 | `explore/desktop-visual` 分支的 variant C（原型，不合併） |

---

## 0. 原則

1. **操作不變。** 使用者不需要重新學習介面：header 在上、底部 dock 四顆按鈕（首頁 / 個人 / 發文 / 資訊）、內容左欄 + 資訊右欄，所有按鈕位置與行為維持 prod。改的是「質感、結構、可讀性」，不是「怎麼用」。
2. **平台成熟感。** 不再用大面積背景漸層；顏色更沉穩、圓角更小。
3. **毛玻璃有目的。** 只用在浮在內容上方的介面（header、dock）與次要側欄模組；長時間閱讀的表面一律實心。
4. **易讀性優先。** 長文閱讀的字級、行高、行寬、色彩以繁中長文為基準設計。

---

## 1. Design tokens

單一來源：`app/styles/globals.css` 的 Tailwind v4 `@theme`。同一組變數同時是 CSS 變數（SCSS module 用 `var(--…)`）與 Tailwind utility（`bg-surface`、`text-ink-700`、`rounded-card`…）。

### 1.1 顏色

| Token | 值 | 用途 |
| --- | --- | --- |
| `canvas` | `#e9eef3` | 頁面底色（平塗 + 極淡顆粒紋理，無漸層） |
| `surface` | `#ffffff` | 卡片 |
| `paper` | `#fcfcfb` | 長文閱讀底（近白，降低眩光） |
| `field` | `#f2f5f7` | 輸入框、次要填色 |
| `ink-900` | `#111d29` | 標題 |
| `ink-800` | `#1d2a37` | 強調內文 |
| `ink-700` | `#2f3d4b` | 內文 |
| `ink-500` | `#586676` | 次要資訊（meta、日期） |
| `ink-400` | `#7a8694` | 分隔符號、停用 |
| `line` | `rgba(17,29,41,.10)` | 細線 / 卡片邊框 |
| `line-strong` | `rgba(17,29,41,.16)` | 控制項邊框 |
| `brand` | `#009cdb` | **只用於 logo** |
| `brand-700` | `#0b5a83` | 主要動作、連結（白字對比 > 7:1） |
| `brand-800` | `#094a6c` | hover / 深色文字 |
| `brand-50` | `#e5edf3` | hashtag、icon 底 |
| `warm-600` | `#b9620f` | 公告標記（logo 橘的深化版，少量使用） |

SIG 分類色沿用 `components/Threads/configs/sigDefaultColors.ts`。作為**文字**時一律 `color-mix(sig 55%, ink-900)` 加深（原色中的粉紅在白底上不可讀）；作為**邊框**時用原色。

### 1.2 圓角

| Token | 值 | 用途 |
| --- | --- | --- |
| `rounded-card` | 10px | 卡片、側欄模組、貼文區 |
| `rounded-control` | 8px | 按鈕、輸入框、使用者區塊、SIG 方塊 |
| `rounded-chip` | 6px | hashtag、小 icon 底 |
| dock | 18px | 底部 dock 外框 |

頭像維持圓形。不再使用膠囊形（`rounded-full`）按鈕。

### 1.3 陰影

| Token | 用途 |
| --- | --- |
| `shadow-card` | 卡片：1px 細線 + 極淡雙層陰影 |
| `shadow-card-hover` | 卡片 hover |
| `shadow-glass` | 玻璃：內上緣高光 + 柔和投影 |

---

## 2. 毛玻璃

**配方**（`@utility glass` / `glass-strong`）：

- `backdrop-filter: blur(24px) saturate(180%)`：飽和度讓後方內容透出「顏色」而不是灰霧
- 背景 `rgba(255,255,255,.66)`（header 用 `.8` 的 `glass-strong`；dock `.72`）
- 1px 亮邊 `rgba(255,255,255,.72)` + 內上緣高光
- `@supports not (backdrop-filter: …)` 時退回近實心白

**使用位置**：header、dock、首頁右欄模組、貼文頁作者卡 / 留言卡、閱讀模式工具列。
**不使用**：貼文卡、貼文內文、任何長時間閱讀的表面。

> ⚠️ **只寫標準 `backdrop-filter`，不要同時手寫 `-webkit-backdrop-filter`。**
> Next 的 CSS 編譯器（Lightning CSS）在兩者都寫、值為 `var()` 時，會把標準屬性丟掉只留 `-webkit-`，導致 Chrome / Edge 完全沒有模糊。只寫標準屬性時它會自動補前綴。

---

## 3. 版面

### 3.1 Shell

- **Header**：sticky 頂部玻璃列，高 4rem，內容對齊 1280px 容器。logo（高 2rem）在左，登入 / 管理平台 / 使用者在右。點使用者區塊的行為不變。
- **Dock**：`position: fixed` 浮在底部中央，玻璃，四顆按鈕與順序不變，尺寸為原本的 80%。
- **容器**：`min(80rem, 100% - 4rem)` 置中。

### 3.2 兩欄頁（首頁、貼文頁、個人 / SIG 頁）

- **整頁原生捲動**（取代 `body { overflow: hidden }` + 內部捲動 + 寫死的 `70dvh`）。返回上一頁保留捲動位置、空白鍵翻頁、頁面任何位置的滾輪都能用。
- 主欄 `minmax(0,1fr)`、側欄 `22.5rem`，間距 1.5rem。
- 側欄 `position: sticky`，高度 = 視窗 − header − dock 空間。
- 無限捲動改用 `IntersectionObserver` 觀察列表尾端的 sentinel（`rootMargin` 600px），不依賴特定捲動容器。

### 3.3 其他頁（資訊、Dashboard、資料、更新紀錄、編輯器、管理平台）

本階段維持原本的 app-shell 版面（固定高度），只換上新的底色、表面與圓角。後續階段再逐頁改為整頁捲動。

### 3.4 大面板拆分

- 首頁右欄：原本一整塊撐滿的面板 → 「Top 3 Posts」、「SIGs」兩張獨立玻璃卡。
- 貼文頁右欄：原本一整塊（作者 + 留言 + 輸入框）→ 作者卡 + 留言卡；留言卡高度依內容，不再出現大面板中間一行巨大的「No comments」。

---

## 4. 元件

| 元件 | 規格 |
| --- | --- |
| 貼文卡 | 實心白、`rounded-card`、`shadow-card`；標題 18px/600 ink-900；摘要 15px、行高 1.7、ink-700；meta 13px ink-500；SIG 名稱用加深的分類色 |
| 公告卡 | 同貼文卡，左側 3px `warm-600` 標記線 |
| Hashtag | `brand-50` 底、`brand-800` 字、`rounded-chip`、500 |
| SIG 方塊 | 白底、1.5px 該 SIG 分類色邊框、`rounded-control`、ink-800 600；hover 淡染分類色 8% + 上浮 1px（捲動容器需留 4px 內距避免被裁切） |
| SIG 搜尋框 | 寬度固定上限 10.5rem、可縮小（未指定寬度時 Firefox / Safari 的預設寬度會撐破卡片） |
| 主要按鈕 | `brand-700` 底白字、`rounded-control`；hover `brand-800` |
| 次要按鈕 | 白底、1px `line-strong`、ink-700 |
| 留言 | 頭像 36px；名稱 13.5px/600 ink-900；時間 12px ink-500；內文 14.4px/400、行高 1.65、ink-700（原本 12px extralight） |

---

## 5. 閱讀排版（貼文內文）

| 項目 | 值 | 理由 |
| --- | --- | --- |
| 行寬 | 最多 42rem（約 40 個中文字） | 原本可達 60+ 字，換行時眼睛易跳錯行 |
| 字級 | 17px（閱讀模式可調 16 / 17 / 19） | |
| 行高 | 1.85 | 繁中長文 |
| 字距 | 0.02em | 中文略鬆較易讀 |
| 底 / 字 | `paper` / `#1f2a35` | 不用純白純黑，降低眩光 |
| 段距 | 1.15em | |
| 標題 | 只靠字重與大小分級，**不加底線**；h1 1.6rem、h2 1.35rem、h3 1.15rem；上方 2em | |
| 連結 | `brand-700` + 底線（底線 35% 透明，hover 實色） | 不只靠顏色區分 |
| 引用 | 3px `line-strong` 左線、ink-500，不用斜體 | 中文斜體難讀 |
| 程式碼 | 淺灰底、1px 細線、`rounded-control` | |
| 圖片 | 置中、`rounded-chip` | |
| YouTube iframe | 寬 100%、16:9 | |

**重複標題**：內文第一個區塊若是 h1–h3 且文字（忽略空白）等於文章標題，自動隱藏（只隱藏顯示，不改內容）。748 篇抽樣中有 296 篇（約 40%）符合。

---

## 6. 閱讀模式

- **入口**：貼文標題列右側「閱讀模式」按鈕（愛心旁）。
- **進入後**：隱藏 header、dock、右側欄、標題列的愛心 / 編輯 / 刪除；整個視窗變成 `paper` 底，單欄 44rem，標題與內文左緣對齊。
- **作者列**（標題下）：頭像 · 作者 · SIG · 日期 · 約 N 分鐘閱讀（中文約 400 字 / 分、英文約 200 字 / 分）。資料用 `useUser` / `useSig`，與右側欄共用 react-query 快取。
- **閱讀工具列**（頂部固定）：離開（Esc）、文章標題、字級（小 / 中 / 大）、底色（白 / 米），底部進度線。
- **記憶**：字級與底色存 `localStorage`（`mdsig-reader-prefs`）；閱讀模式本身不記憶，每次都由使用者主動進入；離開頁面自動結束。
- 狀態寫在 `<html data-reader data-reader-size data-reader-tone>`，以 CSS 控制周邊介面的隱藏。

---

## 7. 實作階段

| 階段 | 內容 |
| --- | --- |
| **1（本分支）** | Tokens、毛玻璃、shell（header / dock / 容器）、兩欄頁整頁捲動、首頁、貼文頁、閱讀模式、個人 / SIG 頁；其他桌機頁換上新底色與表面 |
| 2 | 其他桌機頁（資訊、Dashboard、資料、更新紀錄）改為整頁捲動與新元件 |
| 3 | 編輯器重做（見 Markdown 檢討：渲染改 server 端 remark 處理鏈、編輯器保留「寫 + 預覽」操作） |
| 4 | 管理平台獨立後台版面 |
| — | 行動版另案 |

---

## 8. 已知問題（本次盤點，不在階段 1 修）

| 問題 | 位置 |
| --- | --- |
| 刪除貼文不等 API 結果就顯示成功 | `app/post/[postID]/(post)/desktop/Thread.tsx` |
| 封面上傳說明寫「JPG、PNG、GIF」，實際只收 webp / jpeg / png / tiff | `components/PostEditor/desktop/MetaDataForm.tsx` |
| `handleEditorChange` 存進 localStorage 的是更新前的 `data` | `components/PostEditor/desktop/Editor.tsx` |
| markdown-it-sub 把「1~2 點」中間誤判為下標 | md-editor-rt 預設設定 |
| 編輯器 / 閱讀頁在執行時從 unpkg 載入 highlight.js 等資源 | md-editor-rt |
| 所有頁面 client-only、無 `generateMetadata`，分享連結都是同一張 banner | `app/**/page.tsx` |
| `useIsMobile` 預設 `false`，手機會先閃一次桌機版 | `utils/useIsMobile` |
| 62 處 SweetAlert2 modal（含成功訊息） | 全站 |

本階段順手修正：`<html lang>` 改為 `zh-Hant-TW`；全域 `* { outline: none }` 改為只在非鍵盤焦點時移除；移除 `globals.css` 中無人使用且在 Chromium 無效的 `.panel-bg` / `.backdrop-blur-custom`；首頁封面圖不再全部 `priority`、`sizes` 改為有效值。
