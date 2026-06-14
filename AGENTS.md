# AGENTS.md

## Project Overview

This repository is a pnpm monorepo using:

- NestJS backend
- React + TypeScript frontend
- Shared TypeScript packages

Applications:

- apps/api -> NestJS API
- apps/web -> React SPA

Shared packages:

- packages/shared

---

# Repository Layout

- `apps/api`: Backend API service built with NestJS.
- `apps/web`: Frontend shell built with React and Vite.
- `packages/shared`: Shared types and helpers used across apps.

> Do not import directly between `apps/api` and `apps/web`.

---

# Monorepo Rules

- Shared code goes to `packages/shared/*`.
- Apps must not directly import from each other.
- Use workspace dependencies.
- Prefer package-level `pnpm` scripts.
- Keep shared packages framework-agnostic.

---

## Domain Specific Rules
- **Backend (NestJS):** When working within the `apps/api/**` directory, strictly follow the [NestJS Module Structure](skills/nestjs-best-practices).
- **Frontend (React/Next):** When working within `apps/web/**`, follow [Frontend Standards](skills/vercel-react-best-practices).

---

# Repository Conventions

## Package Manager

- This repository uses pnpm exclusively.
- Never use npm or yarn.

## Workspace Usage

Prefer filtered workspace commands:

```bash
pnpm --filter api ...
pnpm --filter web ...
```

# How to run

- `pnpm --filter api dev`
- `pnpm --filter web dev`
- `pnpm -r build`

# Shared types

- Reuse shared contracts and DTOs from `packages/shared`.
- Avoid duplicating types between `apps/api` and `apps/web`.

## Imports

- Use absolute imports only once tsconfig paths are set.
- Keep domain boundaries clear.
- Avoid circular dependencies.

---

# Development Principles

## General Rules

- Always use TypeScript.
- Never use `any`.
- Prefer functional and composable code.
- Keep files small and focused.
- Avoid duplication.
- Prefer explicit typing.
- Use async/await instead of promise chains.
- Prefer composition over inheritance.
- Prefer incremental changes over large refactors.

---

# Shared Package Rules

- Keep imports organized.
