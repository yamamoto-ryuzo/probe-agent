/// <reference types="vitest/globals" />
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import type { ReactNode } from "react";

const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};
let mockSystemId: number | null = 1;

vi.mock("@/api/client", () => ({
  api: mockApi,
  getSystemId: () => mockSystemId,
  setSystemId: (id: number | null) => { mockSystemId = id; },
  getSessionToken: () => "fake-token",
  setSessionToken: vi.fn(),
}));

vi.mock("@/api/auth", () => ({
  useAuth: () => ({
    user: { id: 1, username: "admin", role: "admin" },
    isAdmin: true,
    loading: false,
    systemId: mockSystemId,
    systems: [],
    login: vi.fn(),
    logout: vi.fn(),
    selectSystem: vi.fn(),
    refreshSystems: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

// ── Repository config tests ─────────────────────────────────────────

describe("Repository config page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSystemId = 1;
  });

  test("shows config values from the loaded system", async () => {
    mockApi.get.mockImplementation((path: string) => {
      if (path === "/repository") {
        return Promise.resolve({
          id: 1, system_id: 1, repo_path: "/repos/alpha",
          include_patterns: ["*.py", "*.ts"],
          exclude_patterns: ["__pycache__"],
        });
      }
      if (path === "/repository-candidates") {
        return Promise.resolve([{ name: "alpha", path: "/repos/alpha" }]);
      }
      if (path === "/repository/snapshots") return Promise.resolve([]);
      if (path === "/repository/symbols") return Promise.resolve({ symbols: [], symbol_count: 0 });
      return Promise.resolve(null);
    });

    const { default: RepositoryPage } = await import("@/pages/repository");
    render(<RepositoryPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toHaveValue("/repos/alpha");
    });
    const textareas = screen.getAllByRole("textbox");
    const includeTextarea = textareas.find(t => (t as HTMLTextAreaElement).value.includes("*.py"));
    expect(includeTextarea).toBeTruthy();
    expect((includeTextarea as HTMLTextAreaElement).value).toBe("*.py\n*.ts");
  });

  test("shows empty form when system has no config", async () => {
    mockApi.get.mockImplementation((path: string) => {
      if (path === "/repository") return Promise.resolve(null);
      if (path === "/repository-candidates") {
        return Promise.resolve([{ name: "alpha", path: "/repos/alpha" }]);
      }
      if (path === "/repository/snapshots") return Promise.resolve([]);
      if (path === "/repository/symbols") return Promise.resolve({ symbols: [], symbol_count: 0 });
      return Promise.resolve(null);
    });

    const { default: RepositoryPage } = await import("@/pages/repository");
    render(<RepositoryPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
    expect(screen.getByRole("combobox")).toHaveValue("");
  });

  test("sends include_patterns and exclude_patterns as arrays", async () => {
    mockApi.get.mockImplementation((path: string) => {
      if (path === "/repository") {
        return Promise.resolve({
          id: 1, system_id: 1, repo_path: "/repos/alpha",
          include_patterns: ["*.py"], exclude_patterns: [],
        });
      }
      if (path === "/repository-candidates") {
        return Promise.resolve([{ name: "alpha", path: "/repos/alpha" }]);
      }
      if (path === "/repository/snapshots") return Promise.resolve([]);
      if (path === "/repository/symbols") return Promise.resolve({ symbols: [], symbol_count: 0 });
      return Promise.resolve(null);
    });
    mockApi.put.mockResolvedValue({
      id: 1, system_id: 1, repo_path: "/repos/alpha",
      include_patterns: ["*.py", "*.ts"], exclude_patterns: ["node_modules"],
    });

    const { default: RepositoryPage } = await import("@/pages/repository");
    render(<RepositoryPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toHaveValue("/repos/alpha");
    });

    const textareas = screen.getAllByRole("textbox");
    const includeTextarea = textareas.find(t => (t as HTMLTextAreaElement).value.includes("*.py"));
    const excludeTextarea = textareas.find(t => (t as HTMLTextAreaElement).placeholder?.includes("test_"));

    fireEvent.change(includeTextarea!, { target: { value: "*.py\n*.ts" } });
    fireEvent.change(excludeTextarea!, { target: { value: "node_modules" } });

    fireEvent.click(screen.getByText("Save Configuration"));

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith("/repository", {
        repo_path: "/repos/alpha",
        include_patterns: ["*.py", "*.ts"],
        exclude_patterns: ["node_modules"],
      });
    });
  });
});

// ── Experiment creation tests ───────────────────────────────────────

function setupExperimentMocks(experiments: unknown[] = []) {
  mockApi.get.mockImplementation((path: string) => {
    if (path === "/experiments") return Promise.resolve(experiments);
    if (path === "/repository/snapshots") return Promise.resolve([
      { id: 1, system_id: 1, commit_sha: "abc12345", status: "ready", file_count: 10, created_at: "2024-01-01T00:00:00Z" },
    ]);
    if (path === "/repository/drafts/latest") return Promise.resolve({ feature_drafts: [] });
    return Promise.resolve(null);
  });
}

async function openCreateDialog() {
  const { default: ExperimentsPage } = await import("@/pages/experiments");
  render(<ExperimentsPage />, { wrapper: createWrapper() });

  await waitFor(() => {
    expect(screen.getByText("New Experiment")).toBeInTheDocument();
  });
  fireEvent.click(screen.getByText("New Experiment"));

  await waitFor(() => {
    expect(screen.getByPlaceholderText("feature-id")).toBeInTheDocument();
  });
}

function fillBasicFields() {
  fireEvent.change(screen.getByPlaceholderText("feature-id"), { target: { value: "feat-1" } });
  fireEvent.change(screen.getByPlaceholderText("What are you trying to learn?"), { target: { value: "Test objective" } });
  const selects = screen.getAllByRole("combobox");
  const snapshotSelect = selects[selects.length - 1];
  fireEvent.change(snapshotSelect, { target: { value: "1" } });
}

describe("Experiment creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSystemId = 1;
  });

  test("button disabled when fewer than 2 valid variants", async () => {
    setupExperimentMocks();
    await openCreateDialog();
    fillBasicFields();

    const labelInputs = screen.getAllByPlaceholderText("Label (e.g., optimized-v1)");
    const patchInputs = screen.getAllByPlaceholderText("Patch text (unified diff format)");
    fireEvent.change(labelInputs[0], { target: { value: "variant-a" } });
    fireEvent.change(patchInputs[0], { target: { value: "patch-a" } });

    const buttons = screen.getAllByRole("button");
    const createBtn = buttons.find(b => b.textContent === "Create Experiment");
    expect(createBtn).toBeDisabled();
  });

  test("submits when 2 valid variants are provided", async () => {
    setupExperimentMocks();
    mockApi.post.mockResolvedValue({
      id: 1, feature_id: "feat-1", objective: "Test", status: "draft",
      variants: [], created_at: "2024-01-01",
    });

    await openCreateDialog();
    fillBasicFields();

    const labelInputs = screen.getAllByPlaceholderText("Label (e.g., optimized-v1)");
    const patchInputs = screen.getAllByPlaceholderText("Patch text (unified diff format)");

    fireEvent.change(labelInputs[0], { target: { value: "variant-a" } });
    fireEvent.change(patchInputs[0], { target: { value: "patch-a" } });
    fireEvent.change(labelInputs[1], { target: { value: "variant-b" } });
    fireEvent.change(patchInputs[1], { target: { value: "patch-b" } });

    const buttons = screen.getAllByRole("button");
    const createBtn = buttons.find(b => b.textContent === "Create Experiment")!;
    expect(createBtn).not.toBeDisabled();

    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith("/experiments", {
        feature_id: "feat-1",
        objective: "Test objective",
        snapshot_id: 1,
        variants: [
          { label: "variant-a", patch_text: "patch-a" },
          { label: "variant-b", patch_text: "patch-b" },
        ],
      });
    });
  });

  test("cannot delete variants below 2", async () => {
    setupExperimentMocks();
    await openCreateDialog();

    expect(screen.getByText("Variant 1")).toBeInTheDocument();
    expect(screen.getByText("Variant 2")).toBeInTheDocument();

    const trashIcons = document.querySelectorAll(".lucide-trash-2");
    expect(trashIcons.length).toBe(0);
  });
});

// ── Experiment decision tests ───────────────────────────────────────

describe("Experiment decision (adopted)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSystemId = 1;
  });

  test("adopted decision sends variant_key and non-empty note", async () => {
    const expData = {
      id: 1, feature_id: "feat-1", objective: "Test", status: "completed",
      human_decision: null, human_decision_variant_key: null, human_decision_note: null,
      created_at: "2024-01-01T00:00:00Z",
      variants: [
        { id: 1, variant_key: "baseline", label: "Baseline", is_baseline: true, status: "completed", patch_text: null, risk_note: null, error: null, metrics: {} },
        { id: 2, variant_key: "opt-v1", label: "Optimized V1", is_baseline: false, status: "completed", patch_text: "patch", risk_note: null, error: null, metrics: { latency: 0.5 } },
      ],
      comparison: {},
    };

    setupExperimentMocks([expData]);
    mockApi.put.mockResolvedValue({ ...expData, human_decision: "adopted" });

    const { default: ExperimentsPage } = await import("@/pages/experiments");
    render(<ExperimentsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Experiment #1/)).toBeInTheDocument();
    });

    const header = screen.getByText(/Experiment #1/).closest("[class*=cursor-pointer]")!;
    fireEvent.click(header);

    await waitFor(() => {
      expect(screen.getByText("Decision")).toBeInTheDocument();
    });

    const verdictSelect = screen.getAllByRole("combobox").find(
      s => s.querySelector("option[value='adopted']")
    ) as HTMLSelectElement;
    fireEvent.change(verdictSelect, { target: { value: "adopted" } });

    await waitFor(() => {
      expect(screen.getByText("Adopt Variant *")).toBeInTheDocument();
    });

    const variantSelect = screen.getAllByRole("combobox").find(
      s => s.querySelector("option[value='opt-v1']")
    ) as HTMLSelectElement;
    fireEvent.change(variantSelect, { target: { value: "opt-v1" } });

    const noteTextarea = screen.getByPlaceholderText("Reason for decision...");
    fireEvent.change(noteTextarea, { target: { value: "Better performance" } });

    fireEvent.click(screen.getByText("Save Decision"));

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith("/experiments/1/decision", {
        decision: "adopted",
        variant_key: "opt-v1",
        note: "Better performance",
      });
    });
  });
});

// ── Probe Patch explicit apply tests ────────────────────────────────

describe("Probe Patch application", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSystemId = 1;
  });

  test("requires typed confirmation and sends the pinned commit", async () => {
    mockApi.get.mockImplementation((path: string) => {
      if (path === "/repository/probe-plans") {
        return Promise.resolve({
          system_id: 1,
          is_mock: false,
          plans: [{
            id: 10,
            feature_id: "feat-1",
            objective: "Observe behavior",
            status: "proposed",
            created_at: "2024-01-01",
            probe_points: [],
          }],
        });
      }
      if (path === "/repository/probe-patches") {
        return Promise.resolve([{
          id: 20,
          plan_id: 10,
          system_id: 1,
          snapshot_id: 5,
          commit_sha: "abcdef1234567890",
          diff: "diff --git a/a.py b/a.py",
          worktree_path: null,
          skipped: [],
          status: "generated",
          error: null,
          cleanup_state: "removed",
          cleanup_error: null,
          apply_status: "not_applied",
          apply_error: null,
          applied_at: null,
          applied_by_user_id: null,
          validation_runs: [
            { id: 1, variant: "baseline", overall_success: true, commands: [] },
            { id: 2, variant: "probed", overall_success: true, commands: [] },
          ],
          created_at: "2024-01-01",
        }]);
      }
      return Promise.resolve(null);
    });
    mockApi.post.mockResolvedValue({ apply_status: "applied" });

    const { default: ProbePlannerPage } = await import("@/pages/probe-planner");
    render(<ProbePlannerPage />, { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText("Feature: feat-1")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Feature: feat-1"));
    await waitFor(() => expect(screen.getByText("Apply")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Apply"));

    const confirmButton = await screen.findByText("Apply to Repository");
    expect(confirmButton).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("APPLY"), {
      target: { value: "APPLY" },
    });
    expect(confirmButton).not.toBeDisabled();
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        "/repository/probe-patches/20/apply",
        {
          confirmed: true,
          expected_commit_sha: "abcdef1234567890",
        },
      );
    });
  });
});
