# Web Agent Instructions

This app is a React + Vite + TypeScript SPA.

---

# Components

- Use functional components only.
- Keep components presentational.
- Move business logic into hooks/services.
- Prefer composition over prop drilling.

---

# State Management

- Use TanStack Query for server state.
- Use hooks for local state.
- Avoid global state unless necessary.

---

# Styling

- Use @emotion/react and @emotion/styled for component styling.
- Avoid inline styles.
- Prefer reusable UI patterns.

---

# Routing

- Use react-router-dom for routing.
- Prefer route-level lazy loading when useful.

---

# Data Fetching

- Keep API clients typed.
- Reuse DTOs from `packages/shared`.
- Separate UI from data-fetching logic.

---

# Performance

- Avoid unnecessary re-renders.
- Memoize only when justified.
- Prefer simple components.

---

# Testing

- Use React Testing Library.
- Test user behavior over implementation details.

---

# Before Coding

1. Read `.agents/skills/vercel-react-best-practices`
2. Reuse existing hooks/components.
3. Keep files small and composable.
4. Prefer incremental changes.
