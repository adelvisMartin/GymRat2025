# FitAI PWA + Capacitor Skill

Use this skill for product-shell, PWA, Android packaging, service worker or cross-platform UI work.

## Platform contract

- Next.js uses `output: 'export'`; do not introduce server-only APIs, Server Actions, SSR or runtime route handlers while local-only mode is active.
- Capacitor consumes the generated `out/` directory.
- Android package identity remains `com.adelvis.fitai.pro`.
- Prefer shared TypeScript behavior. Use a native plugin only where browser APIs are insufficient.
- Native bridge additions should be minimal, permission-scoped, testable and Kotlin-first when custom Android code is required.

## UX requirements

- Mobile first; no desktop-only interactions.
- Every control must have a visible label or accessible name.
- Touch targets should be at least ~44px.
- Empty/loading/error/offline states must be intentional.
- Motion is restrained and must obey reduced-motion.
- Avoid decorative complexity that increases bundle size without improving the task.

## PWA gates

1. Static build succeeds.
2. Manifest is valid and has name/start URL/theme/icon.
3. Service worker caches same-origin shell/runtime assets and never caches mutation responses.
4. Reload works offline after one successful load.
5. No server dependency is required for core features.
6. Playwright passes on mobile and desktop viewports.

## Android gates

1. `cap sync android` succeeds.
2. minSdk/targetSdk satisfy active plugins.
3. APK installs and package ID is correct.
4. App launches without crash.
5. Native permissions are requested just-in-time.
6. Barcode and pedometer paths degrade gracefully when unsupported.
