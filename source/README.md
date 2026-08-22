# FitAI Pro 2.7 source snapshot

This directory contains the integrated Android source snapshot used by CI.

- File: `FitAI-Pro-2.7-Integrated-Android-Source.zip`
- Version: `2.7.0`
- Local SHA-256 before upload: `34a096f6ecbd26a73beea08cb4e959029698b16edc6a2906785f3c454b74bfcf`
- Source base: the two supplied FitAI Pro 2.6 Senior Android source archives, which were byte-identical (`2327a25e6fcb440b275d357c53d08e95b9159bda81d1d598180e5e237075c659`).

The snapshot removes the embedded deterministic QA credential/backdoor and adds the FitAI 2.7 training engine, advanced training logging, progression/PR/1RM insights, scheduling/rescheduling, plan sharing, JSON restore validation, updated security/QA documentation, and repository-local agent skills.

CI is the authoritative Android build gate because the local ChatGPT execution container does not include an Android SDK/Gradle installation. A source/static pass must not be confused with a device/runtime pass.
