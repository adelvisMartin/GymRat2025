# FitAI Supply Chain Skill

Use this skill when dependencies, GitHub Actions, Android plugins, build tools or release artifacts change.

## Dependency policy

1. Prefer official or actively maintained projects compatible with the current major runtime.
2. Review license, repository activity, issue health and release recency before adoption.
3. Pin runtime-critical native dependencies to known compatible versions.
4. Commit and use a lockfile for reproducible JavaScript dependency resolution.
5. Do not add a dependency for trivial logic that can be implemented safely in a few tested functions.
6. Reject packages that require secrets or suspicious install scripts without explicit review.
7. Never copy AGPL code into FitAI unless licensing strategy explicitly accepts that consequence.

## CI policy

- GitHub Actions should use immutable major releases from reputable publishers and minimal permissions.
- Do not expose secrets to pull requests or logs.
- Keep artifact hashes.
- Separate build success from emulator/device success.
- Record Android/JDK/Node versions.

## Release checklist

Before RC, review dependency audit output, license inventory, generated Android dependencies, signing configuration, artifact SHA-256 and known advisories. Produce an SBOM when release tooling is finalized.
