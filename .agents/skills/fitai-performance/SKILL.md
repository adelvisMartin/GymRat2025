# FitAI Performance Skill

Use this skill when adding dependencies, media, charts, native plugins, background work or large data collections.

## Performance budget mindset

FitAI Pro should feel immediate during training. Prefer measurable product speed over decorative complexity.

## Rules

1. Avoid large UI/chart libraries for simple visualizations.
2. Lazy-load noncritical features and native-only integrations.
3. Keep workout logging interaction free from network dependency.
4. Avoid repeated serialization/encryption when no state changed.
5. Bound lists and expensive derived calculations; memoize only where measurement justifies it.
6. Clean up sensor/plugin listeners on unmount/background transitions.
7. Do not poll remote services unnecessarily.
8. Optimize images/media and never bundle large exercise media without a loading/cache plan.
9. Watch bundle growth when adding a dependency; record why it is worth the cost.
10. Prefer platform APIs over heavyweight abstractions when reliability is equal.

## Required measurements before RC

- static JS/CSS bundle size
- browser interaction responsiveness on a mid-range mobile profile
- Android cold start and resume behavior
- memory/listener leak smoke during repeated workout navigation
- offline startup after service-worker warmup
- large-history rendering with realistic fixture volume
