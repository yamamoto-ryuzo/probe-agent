---
description: Use for any Feature Intelligence decision that is not a direct structural check or classification into a small explicit finite set, including feature extraction, semantic mapping, probe planning, risk interpretation, and experiment recommendations.
---

# Reasoning LLM Skill

## Decision Boundary

Use deterministic code only for:

- direct parsing and validation
- exact matching against known values or safety denylists
- numeric aggregation
- classification into a small, explicit enum
- state transitions with enumerated states

Use an external reasoning-model API for:

- System/Feature understanding and summarization
- evidence interpretation
- semantic Feature-to-Code mapping
- probe-point selection and explanation
- unknown side-effect/replayability analysis
- multi-metric experiment interpretation and recommendation

Retrieval heuristics, embeddings, and keyword search may reduce context, but
their scores are not final decisions.

## Fail Closed

If model configuration is missing, the API fails, timeout occurs, or structured
output is invalid:

- mark the reasoning run failed
- persist the error and available deterministic inputs/results
- show the failure in the Dashboard
- do not create heuristic substitute output
- do not generate or apply downstream patches

Mock providers are allowed only in automated tests and local UI smoke checks.
Mark mock results visibly and never treat them as production analysis.

## Required Output Contract

Require versioned structured output. Validate it before persistence.

Persist:

- provider and exact model
- prompt version
- output schema version
- decision method: `reasoning_llm`
- source snapshot/commit and relevant entity IDs
- request/run timestamps and status
- validated output or failure details

Do not require or expose hidden chain-of-thought. Store concise reasons,
evidence references, risks, and recommendations from the structured response.

## Safety Precedence

- deterministic repository boundaries and safety denylists override LLM output
- an LLM cannot approve its own patch or variant
- recommendations remain separate from manual decisions
- test results and raw metrics remain visible independently of interpretation

## Tests

- successful structured response
- malformed response
- timeout/provider error
- non-reasoning model rejected for reasoning-required operations
- no heuristic fallback persistence
- audit metadata persistence
- mock result visibly marked
