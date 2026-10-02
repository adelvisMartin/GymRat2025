---
name: fitai-training-engine
description: Implement and review FitAI Pro workout programming, logging, progression, PR, RIR/RPE, 1RM, scheduling, supersets, timed/bodyweight/cardio behavior with deterministic domain tests.
---

# FitAI Training Engine

Use this skill whenever a change affects workout creation, routine programming, exercise execution, set logging, progression, performance metrics, or training history.

## Design rules

- Keep training mathematics and state transitions in pure/testable domain code.
- UI renders domain output; UI does not recalculate business rules.
- Persist enough information to reproduce what the user actually did, not just planned targets.
- Never rewrite finished workout history when progression rules change.
- Preserve unit semantics (kg/lb, seconds/minutes, distance/speed) and round only at presentation boundaries.
- Model missing values distinctly from zero. Example: unrated effort is not RIR 0.
- Every automatic target must have an explainable reason string that can be shown to the user.

## FitAI 2.7 capability targets

### Weekly plan and rescheduling
- Routines can be assigned to weekdays.
- A planned session can be moved for a specific date without mutating the recurring template.
- Skipped/rest days remain explicit and are not silently counted as failed workouts.

### Set modes
Support explicit modes rather than overloaded fields:
- weighted repetitions
- body-weight repetitions
- weighted body-weight (external load)
- timed hold/work
- cardio time + optional distance/speed
- reps-per-side with even-total constraints where applicable

### Supersets
- A superset is a grouping relationship, not duplicated exercise data.
- Exercise order remains deterministic.
- Rest may be applied after the pair/group rather than after each exercise.
- Logging interruption/resume must preserve current position.

### Effort
- Continue supporting RIR.
- Add RPE only if schema/UI migration is safe.
- Store the scale used with each recorded value.
- Progression rules must not consume RIR/RPE unless a rule explicitly declares that dependency.

### Estimated 1RM
- Use a documented formula (Epley is acceptable as default).
- Ignore ineligible high-rep sets beyond a configurable safety threshold (default 12 reps).
- Record which set/date produced the estimate.
- Distinguish estimated-1RM PR from heaviest-weight PR and volume PR.

### Progression engine
Implement rules as strategies with deterministic inputs/outputs:
- none/manual
- linear progression
- double progression across rep range
- time progression for timed work
- optional Greyskull-style logic only after its rules are explicitly documented in FitAI terms

A progression result should include:
- next target load/reps/time
- whether a stall occurred
- whether a deload/reset occurred
- explanation
- source workout/session identifiers used

### Body-weight progression
- No synthetic “0 kg” working load.
- Unloaded body-weight movements progress in reps or difficulty/set count.
- External added load re-enables load progression.

### PR detection
At minimum distinguish:
- heaviest load
- estimated 1RM
- rep PR at a load
- timed-duration PR
- optional volume PR

Never mark a PR from an incomplete/unconfirmed set.

## Test matrix

For each new rule add tests for:
- first workout/no history
- success path
- missed reps/incomplete set
- repeated stall
- deload/reset path
- unit conversion
- boundary/rounding behavior
- deleted/edited historical workout
- offline persistence + reload
- migration from v2.6-compatible records

## openGym reference policy

openGym may be used to identify useful product behavior such as progression explanations, timed sets, supersets, 1RM, body-weight progression, per-side reps, cardio logging, plan sharing, heatmaps, and muscle maps. Reimplement independently. Do not copy AGPL source or assets into FitAI Pro by default.
