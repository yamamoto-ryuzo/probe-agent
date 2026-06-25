---
description: Use before modifying code. Checks whether CLAUDE.md, skills, schemas, docs, and tests need updates before implementation.
---

# Modify Code Workflow

Before changing code:

1. Understand the requested change.
2. Identify affected areas:
   - Python Probe SDK
   - Control Server
   - Dashboard
   - shared schemas
   - examples
   - docs
   - tests
   - CLAUDE.md
   - SKILL.md files
   - repository intelligence / reasoning runs / isolated workspaces
3. Decide whether persistent instructions need updates.
   - If a project-wide rule changes, update `CLAUDE.md`.
   - If a repeated workflow changes, update the relevant `SKILL.md`.
   - If a schema or contract changes, update `schema-change` related docs and tests.
4. Make instruction updates first when needed.
5. If working on issues #23-#26:
   - read `docs/project-intelligence.md`
   - load `project-intelligence`
   - load `reasoning-llm` for any open-ended inference
   - state which issue owns the change and keep later phases out of scope
   - do not create speculative tables for later issues
6. Classify each decision as:
   - deterministic finite-set/structural validation
   - reasoning-model inference
   - manual review
7. Implement the code change.
8. Add or update tests when behavior changes.
9. Run relevant checks.
10. Report:
   - changed files
   - tests run
   - tests not run and why
   - risks or follow-up work
   - whether any mock remains
   - reasoning model/provider used, when applicable
