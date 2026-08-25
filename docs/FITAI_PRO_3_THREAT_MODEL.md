# FitAI Pro 3 — Threat model

## Assets

- workout history and performance data
- nutrition logs
- coach/client measurements and notes
- local encrypted backup
- Android permissions for activity recognition and camera/scanner capability
- future account/sync credentials (not present in local-only phase)

## Trust boundaries

1. User input → React application.
2. Imported backup file → encrypted vault parser.
3. Browser/WebView → Capacitor plugin bridge.
4. Native plugin → Android hardware/Google modules.
5. App → Open Food Facts public API.
6. Future remote repository → not implemented yet.

## Main threats and controls

### Plaintext local data disclosure
Control: all persisted app state is serialized inside an AES-GCM envelope derived from the local PIN. The PIN itself is not persisted.

### Weak/incorrect cryptography
Control: Web Crypto only. PBKDF2-SHA-256 derives an AES-256-GCM key. Each save uses fresh salt and IV. No custom cipher primitives.

### Malicious/corrupt backup
Control: import size cap, envelope shape validation, KDF/version validation, authenticated decryption, AppState schema-version check and collection shape checks before replacement.

### Secret leakage
Control: no API keys are needed by the current public Open Food Facts integration; no signing keys or tokens belong in source. CI must never print release credentials.

### Plugin abuse / permission overreach
Control: barcode and activity permissions are requested only from the user action that needs them; unsupported or denied paths fail with a user-readable error. Do not add location, contacts, microphone or storage permission without a product requirement.

### Untrusted remote nutrition data
Control: barcode format is constrained; response has timeout, status check and field normalization. Remote values are informational data, not executable content.

### XSS / unsafe rendering
Control: React escapes text by default. Do not use `dangerouslySetInnerHTML` for remote/imported content. Do not execute imported code or URLs.

### Data loss from concurrent saves
Current mitigation: mutations are serialized through an in-memory save queue. Required hardening before production: add explicit save-failure telemetry surfaced locally and backup/restore E2E.

### Brute-force local PIN
Current mitigation: expensive PBKDF2 derivation. Limitation: offline attackers with a copied ciphertext can attempt guesses. Before high-risk deployment, consider Android Keystore/biometric wrapping while preserving PWA portability.

### Lost PIN
By design, there is no server recovery key. The UI must clearly warn that losing the PIN and all backups means loss of access to encrypted data.

## Supply chain

- pin major/minor versions of runtime-critical native packages where practical;
- commit a lockfile after the first green dependency resolution;
- review transitive dependencies and licenses;
- produce SBOM/dependency audit before RC;
- do not accept abandoned Capacitor plugins merely because they expose the desired method.

## Out of scope today

Server auth, tenant isolation, payment security and cloud ACLs are not implemented because no remote system exists in this phase. They become new threat-model sections when cloud work is authorized.
