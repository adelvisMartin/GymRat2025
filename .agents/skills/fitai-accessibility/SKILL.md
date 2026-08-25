# FitAI Accessibility Skill

Use this skill for every UI feature and before release.

## Minimum standard

- Every input has a programmatic label.
- Every icon-only control has an accessible name.
- Keyboard focus order follows the visual/task order.
- Focus is always visible.
- Touch targets are approximately 44×44 px or larger.
- Text remains usable at 200% zoom and large Android font scaling.
- Color is never the only carrier of meaning.
- Reduced-motion preference disables nonessential animation.
- Error messages explain what failed and how to recover.
- Dynamic status updates use appropriate live-region semantics when needed.

## Fitness-specific checks

- During an active workout, the next required action must be reachable one-handed.
- Numeric set fields must expose meaningful labels and sensible input modes.
- Timers must not rely only on color or sound.
- Exercise instructions must remain readable without media.
- PR/progress charts need textual equivalents.
- Disabled controls must have an understandable reason from surrounding UI.

## QA

Test keyboard-only desktop, mobile screen-reader semantics, large text, reduced motion, contrast, form errors and dialog focus restoration. Accessibility defects that block core logging are P1.
