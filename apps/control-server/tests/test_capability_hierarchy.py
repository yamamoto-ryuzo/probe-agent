"""Tests for Issue #56: source-backed capability hierarchy.

Covers deterministic source-authored extraction, API-entrypoint classification
and unclassified handling, external boundaries as supporting elements, node
provenance/decision method, reasoning-assisted grouping (success + fail-closed),
and system/snapshot isolation.
"""

import json
import subprocess

import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Unit tests: deterministic builder
# ---------------------------------------------------------------------------


def _sym(symbol_id, qn, **kw):
    from app.capability_hierarchy import SymbolRecord

    base = dict(
        symbol_id=symbol_id, path="src/m.py", qualified_name=qn, kind="function",
        start_line=1, end_line=5,
    )
    base.update(kw)
    return SymbolRecord(**base)


class TestBuildHierarchy:
    def test_groups_by_source_authored_capability(self):
        from app.capability_hierarchy import build_hierarchy

        symbols = [
            _sym(1, "build_graph", has_metadata=True, capability="flow",
                 element_type="core", role="Builds the flow graph",
                 state_effects=["database-read"]),
            _sym(2, "list_flows", has_metadata=True, capability="flow",
                 element_type="element", role="Lists flows"),
            _sym(3, "unrelated", has_metadata=False),
        ]
        built = build_hierarchy(symbols, [], None)
        assert len(built.capabilities) == 1
        cap = built.capabilities[0]
        assert cap.capability_key == "flow"
        assert cap.summary == "Builds the flow graph"
        assert cap.provenance_kind == "source_authored"
        element_names = {c.name for c in cap.children if c.node_type == "element"}
        assert "build_graph" in element_names and "list_flows" in element_names
        supporting = [c for c in cap.children if c.node_type == "supporting"]
        assert any(s.supporting_kind == "database" for s in supporting)

    def test_system_purpose_from_metadata(self):
        from app.capability_hierarchy import build_hierarchy

        symbols = [
            _sym(1, "src.m", kind="module", has_metadata=True,
                 system_purpose="Coordinate flow analysis", element_type="system"),
        ]
        built = build_hierarchy(symbols, [], None)
        assert built.purpose is not None
        assert built.purpose.summary == "Coordinate flow analysis"
        assert built.purpose.provenance_kind == "source_authored"

    def test_purpose_falls_back_to_system_profile_draft(self):
        from app.capability_hierarchy import build_hierarchy

        built = build_hierarchy([], [], {"id": 7, "name": "Sys", "purpose": "Do things"})
        assert built.purpose is not None
        assert built.purpose.summary == "Do things"
        assert built.purpose.provenance_kind == "structural"
        assert built.purpose.system_profile_draft_id == 7

    def test_unclassified_api_entrypoint(self):
        from app.capability_hierarchy import build_hierarchy, EntrypointRecord

        symbols = [_sym(1, "handler", has_metadata=False)]
        eps = [EntrypointRecord(
            entrypoint_id=10, category="api", label="GET /x",
            handler_symbol_id=1, handler_path="src/m.py",
            handler_qualified_name="handler", line_start=1, line_end=5,
        )]
        built = build_hierarchy(symbols, eps, None)
        assert len(built.unclassified_elements) == 1
        assert built.unclassified_elements[0].classification == "unclassified"

    def test_api_entrypoint_classified_when_handler_has_capability(self):
        from app.capability_hierarchy import build_hierarchy, EntrypointRecord

        symbols = [_sym(1, "handler", has_metadata=True, capability="flow",
                        element_type="element", role="handles")]
        eps = [EntrypointRecord(
            entrypoint_id=10, category="api", label="GET /x",
            handler_symbol_id=1, handler_path="src/m.py",
            handler_qualified_name="handler", line_start=1, line_end=5,
        )]
        built = build_hierarchy(symbols, eps, None)
        assert built.unclassified_elements == []
        cap = built.capability_by_key("flow")
        ep_nodes = [c for c in cap.children if c.entrypoint_id == 10]
        assert len(ep_nodes) == 1
        assert ep_nodes[0].classification == "classified"
        assert ep_nodes[0].provenance_kind == "source_authored"

    def test_non_api_entrypoint_becomes_supporting(self):
        from app.capability_hierarchy import build_hierarchy, EntrypointRecord

        eps = [EntrypointRecord(
            entrypoint_id=11, category="scheduled_job", label="nightly",
            handler_path="src/jobs.py", handler_qualified_name="nightly",
            line_start=1, line_end=3,
        )]
        built = build_hierarchy([], eps, None)
        assert len(built.unattached_supporting) == 1
        assert built.unattached_supporting[0].supporting_kind == "scheduled-job"

    def test_build_is_deterministic(self):
        from app.capability_hierarchy import build_hierarchy

        symbols = [
            _sym(2, "b", has_metadata=True, capability="beta", element_type="element"),
            _sym(1, "a", has_metadata=True, capability="alpha", element_type="element"),
        ]
        first = build_hierarchy(symbols, [], None)
        second = build_hierarchy(symbols, [], None)
        assert [c.capability_key for c in first.capabilities] == ["alpha", "beta"]
        assert [c.capability_key for c in first.capabilities] == [
            c.capability_key for c in second.capabilities
        ]


# ---------------------------------------------------------------------------
# API tests
# ---------------------------------------------------------------------------


@pytest.fixture
def admin_client(tmp_path, monkeypatch):
    monkeypatch.setenv("PROBE_DB_PATH", str(tmp_path / "probe-hier-test.db"))
    monkeypatch.setenv("CONTROL_ADMIN_USERNAME", "root")
    monkeypatch.setenv("CONTROL_ADMIN_PASSWORD", "s3cret")
    monkeypatch.setenv("LLM_PROVIDER", "mock")
    monkeypatch.setenv("PROBE_REPOSITORY_ROOTS", str(tmp_path))
    monkeypatch.delenv("INTELLIGENCE_LLM_PROVIDER", raising=False)
    monkeypatch.delenv("INTELLIGENCE_LLM_MODEL", raising=False)
    monkeypatch.delenv("CONTROL_API_KEYS", raising=False)
    from app.llm import get_llm_client

    get_llm_client.cache_clear()
    from app.main import app

    with TestClient(app) as c:
        yield c


def _login(client):
    r = client.post("/auth/login", json={"username": "root", "password": "s3cret"})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def _headers(token, system_id):
    return {
        "Authorization": f"Bearer {token}",
        "X-Probe-System-Id": str(system_id),
    }


def _create_system(client, token, name):
    r = client.post(
        "/systems",
        json={"name": name, "environment": "test", "description": f"{name} desc"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 201, r.text
    return r.json()


FLOW_PY = (
    'from fastapi import APIRouter\n'
    'router = APIRouter()\n'
    '\n'
    '\n'
    'def build_flow_graph():\n'
    '    """Build a flow graph.\n'
    '\n'
    '    probe-agent:\n'
    '      role: Builds the deterministic flow graph\n'
    '      capability: execution-flow-understanding\n'
    '      element_type: core\n'
    '      operation_kind: analysis\n'
    '      state_effects: [database-read]\n'
    '    """\n'
    '    return {}\n'
    '\n'
    '\n'
    '@router.get("/flow")\n'
    'def get_flow():\n'
    '    """Return a flow.\n'
    '\n'
    '    probe-agent:\n'
    '      role: Lists available flows\n'
    '      capability: execution-flow-understanding\n'
    '      element_type: element\n'
    '    """\n'
    '    return build_flow_graph()\n'
    '\n'
    '\n'
    '@router.get("/unrelated")\n'
    'def get_unrelated():\n'
    '    return 1\n'
)


def _make_repo(tmp_path, name="repo", body=FLOW_PY):
    repo = tmp_path / name
    repo.mkdir()
    subprocess.run(["git", "init", str(repo)], check=True, capture_output=True)
    subprocess.run(["git", "-C", str(repo), "config", "user.email", "t@t.com"],
                   check=True, capture_output=True)
    subprocess.run(["git", "-C", str(repo), "config", "user.name", "T"],
                   check=True, capture_output=True)
    (repo / "src").mkdir()
    (repo / "src" / "flow.py").write_text(body)
    subprocess.run(["git", "-C", str(repo), "add", "."], check=True, capture_output=True)
    subprocess.run(["git", "-C", str(repo), "commit", "-m", "init"],
                   check=True, capture_output=True)
    return repo


def _index(client, token, system_id, repo):
    h = _headers(token, system_id)
    client.put("/repository",
               json={"repo_path": str(repo), "include_patterns": ["src/**"]}, headers=h)
    client.post("/repository/snapshots", headers=h)
    r = client.post("/repository/symbols/index", headers=h)
    assert r.status_code == 201, r.text


class TestCapabilityHierarchyAPI:
    def test_generates_source_authored_hierarchy(self, admin_client, tmp_path):
        token = _login(admin_client)
        system = _create_system(admin_client, token, "HierSys")
        repo = _make_repo(tmp_path)
        h = _headers(token, system["id"])
        _index(admin_client, token, system["id"], repo)

        r = admin_client.post("/repository/capability-hierarchy/generate", headers=h)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["intelligence_run"]["decision_method"] == "deterministic"
        assert body["intelligence_run"]["status"] == "completed"

        caps = body["capabilities"]
        assert len(caps) == 1
        cap = caps[0]
        assert cap["capability_key"] == "execution-flow-understanding"
        assert cap["provenance"]["provenance_kind"] == "source_authored"
        # Every node carries provenance with a decision method and hashes.
        assert cap["provenance"]["decision_method"] == "deterministic"
        assert any(
            e["provenance"]["symbol_source_hash"] for e in cap["elements"]
        )
        # External boundary (database-read) became a supporting element.
        assert any(
            s["supporting_kind"] == "database" for s in cap["supporting_elements"]
        )

    def test_unclassified_api_entrypoint_marked(self, admin_client, tmp_path):
        token = _login(admin_client)
        system = _create_system(admin_client, token, "HierUnclass")
        repo = _make_repo(tmp_path)
        h = _headers(token, system["id"])
        _index(admin_client, token, system["id"], repo)

        body = admin_client.post(
            "/repository/capability-hierarchy/generate", headers=h
        ).json()
        unclassified = body["unclassified_elements"]
        names = {e["name"] for e in unclassified}
        assert "GET /unrelated" in names
        for e in unclassified:
            assert e["classification"] == "unclassified"

    def test_classified_api_entrypoint_under_capability(self, admin_client, tmp_path):
        token = _login(admin_client)
        system = _create_system(admin_client, token, "HierClass")
        repo = _make_repo(tmp_path)
        h = _headers(token, system["id"])
        _index(admin_client, token, system["id"], repo)

        body = admin_client.post(
            "/repository/capability-hierarchy/generate", headers=h
        ).json()
        cap = body["capabilities"][0]
        ep_elements = [e for e in cap["elements"] if e["provenance"]["entrypoint_id"]]
        assert any(e["name"] == "GET /flow" for e in ep_elements)

    def test_get_returns_latest_and_empty_without_run(self, admin_client, tmp_path):
        token = _login(admin_client)
        system = _create_system(admin_client, token, "HierGet")
        h = _headers(token, system["id"])

        empty = admin_client.get("/repository/capability-hierarchy", headers=h).json()
        assert empty["capabilities"] == []
        assert empty["intelligence_run"] is None

        repo = _make_repo(tmp_path)
        _index(admin_client, token, system["id"], repo)
        admin_client.post("/repository/capability-hierarchy/generate", headers=h)

        got = admin_client.get("/repository/capability-hierarchy", headers=h).json()
        assert len(got["capabilities"]) == 1

    def test_reasoning_mock_is_marked_and_no_assignment(self, admin_client, tmp_path):
        token = _login(admin_client)
        system = _create_system(admin_client, token, "HierMock")
        repo = _make_repo(tmp_path)
        h = _headers(token, system["id"])
        _index(admin_client, token, system["id"], repo)

        body = admin_client.post(
            "/repository/capability-hierarchy/generate?use_reasoning=true", headers=h
        ).json()
        assert body["intelligence_run"]["decision_method"] == "reasoning_llm"
        assert body["intelligence_run"]["status"] == "completed"
        assert body["is_mock"] is True
        # Mock proposes nothing: the unclassified entrypoint stays unclassified.
        assert any(
            e["name"] == "GET /unrelated" for e in body["unclassified_elements"]
        )

    def test_reasoning_requires_reasoning_model_fails_closed(
        self, admin_client, tmp_path, monkeypatch
    ):
        token = _login(admin_client)
        system = _create_system(admin_client, token, "HierFail")
        repo = _make_repo(tmp_path)
        h = _headers(token, system["id"])
        _index(admin_client, token, system["id"], repo)

        # A non-reasoning model must be rejected: the run fails and unclassified
        # entrypoints are NOT guessed at (no heuristic fallback).
        monkeypatch.setenv("LLM_PROVIDER", "openai")
        monkeypatch.setenv("LLM_MODEL", "gpt-4")
        monkeypatch.setenv("LLM_API_KEY", "unused")
        body = admin_client.post(
            "/repository/capability-hierarchy/generate?use_reasoning=true", headers=h
        ).json()
        assert body["intelligence_run"]["status"] == "failed"
        assert "reasoning model" in (body["intelligence_run"]["error_details"] or "")
        # Deterministic source-authored facts are still persisted.
        assert len(body["capabilities"]) == 1
        # The unclassified entrypoint was not assigned to any capability.
        assert any(
            e["name"] == "GET /unrelated" for e in body["unclassified_elements"]
        )

    def test_reasoning_success_classifies_entrypoint(
        self, admin_client, tmp_path, monkeypatch
    ):
        token = _login(admin_client)
        system = _create_system(admin_client, token, "HierReason")
        repo = _make_repo(tmp_path)
        h = _headers(token, system["id"])
        _index(admin_client, token, system["id"], repo)

        # Find the unclassified entrypoint's id from a deterministic run first.
        det = admin_client.post(
            "/repository/capability-hierarchy/generate", headers=h
        ).json()
        ep_id = det["unclassified_elements"][0]["provenance"]["entrypoint_id"]

        class _Client:
            def generate_text(self, messages, *, temperature=None, max_tokens=None):
                return json.dumps({"assignments": [{
                    "entrypoint_id": ep_id,
                    "capability_key": "execution-flow-understanding",
                    "reason": "Serves the same flow capability.",
                }]})

        monkeypatch.setenv("LLM_PROVIDER", "openai")
        monkeypatch.setenv("LLM_MODEL", "gpt-5")
        monkeypatch.setenv("LLM_API_KEY", "unused")
        monkeypatch.setattr(
            "app.routes.project_intelligence.create_llm_client",
            lambda config: _Client(),
        )
        body = admin_client.post(
            "/repository/capability-hierarchy/generate?use_reasoning=true", headers=h
        ).json()
        assert body["intelligence_run"]["status"] == "completed"
        assert body["intelligence_run"]["decision_method"] == "reasoning_llm"
        # The entrypoint moved under the capability with reasoning provenance.
        cap = body["capabilities"][0]
        reasoned = [
            e for e in cap["elements"]
            if e["provenance"]["entrypoint_id"] == ep_id
        ]
        assert len(reasoned) == 1
        assert reasoned[0]["provenance"]["provenance_kind"] == "reasoning_llm"
        assert reasoned[0]["provenance"]["provider"] == "openai"
        assert not any(
            e["provenance"]["entrypoint_id"] == ep_id
            for e in body["unclassified_elements"]
        )

    def test_hierarchy_is_system_scoped(self, admin_client, tmp_path):
        token = _login(admin_client)
        sys_a = _create_system(admin_client, token, "HierA")
        sys_b = _create_system(admin_client, token, "HierB")
        repo_a = _make_repo(tmp_path, name="a")
        # B has no probe-agent metadata at all.
        repo_b = _make_repo(
            tmp_path, name="b",
            body="def plain():\n    return 1\n",
        )
        _index(admin_client, token, sys_a["id"], repo_a)
        _index(admin_client, token, sys_b["id"], repo_b)

        admin_client.post("/repository/capability-hierarchy/generate",
                          headers=_headers(token, sys_a["id"]))
        body_b = admin_client.post(
            "/repository/capability-hierarchy/generate",
            headers=_headers(token, sys_b["id"]),
        ).json()
        assert body_b["capabilities"] == []
        # A's capability must not leak into B.
        got_b = admin_client.get(
            "/repository/capability-hierarchy", headers=_headers(token, sys_b["id"])
        ).json()
        assert got_b["capabilities"] == []
