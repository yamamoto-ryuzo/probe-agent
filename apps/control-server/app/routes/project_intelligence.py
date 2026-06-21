from fastapi import APIRouter, Depends

from ..auth import get_system_id
from ..models import (
    ExperimentSummary,
    ExperimentVariant,
    FeatureCodeLink,
    FeatureEvidence,
    FeatureProfile,
    ProbePlan,
    ProbePoint,
    ProjectIntelligenceMock,
    RepositorySnapshot,
    SystemProfile,
)

router = APIRouter()


@router.get("/project-intelligence", response_model=ProjectIntelligenceMock)
def get_project_intelligence_mock(
    system_id: int = Depends(get_system_id),
) -> ProjectIntelligenceMock:
    """Return the contract and representative data for the future intelligence layer."""
    repository = RepositorySnapshot(
        repo_path="/path/to/target-repository",
        commit_sha="0000000000000000000000000000000000000000",
        included_paths=["README.md", "docs/**", "src/**", "tests/**"],
        excluded_paths=[".env", "secrets/**", "data/**"],
        status="not_configured",
    )
    features = [
        FeatureProfile(
            feature_id="repository-understanding",
            name="Repository Understanding",
            summary="Committed documentation and source are indexed with evidence.",
            user_value="The agent can explain the system before proposing instrumentation.",
            success_criteria=[
                "Only files from a pinned commit are read",
                "Every generated statement links to repository evidence",
            ],
            risks=["Secrets may be exposed if the committed-files boundary is bypassed"],
            evidence=[
                FeatureEvidence(
                    path="docs/project-intelligence.md",
                    lines="Repository Snapshot Manager",
                    summary="Defines the committed-files-only boundary.",
                )
            ],
            code_links=[
                FeatureCodeLink(
                    path="apps/control-server/app/routes/project_intelligence.py",
                    symbol="get_project_intelligence_mock",
                    kind="route",
                    confidence=1.0,
                    decision_method="manual",
                )
            ],
            decision_method="manual",
        ),
        FeatureProfile(
            feature_id="feature-map",
            name="Feature Map",
            summary="User-facing features are mapped to code symbols and components.",
            user_value="Improvement work can be discussed in product terms, not file names.",
            success_criteria=[
                "Features include user value and success criteria",
                "Code links include a confidence score",
            ],
            risks=["Heuristic links require human review"],
            evidence=[
                FeatureEvidence(
                    path="README.md",
                    lines="Feature Intelligence Layer",
                    summary="Introduces Feature as the parent of Component.",
                )
            ],
            decision_method="manual",
        ),
    ]
    probe_plans = [
        ProbePlan(
            feature_id="feature-map",
            objective="Observe feature extraction without modifying the target repository.",
            probe_points=[
                ProbePoint(
                    component_id="feature-map-builder",
                    feature_id="feature-map",
                    path="apps/control-server/app/routes/project_intelligence.py",
                    symbol="get_project_intelligence_mock",
                    reason="Represents the future feature extraction boundary.",
                    recommended_mode="trace",
                    side_effect_risk="low",
                )
            ],
            avoid_probe_points=[
                "Git credential handling",
                "File deletion, persistence, billing, and external side effects",
            ],
            decision_method="manual",
        )
    ]
    experiments = [
        ExperimentSummary(
            experiment_id="mock-experiment-1",
            feature_id="feature-map",
            objective="Compare baseline feature mapping with a code-index-assisted variant.",
            baseline_commit=repository.commit_sha,
            variants=[
                ExperimentVariant(variant_id="baseline", label="Documentation only"),
                ExperimentVariant(
                    variant_id="ast-index",
                    label="Documentation plus Python AST index",
                    patch_summary="Add code-symbol candidates; do not modify the target repo.",
                ),
            ],
            metrics=[
                "test_pass_rate",
                "mapping_precision",
                "mapping_review_rate",
                "duration_ms",
            ],
            interpretation_method="manual",
        )
    ]
    return ProjectIntelligenceMock(
        system_id=system_id,
        deterministic_decision_policy=(
            "Deterministic rules are allowed only when the output belongs to a "
            "small, explicitly enumerated finite set. All open-ended inference "
            "must use an external reasoning-model LLM API."
        ),
        repository=repository,
        system_profile_draft=SystemProfile(
            name="Target system draft",
            purpose="Drafted from committed README and docs with evidence.",
            target_users=["developers", "system improvement owners"],
            stakeholder_value="Safer, evidence-based probe and experiment planning.",
            constraints=[
                "Do not modify the target repository automatically",
                "Do not read untracked or uncommitted files",
                "Do not adopt a variant based on LLM evaluation alone",
            ],
            success_criteria=[
                "A reviewable Feature Map is produced",
                "Probe plans identify side-effect risk",
                "Experiments run in an isolated workspace",
            ],
        ),
        features=features,
        probe_plans=probe_plans,
        experiments=experiments,
    )
