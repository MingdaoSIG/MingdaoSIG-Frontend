# Code Style

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Component files | PascalCase | `PostEditor.tsx` |
| Utility functions / hooks | camelCase | `useIsMobile.ts` |
| Type definitions | PascalCase | `TThread`, `User` |
| SCSS modules | camelCase + `.module.scss` | `ThreadsList.module.scss` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL` |

## Import Order

```typescript
// 1. Third-party packages
import { useState } from "react";
import Image from "next/image";

// 2. Internal types
import type { TThread } from "@/interfaces/Thread";

// 3. Internal modules
import markdownToPlainText from "@/modules/markdownToPlainText";

// 4. Internal components / styles
import style from "./ThreadsList.module.scss";
```

Do **not** use barrel imports (re-exporting from `index.ts`).

## Component Rules

- All props must have explicit TypeScript types
- Use `const`/`let` — never `var`
- Prefer `async`/`await` over raw promises
- `useIsMobile` hook determines desktop vs mobile rendering (breakpoint: 1024px)

## Formatting (Biome)

- 2-space indentation
- Double quotes
- Automatic import sorting (enforced by Biome)

Run `pnpm check` to format and check before completing any task.
