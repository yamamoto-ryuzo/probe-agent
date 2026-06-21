---
description: Use when implementing Git repository understanding, Feature Maps, Feature-to-Code links, Probe Plans, temporary instrumentation, or experiment workspaces for issues #23-#26.
---

# Project Intelligence Skill

## Read First

- `CLAUDE.md`
- `docs/project-intelligence.md`
- the owning GitHub issue (#23, #24, #25, or #26)
- `probe-agent.example.yml`

Load `reasoning-llm` whenever the task contains open-ended inference.

## Work by Owning Issue

### #23 Repository Understanding

Implement only:

- System-scoped repository configuration
- pinned committed-files-only snapshots
- evidence-backed System Profile / Feature drafts
- intelligence-run audit persistence
- Repository and initial Feature Map real-data UI

Do not add code symbols, Probe Plans, or experiment tables.

### #24 Feature-to-Code Mapping

Implement only after #23 contracts exist:

- deterministic Python AST symbol extraction
- reasoning-model Feature-to-Code mapping
- reviewable accepted/rejected links

AST extraction is deterministic. Semantic mapping is not.

### #25 Probe Plan / Temporary Patch

Implement:

- reasoning-model Probe Plan proposals
- deterministic safety denylist and structural validation
- explicit manual approval
- reviewable patch generation in a temporary worktree
- baseline/probed validation from configured commands

Never modify the target working tree or branch.

### #26 Experiment Workspace

Implement:

- isolated baseline and source-patch variants
- deterministic command results and raw metrics
- reasoning-model interpretation
- separate human decision notes

Never merge, push, deploy, or automatically adopt a variant.

## Repository Boundary

1. Resolve and store a commit SHA.
2. Enumerate tracked files from Git.
3. Read content from the pinned commit.
4. Apply include/exclude and size limits.
5. Preserve provenance for every derived result.

Do not read mutable filesystem content from the target repository.

## Persistence Rule

Add database tables only in the issue that owns their lifecycle.

- #23: repository config, snapshots/files, intelligence runs, drafts/evidence
- #24: code symbols and Feature-code links
- #25: Probe Plans/points, patches, validation runs
- #26: experiments, variants, artifacts, metrics, interpretations

Keep deterministic facts, reasoning outputs, audit metadata, and manual
decisions separable in both schema and API.

## Completion Gate

- mock replaced only for the implemented phase
- System isolation tested
- target repository safety tested
- no heuristic fallback for reasoning-required work
- schemas, API, Dashboard, docs, and tests updated together
- later-phase work remains explicitly out of scope
