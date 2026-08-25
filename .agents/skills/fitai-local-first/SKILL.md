# FitAI Local-First Skill

Use this skill whenever work touches persistence, import/export, schema changes, offline behavior or future synchronization boundaries.

## Objectives

- Keep workouts, routines, history, meals, recipes, clients, measurements, steps and settings usable without Internet.
- Persist only encrypted payloads outside process memory.
- Treat imported backups as hostile input.
- Keep schema version explicit and migrations deterministic.
- Preserve a clean `Repository` boundary so a future cloud adapter can be added without rewriting domain/UI.

## Required checks

1. No plaintext user state in localStorage/Preferences/logs.
2. PIN/password is never persisted or logged.
3. Encryption uses platform Web Crypto/native primitives; no hand-written cipher.
4. Import has file-size limits, JSON shape checks and schema-version checks before replacing current state.
5. Wrong PIN, corrupted ciphertext and unsupported schema fail closed with a useful message.
6. Save operations cannot silently drop collections.
7. Every migration has tests and backup/rollback guidance.
8. Core behavior works with network disabled.

## Future sync contract

When remote storage is authorized, add it behind a repository adapter. Never let HTTP/client SDK calls leak into the training engine or React components. Resolve conflicts with explicit timestamps/revisions and preserve local export as an escape hatch.
