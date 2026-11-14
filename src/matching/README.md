# Roommate Matching Module (`src/matching`)

This directory contains the core roommate matching and recommendation system for NestMate.

## Module Structure

* `compatibility-score.js`: The 4-pillar compatibility algorithm, factor explanations, match insights (strengths & differences), and profile normalization.
* `rank-matches.js`: Bounded binary-insertion ranking engine with deterministic tie-breaking ($O(N \log K)$).
* `matching.service.js`: Domain service coordinating repository access, account status checks, privacy filters, moderation blocks, and pagination.
* `matching.controller.js`: NestJS controller exposing `/api/matches` with authenticated JWT verification and parameter guards.
* `matching.module.js`: NestJS module definition registering dependencies.
* `matching.repository.js` & `profile-repository.js`: In-memory profile and candidate repository contracts.

## Full Documentation

For the complete technical specification, scoring formulas, API reference, and sample calculations, see:
👉 [**Roommate Matching Documentation (docs/ROOMMATE_MATCHING.md)**](../../docs/ROOMMATE_MATCHING.md)

## Automated Tests

Run all matching tests from the repository root:
```bash
npm test
```
