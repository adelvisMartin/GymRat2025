---
name: fitai-security-privacy
description: Threat-model and harden FitAI Pro Android, local data, remote APIs, imports, AI features, Firebase/provider integrations, secrets, permissions, logging, backups, and release configuration.
---

# FitAI Security & Privacy

Use this skill before adding any network integration, authentication, AI provider, health/activity data path, import/export feature, file handling, camera/microphone capability, or release build configuration.

## Security baseline

### Secrets
- Never commit API keys that grant privileged access, service-account JSON, signing secrets, passwords, private keys, refresh tokens, or production credentials.
- Use build-time/local secret injection and provider-recommended secret stores.
- Treat mobile client identifiers that are inherently public differently from server secrets, but still scope/restrict them appropriately.
- Add secret scanning to release checks.

### Input validation
Validate at boundaries before data enters domain/storage layers:
- text lengths and allowed formats
- numeric ranges and units
- date/time values
- barcode strings
- file type/size/schema
- imported JSON/CSV structure
- URI schemes and file providers
- remote API payload fields
- AI output before execution/persistence

Never trust a filename extension alone. Avoid path traversal, oversized payloads, decompression bombs, and unsafe deserialization patterns.

### Network
- HTTPS only for production remote APIs unless a documented local-development exception exists.
- Explicit timeouts.
- Bounded retries with exponential backoff/jitter.
- Rate-limit expensive calls.
- Do not log auth headers, tokens, full user exports, or raw sensitive payloads.
- Cache only data that is safe and has an expiry/invalidation policy.

### Authentication / sync
When cloud sync/auth is enabled:
- use established provider SDKs/mechanisms rather than custom password/auth crypto
- verify authorization server-side; client-side UI hiding is not authorization
- apply least privilege to Firebase/Supabase/other rules
- use App Check/device attestation where appropriate and actually configured
- handle token expiration and offline state safely
- never overwrite newer local data blindly during sync conflict resolution

### Local data
- Minimize collection.
- Keep core data local/offline by default when feasible.
- Protect sensitive exports with explicit user action and clear destination/share behavior.
- Avoid world-readable files.
- Use Android scoped storage/FileProvider patterns.
- Document what uninstall/reset deletes and what cloud sync may retain.

### Permissions
Request permissions just-in-time, only when the feature is invoked. Graceful fallback is required when denied. Re-request loops are forbidden.

Review especially:
- camera
- microphone
- notifications
- activity recognition / sensors
- media/files
- foreground service declarations

### AI safety boundaries
- AI suggestions are advisory, never an authority for medical diagnosis/treatment.
- Validate structured AI output before use.
- Do not send more personal data than needed for the request.
- Provide deterministic/local fallback for essential non-AI product flows.
- Put provider calls behind an interface so the app remains testable and offline-capable.

## Threat-model checklist

For a changed feature document:
1. Assets/data worth protecting.
2. Trust boundaries.
3. Entry points.
4. Abuse cases.
5. Required permissions.
6. Offline/failure behavior.
7. Logging/telemetry impact.
8. Data retention/deletion behavior.
9. Dependency/supply-chain impact.
10. Tests that prove mitigations.

## Release blockers

P0/P1 security issues include exposed privileged credentials, broken authorization, arbitrary file overwrite/read, destructive import without recovery, unsafe WebView/deep-link execution, unbounded upload/decompression, release signing material in git, or silently sending user fitness data to an undeclared third party.
