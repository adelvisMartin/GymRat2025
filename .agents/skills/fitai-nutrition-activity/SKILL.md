# FitAI Nutrition & Activity Skill

Use this skill for meals, recipes, barcode lookup, steps, measurements and wellness calculations.

## Product rules

- Keep nutrition logging usable offline except optional product lookup.
- Treat Open Food Facts and other external food data as untrusted and potentially incomplete.
- Keep source attribution in the data model when a value came from a remote lookup.
- Never silently convert missing nutrient data to a health claim.
- Preserve units explicitly and avoid hidden metric/imperial assumptions.
- Step tracking must degrade gracefully when hardware or permission is unavailable.
- Sensor listeners must stop when no longer required.
- Avoid medical diagnosis, treatment claims or unsafe calorie recommendations.

## Data quality checks

- Validate barcode format and response shape.
- Distinguish per-100g values from per-serving values.
- Prevent negative calories/macros/measurements.
- Round only for display; retain stable domain values where precision matters.
- Make manual correction possible when third-party data is wrong.

## Tests

Cover totals, serving conversions, missing fields, invalid barcodes, timeout/network failure, duplicate logging, denied step permission and unavailable sensors.
