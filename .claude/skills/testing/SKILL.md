---
description: Use when adding tests, fixing failing tests, or deciding what tests are required for a change.
---

# Testing Skill

## Test Strategy

Prefer focused tests close to the changed behavior.

For Probe SDK:

- unit tests for decorator behavior
- fallback tests for server failure
- shadow mode tests
- serialization tests

For Control Server:

- API tests
- validation tests
- persistence tests
- policy tests
- System isolation tests
- SQLite persistence and migration tests for the current issue only

For Project Intelligence:

- create temporary Git fixture repositories
- commit baseline files, then add conflicting uncommitted/untracked secrets
- assert snapshots read only the pinned commit
- validate evidence paths and line ranges against snapshot content
- test path traversal, symlinks, invalid repos, missing commits, and size limits
- mock the LLM transport, not the business decision
- assert reasoning-required operations fail when model config/API/schema fails
- assert no heuristic fallback result is persisted
- assert provider/model/prompt/schema/decision metadata is persisted
- assert worktree/experiment execution leaves the target repository unchanged
- assert deterministic raw metrics survive interpretation failure

For Dashboard:

- minimal smoke tests if framework supports it
- otherwise provide manual verification steps

## Required Decision

For every behavior change, either:

- add or update tests, or
- explicitly explain why tests are not practical for this change

## Completion

Report:

- tests added
- tests run
- tests skipped
- known gaps
- mock versus real-provider coverage
- any integration tests deferred because dependencies are unavailable
