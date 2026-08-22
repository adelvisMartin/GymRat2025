---
name: fitai-product-ui
description: Design, audit, and polish FitAI Pro mobile UI/UX while preserving Android behavior, accessibility, responsive/adaptive layouts, product hierarchy, motion discipline, and a coherent fitness design system.
---

# FitAI Product UI

Use this skill for any user-facing screen, component, navigation change, theme, onboarding, empty/error/loading state, chart, workout logger, nutrition surface, Coach Center view, or settings flow.

## Product direction

FitAI Pro should feel like a serious training companion, not a generic card dashboard. Prioritize fast one-handed logging, readable training numbers, clear current-state feedback, and low cognitive load during workouts.

## Hierarchy rules

- The next action in a workout must be visually obvious within one glance.
- Primary training values (load, reps, RIR/RPE, time, rest) outrank decorative metadata.
- Avoid nested cards for every grouping; use spacing, typography, dividers, and section rhythm first.
- Avoid meaningless circles, badges, gradients, glows, and icon tiles that do not encode state or action.
- Do not split important numbers across lines.
- Use consistent alignment for numeric columns and tabular workout data.
- Empty states must explain what can be done next.
- Error states must say what happened, whether data is safe, and the recovery action.

## Mobile ergonomics

- Minimum comfortable touch targets.
- Keep primary workout controls reachable near the thumb zone when possible.
- Do not make the user scroll to find “complete set”, “next exercise”, timer, or save/finish actions.
- Respect system bars, cutouts, IME/keyboard, and small-height devices.
- Test large font/dynamic text and long Spanish strings.

## Accessibility

- Content descriptions for non-text controls.
- Do not encode state by color alone.
- Contrast must remain acceptable in light/dark themes.
- TalkBack order follows visual/task order.
- Charts require text summaries or accessible data equivalents.
- Motion must respect reduced-motion preferences where supported and never block task completion.

## Motion

Motion communicates continuity/state; it is not decoration.

Use animation for:
- entering/leaving workout steps
- confirming a logged set
- expanding detail progressively
- timer state changes
- navigation continuity

Avoid:
- bounce/elastic motion for routine controls
- long intro animations
- animated layout that shifts numeric entry targets
- motion that delays logging

Prefer transform/opacity where possible and short, interruption-safe transitions.

## Design system requirements

When the canonical Android source is restored, centralize and document:
- semantic colors
- typography scale/weights
- spacing scale
- corner radii
- elevation/surface rules
- icon sizes/strokes
- form/control states
- chart styles
- motion durations/easing

Do not introduce a second parallel design system during a feature.

## External design skills

The project may install Hallmark, Impeccable, Emil Kowalski’s design-engineering skills, and Taste Skill. Use them as bounded specialist passes:

1. FitAI requirements/architecture first.
2. One primary design skill for the implementation pass.
3. A different skill may audit the result.
4. Resolve conflicts in favor of usability, accessibility, brand consistency, and existing platform conventions.
5. Never let a web-focused skill force a framework rewrite of the native Android application.

## Visual QA evidence

For a changed screen verify at minimum:
- compact phone portrait
- typical phone portrait
- landscape or constrained height when the flow may be used there
- light and dark theme
- Spanish text
- large text/accessibility size
- loading, empty, error, populated, disabled states

Screenshots are evidence, not the only test. Verify interactions too.
