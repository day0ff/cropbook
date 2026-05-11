# AGENTS.md

## Project Overview

This repository is a pnpm monorepo using:
- NestJS backend
- React + TypeScript frontend
- Turborepo
- Shared TypeScript packages

Applications:
- apps/api -> NestJS API
- apps/web -> React SPA

Shared packages:
- packages/shared

---

# Development Principles

## General Rules

- Always use TypeScript
- Never use `any`
- Prefer functional and composable code
- Keep files small and focused
- Avoid duplication
- Prefer explicit typing
- Use async/await instead of promise chains

---

# Frontend Rules

## React

- Use functional components only
- Use hooks
- Prefer TanStack Query for server state
- Keep components presentational when possible
- Move business logic to hooks/services
- Avoid deeply nested component trees

## Styling

- Use TailwindCSS
- Prefer utility classes
- Avoid inline styles

## Routing

- Use React Router

---

# Backend Rules

## NestJS

- Use modular architecture
- One domain per module
- Keep controllers thin
- Business logic belongs in services
- Validate DTOs
- Prefer repository/service separation

## Errors

- Throw typed HTTP exceptions
- Never swallow errors
- Log meaningful context

---

# Shared Types

- Shared DTOs belong in packages/types
- Frontend must reuse backend DTOs when possible

---

# Monorepo Rules

- Shared code goes to packages/*
- Apps must not directly import from each other
- Use workspace dependencies

---

# Code Style

- Prefer early returns
- Prefer descriptive names
- Avoid magic numbers
- Avoid large files (>300 lines)
- Keep functions focused

---

# Testing

- Add tests for business-critical logic
- Prefer integration tests for backend
- Prefer React Testing Library for frontend

---

# Commands

## Development

```bash
pnpm dev
```

## Build

```bash
pnpm build
```

## Lint

```bash
pnpm lint
```

---

# AI Agent Instructions

Before generating code:
1. Check existing patterns
2. Reuse existing abstractions
3. Avoid introducing new dependencies unless necessary
4. Keep architecture consistent
5. Prefer minimal changes

When creating files:
- Place files in the correct domain/module
- Update exports if needed
- Keep imports organized

When modifying backend:
- Respect NestJS module boundaries

When modifying frontend:
- Separate UI from data-fetching logic
