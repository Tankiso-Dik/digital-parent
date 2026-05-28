# FamilyHub

A family dashboard for organizing your household — calendars, chores, meals, and more. Built with React 19 and designed for kitchen tablets, but works great on phones too.

## What It Does

- **Calendar** — Four views (daily, weekly, monthly, schedule list), color-coded by family member, full CRUD operations
- **Chores** — Assign tasks to family members, track completion
- **Lists** — Shared grocery and to-do lists with categories
- **Family Management** — Onboarding flow with member profiles and color assignment

## Prerequisites

- Node.js 20.19+ or 22.12+
- npm

## Quick Start

```bash
npm install
npm run setup    # downloads/configures local PocketBase
npm run dev:full # PocketBase :8090 + Vite :5173
```

Default local login:

- App: `family` / `password123`
- PocketBase admin: `admin@digital-parent.local` / `digital-parent-admin-123`

See [PocketBase Backend](docs/POCKETBASE.md) for setup commands and overrides.

## Testing

```bash
npm test              # Unit tests (watch mode)
npm run test:e2e      # Playwright E2E tests
```

## Tech Stack

Why I chose what I chose:

- **React 19** + TypeScript + Vite — Fast dev experience, modern features
- **PocketBase** — Local backend, auth, collections, and admin UI
- **TanStack Query** + **Zustand** — Server state and UI state, cleanly separated
- **Tailwind CSS v4** + shadcn/ui — Beautiful, consistent styling
- **Vitest** + **Playwright** — Comprehensive testing (390+ tests)

## Current Status

**v0.3.8** — Full-stack app running with React + PocketBase. <!-- x-release-please-version -->

| Module   | Status           |
| -------- | ---------------- |
| Calendar | ✅ Complete      |
| Chores   | ✅ Complete      |
| Lists    | ✅ Complete      |
| Auth     | ✅ PocketBase    |

## Why I Built This

This is a personal project — something useful for my family and a playground for learning modern frontend patterns. The goal is a working app on our kitchen tablet.

Building is fun. Shipping is better.

## Architecture

See [CLAUDE.md](CLAUDE.md) for the deep dive on patterns, state management, testing strategies, and code conventions.

See [PocketBase Backend](docs/POCKETBASE.md) for backend setup and schema details.

## License

[MIT](LICENSE)
