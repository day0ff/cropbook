# NestJS Module Creation Standard

## Mandatory Directory Structure
Every time a new NestJS module is created, it MUST be encapsulated in its own dedicated directory.

### Structural Rules:
1. **Isolated Folder:** Never create module files (module, controller, service) directly in the `src/` root or alongside unrelated files.
2. **Naming Convention:** Use `kebab-case` for folder names (e.g., `user-profile`).
3. **Internal Organization:**
    - The core files (`.module.ts`, `.controller.ts`, `.service.ts`) must reside inside the module folder.
    - For complex modules, use sub-folders for `dto/`, `entities/`, and `interfaces/`.

### Preferred CLI Usage:
When generating via Nest CLI, always specify the path to ensure folder creation:
`nest generate module modules/{name}` or `nest generate mo {name}` (ensure the context is the new directory).

### Example:
- **Incorrect:**
    - `src/auth.module.ts`
    - `src/auth.service.ts`
- **Correct:**
    - `src/auth/auth.module.ts`
    - `src/auth/auth.service.ts`
    - `src/auth/dto/login.dto.ts`

## Enforcement
Refuse any request to generate NestJS components without a dedicated parent folder. If a folder is missing, create it first.
