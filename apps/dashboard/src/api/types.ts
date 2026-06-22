export interface SystemOut {
  id: number;
  name: string;
  environment: string;
  description: string;
  owner_user_id: number | null;
  created_at: string;
  updated_at: string;
  component_count: number;
  trace_count: number;
  last_seen: number | null;
}

export interface ComponentSummary {
  component_id: string;
  mode: "off" | "trace" | "shadow";
  trace_count: number;
  last_seen: number | null;
}

export interface TraceEvent {
  trace_id: string;
  component_id: string;
  mode: string;
  input: string | null;
  output: string | null;
  error: string | null;
  duration_ms: number | null;
  timestamp: number;
}

export interface Policy {
  mode: "off" | "trace" | "shadow";
}

export interface ShadowResult {
  id: number;
  trace_id: string;
  component_id: string;
  current_output: string | null;
  candidate_output: string | null;
  candidate_error: string | null;
  candidate_duration_ms: number | null;
  evaluation: string;
  timestamp: number;
}

export interface ComponentProfile {
  component_id: string;
  purpose: string;
  responsibility: string;
  expected_input: string;
  expected_output: string;
  failure_impact: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface UserOut {
  id: number;
  username: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenOut {
  id: number;
  name: string;
  kind: string;
  user_id: number | null;
  system_id: number | null;
  revoked: boolean;
  created_at: string;
  expires_at: string | null;
  token?: string;
}

export interface MeResponse {
  user: UserOut | null;
  auth: string;
  system_id: number | null;
}

export interface RepositoryConfigOut {
  system_id: number;
  repo_path: string;
  include_patterns: string[];
  exclude_patterns: string[];
  created_at: string;
  updated_at: string;
}

export interface RepositoryCandidateOut {
  name: string;
  path: string;
}

export interface SnapshotFileOut {
  path: string;
  source_type: string;
  size_bytes: number;
  inclusion_status: "indexed" | "metadata_only" | "too_large" | "binary";
  exclusion_reason: string;
}

export interface SnapshotOut {
  id: number;
  system_id: number;
  repo_path: string;
  commit_sha: string;
  status: string;
  file_count: number;
  total_size: number;
  indexed_size: number;
  metadata_only_count: number;
  warnings: string[];
  error_summary: string | null;
  created_at: string;
  completed_at: string | null;
  files: SnapshotFileOut[];
}

export interface IntelligenceRunOut {
  id: number;
  system_id: number;
  snapshot_id: number | null;
  run_type: string;
  provider: string | null;
  model: string | null;
  prompt_version: string | null;
  schema_version: string | null;
  decision_method: string;
  status: string;
  error_details: string | null;
  is_mock: boolean;
  started_at: string;
  completed_at: string | null;
}

export interface EvidenceItem {
  file: string;
  line_start: number;
  line_end: number;
  snippet?: string;
  relevance?: string;
}

export interface SystemProfileDraftOut {
  id: number;
  system_id: number;
  intelligence_run_id: number;
  snapshot_id: number;
  name: string;
  purpose: string;
  target_users: string;
  stakeholder_value: string;
  constraints: string;
  success_criteria: string;
  evidence: EvidenceItem[];
  is_mock: boolean;
  created_at: string;
}

export interface FeatureDraftOut {
  id: number;
  system_id: number;
  intelligence_run_id: number;
  snapshot_id: number;
  feature_id: string;
  name: string;
  summary: string;
  user_value: string;
  success_criteria: string;
  risks: string;
  evidence: EvidenceItem[];
  decision_method: string;
  is_mock: boolean;
  created_at: string;
}

export interface LatestDraftsOut {
  system_id: number;
  snapshot: SnapshotOut | null;
  intelligence_run: IntelligenceRunOut | null;
  system_profile_draft: SystemProfileDraftOut | null;
  feature_drafts: FeatureDraftOut[];
}

export interface CodeSymbolOut {
  id: number;
  snapshot_id: number;
  system_id: number;
  path: string;
  qualified_name: string;
  kind: string;
  start_line: number;
  end_line: number;
  decorators: string[];
  imports: string[];
  docstring: string | null;
  is_test: boolean;
  is_pydantic_model: boolean;
  route_path: string | null;
  route_method: string | null;
  component_id: string | null;
}

export interface SymbolIndexOut {
  snapshot_id: number | null;
  system_id: number;
  symbol_count: number;
  warning_count: number;
  symbols: CodeSymbolOut[];
  warnings: string[];
  intelligence_run: IntelligenceRunOut | null;
}

export interface FeatureCodeLinkOut {
  id: number;
  system_id: number;
  snapshot_id: number;
  intelligence_run_id: number;
  feature_id: string;
  symbol: string;
  relation_reason: string;
  confidence: number;
  source: string;
  review_status: string;
  provider: string | null;
  model: string | null;
  prompt_version: string | null;
  schema_version: string | null;
  is_stale: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeatureCodeLinksOut {
  system_id: number;
  snapshot_id: number | null;
  intelligence_run: IntelligenceRunOut | null;
  links: FeatureCodeLinkOut[];
  is_mock: boolean;
}

export interface ProbePointOut {
  id: number;
  plan_id: number;
  system_id: number;
  component_id: string | null;
  feature_id: string;
  path: string;
  symbol: string;
  line_start: number;
  line_end: number;
  reason: string;
  recommended_mode: string;
  side_effect_risk: string;
  replayability: string;
  denylist_hit: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProbePlanOut {
  id: number;
  system_id: number;
  snapshot_id: number;
  intelligence_run_id: number;
  feature_id: string;
  objective: string;
  status: string;
  avoid_reasons: string[];
  probe_points: ProbePointOut[];
  intelligence_run: IntelligenceRunOut | null;
  is_mock: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProbePlansListOut {
  system_id: number;
  plans: ProbePlanOut[];
  is_mock: boolean;
}

export interface ValidationCommandOut {
  id: number;
  command: string;
  exit_code: number | null;
  duration_ms: number | null;
  stdout: string;
  stderr: string;
  stdout_truncated: boolean;
  stderr_truncated: boolean;
  timed_out: boolean;
}

export interface ValidationRunOut {
  id: number;
  patch_id: number;
  system_id: number;
  variant: string;
  worktree_path: string | null;
  overall_success: boolean;
  total_duration_ms: number | null;
  trace_received: boolean;
  trace_status: string | null;
  network_isolation: boolean;
  cleanup_state: string | null;
  cleanup_error: string | null;
  commands: ValidationCommandOut[];
  error: string | null;
  created_at: string;
}

export interface ProbePatchOut {
  id: number;
  plan_id: number;
  system_id: number;
  snapshot_id: number;
  commit_sha: string;
  diff: string;
  worktree_path: string | null;
  skipped: string[];
  status: string;
  error: string | null;
  cleanup_state: string | null;
  cleanup_error: string | null;
  apply_status: string;
  apply_error: string | null;
  applied_at: string | null;
  applied_by_user_id: number | null;
  validation_runs: ValidationRunOut[];
  created_at: string;
}

export interface GenerationRun {
  id: number;
  system_id: number;
  component_id: string;
  trace_id: string;
  objective: string;
  input_json: string | null;
  current_output: string | null;
  generated_code: string | null;
  generation_notes: string | null;
  candidate_output: string | null;
  execution_error: string | null;
  llm_verdict: string | null;
  llm_reason: string | null;
  llm_risks: string | null;
  llm_recommendation: string | null;
  created_at: string;
}

export interface ExperimentVariantCreate {
  label: string;
  patch_text: string;
  source?: string;
  risk_note?: string;
}

export interface ExperimentCreate {
  feature_id: string;
  objective: string;
  snapshot_id: number;
  variants: ExperimentVariantCreate[];
}

export interface ExperimentVariantResultOut {
  id: number;
  variant_key: string;
  label: string;
  is_baseline: boolean;
  patch_text: string | null;
  patch_hash: string | null;
  source: string;
  risk_note: string;
  status: string;
  error: string | null;
  workspace_path: string | null;
  cleanup_state: string | null;
  cleanup_error: string | null;
  metrics: Record<string, unknown> | null;
  artifacts: Record<string, unknown> | null;
  commands: ValidationCommandOut[];
  started_at: string | null;
  completed_at: string | null;
}

export interface ExperimentOut {
  id: number;
  system_id: number;
  feature_id: string;
  objective: string;
  snapshot_id: number;
  baseline_commit: string | null;
  config_revision: number;
  execution: Record<string, unknown> | null;
  status: string;
  error: string | null;
  human_decision: string | null;
  human_decision_variant_key: string | null;
  human_decision_note: string | null;
  variants: ExperimentVariantResultOut[];
  comparison: Record<string, unknown> | null;
  analysis: Record<string, unknown> | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface EvaluationCriterion {
  id: number;
  component_id: string;
  name: string;
  description: string;
  criterion_type: string;
  expected_value: string;
  weight: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface EvaluationResult {
  id: number;
  trace_id: string;
  component_id: string;
  criterion_id: number;
  status: string;
  score: number | null;
  reason: string;
  actual_output: string | null;
  expected_value: string | null;
  created_at: string;
}

export interface SystemProfile {
  name: string;
  purpose: string;
  target_users: string;
  stakeholder_value: string;
  constraints: string;
  success_criteria: string;
  created_at: string;
  updated_at: string;
}
