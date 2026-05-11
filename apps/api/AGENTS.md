# API Agent Instructions

This app is a NestJS backend.

---

# Architecture

- Use modular architecture.
- One domain per module.
- Controllers orchestrate only.
- Business logic belongs in services.
- Repositories handle persistence.
- Keep module imports explicit.

---

# Validation

- Always use DTOs.
- Use class-validator.
- Use ValidationPipe({ whitelist: true, transform: true }).
- Validate all external input.

---

# Error Handling

- Use typed HttpExceptions.
- Never swallow errors.
- Log useful request context.
- Prefer consistent error responses.

---

# Async & Messaging

- Prefer event-driven patterns where appropriate.
- Use RabbitMQ patterns consistently.
- Ensure consumers are idempotent.
- Handle retries and DLQs carefully.

---

# Logging & Observability

- Prefer structured logging.
- Include correlation/request IDs when possible.
- Preserve tracing context.

---

# Testing

- Prefer integration tests.
- Test request flows.
- Mock only external systems.

---

# Shared Types

- Reuse DTOs from `packages/shared`.
- Avoid duplicate contracts.

---

# Before Coding

1. Read `.agents/skills/nestjs-best-practices`
2. Follow existing module structure.
3. Reuse existing abstractions.
4. Keep changes incremental.
