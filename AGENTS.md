# MDSIG Frontend — Agent Guide

MDSIG is a community sharing platform for Mingdao High School students and teachers to exchange ideas and insights.

## Quick Reference

- **Package manager**: pnpm (v10.18.2)
- **Node version**: 23
- **Stack**: Next.js 15 + React 19 + TypeScript (strict)

## Commands

```bash
pnpm install       # Install dependencies
pnpm dev           # Dev server (Turbopack)
pnpm build         # Production build (Turbopack)
pnpm lint          # Format and lint with Biome — run before completing any task
```

## Environment Variables

Copy `.env.local.example` to `.env.local`. Key variables:

```bash
NEXT_PUBLIC_API_URL=https://api.sig.mingdao.edu.tw
NEXTAUTH_URL=https://sig.mingdao.edu.tw
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Docs

- [Architecture & project structure](docs/architecture.md)
- [API patterns & authentication](docs/api.md)
- [Code style & naming conventions](docs/code-style.md)
- [TypeScript interfaces & permissions](docs/data-types.md)
- [Feature implementation details](docs/features.md)
