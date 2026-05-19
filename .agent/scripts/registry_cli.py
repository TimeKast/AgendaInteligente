#!/usr/bin/env python3
"""
registry_cli.py — Agent Registry CLI

Manages the agent/skill registry: add entries, rebuild views, validate integrity.
Used by the /factory_agents workflow.

Usage:
  python3 .agent/scripts/registry_cli.py add-agent --name NAME --keywords KW1,KW2 [options]
  python3 .agent/scripts/registry_cli.py add-skill --name NAME --category CAT --keywords KW1,KW2 [options]
  python3 .agent/scripts/registry_cli.py register --path PATH [--scope kit|project]
  python3 .agent/scripts/registry_cli.py rebuild
  python3 .agent/scripts/registry_cli.py validate [--strict]

Requirements: Python 3.9+, PyYAML (pip install pyyaml)
"""

import argparse
import os
import sys
from datetime import datetime
from pathlib import Path

try:
    import yaml
except ImportError:
    print("❌ PyYAML required: pip3 install pyyaml")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
AGENT_DIR = Path(".agent")
REGISTRY_FILE = AGENT_DIR / "registry" / "registry.yaml"
PROJECT_FILE = AGENT_DIR / "registry" / "project.yaml"
VIEWS_DIR = AGENT_DIR / "registry" / "views"

VALID_SCOPES = ("kit", "project")
VALID_SKILL_CATEGORIES = ("domains", "kit", "roles", "utils")
VALID_ACTIVATION_MODES = ("auto", "workflow_only", "explicit_only")
VALID_DIMENSIONS = ("ui", "db", "api", "security", "testing", "infra", "docs", "mobile")
VALID_INTERACTION_MODES = ("complement", "override", "exclude")

TAXONOMY_COUNTS = {
    "agents": 29,
    "domain_skills": 5,
    "kit_skills": 30,
    "role_skills": 7,
    "universal_skills": 5,
    "utils_skills": 1,
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def load_registry():
    """Load and return the registry YAML."""
    if not REGISTRY_FILE.exists():
        print(f"❌ Registry not found: {REGISTRY_FILE}")
        sys.exit(1)
    with open(REGISTRY_FILE) as f:
        return yaml.safe_load(f)


def save_registry(data):
    """Save registry data back to YAML."""
    with open(REGISTRY_FILE, "w") as f:
        yaml.dump(
            data,
            f,
            default_flow_style=False,
            allow_unicode=True,
            sort_keys=False,
            width=120,
        )


def load_project():
    """Load project.yaml if it exists, return None otherwise."""
    if not PROJECT_FILE.exists():
        return None
    with open(PROJECT_FILE) as f:
        content = yaml.safe_load(f)
    return content if content else None


def parse_list(value):
    """Parse comma-separated string into list."""
    if not value:
        return []
    return [v.strip() for v in value.split(",") if v.strip()]


def check_path_exists(rel_path):
    """Check if a path relative to .agent/ exists."""
    full = AGENT_DIR / rel_path
    return full.exists()


# ---------------------------------------------------------------------------
# Scaffold Templates
# ---------------------------------------------------------------------------
AGENT_SCAFFOLD = """---
name: {name}
description: {description}
---

# {title}

> **Specialist Agent** — {description}

---

## Principles

1. ...
2. ...

---

## Capabilities

- ...

---

## Rules

**ALWAYS:**
1. ...

**NEVER:**
1. ...

---

_TimeKast Factory — {title}_
"""

SKILL_SCAFFOLD = """---
name: {name}
description: {description}
---

# {title}

> **Skill** — {description}

---

## When to Use

- ...

---

## Key Concepts

### 1. ...

...

---

## Rules

**ALWAYS:**
1. ...

**NEVER:**
1. ...

---

_TimeKast Factory — {title}_
"""


# ---------------------------------------------------------------------------
# Subcommand: add-agent
# ---------------------------------------------------------------------------
def cmd_add_agent(args):
    """Add a new agent entry to the registry + scaffold file."""
    registry = load_registry()
    name = args.name
    scope = args.scope
    keywords = parse_list(args.keywords)
    keywords_es = parse_list(args.keywords_es) if args.keywords_es else []
    negative = parse_list(args.negative) if args.negative else []
    domains = parse_list(args.domain) if args.domain else []
    priority = args.priority or 70
    mode = args.activation_mode or "auto"

    # Determine path and target file
    if scope == "project":
        rel_path = f"agents/project/{name}.md"
        yaml_target = "project"
        entry_name = f"project/{name}"
    else:
        rel_path = f"agents/{name}.md"
        yaml_target = "core"
        entry_name = name

    # Check for duplicates
    if entry_name in registry.get("agents", {}):
        print(f"❌ Agent '{entry_name}' already exists in registry")
        sys.exit(1)

    # Scaffold the .md file
    full_path = AGENT_DIR / rel_path
    if not full_path.exists():
        full_path.parent.mkdir(parents=True, exist_ok=True)
        title = name.replace("-", " ").title()
        content = AGENT_SCAFFOLD.format(
            name=name,
            title=title,
            description=args.description or f"{title} specialist agent",
        )
        full_path.write_text(content)
        print(f"✅ Scaffolded: {full_path}")
    else:
        print(f"ℹ️  File already exists: {full_path}")

    # Add entry to registry or project.yaml
    entry = {
        "path": rel_path,
        "scope": scope,
        "keywords_any": keywords,
        "keywords_es": keywords_es,
        "negative_keywords": negative,
        "domains": domains,
        "activation_mode": mode,
        "priority": priority,
    }

    if yaml_target == "project":
        _add_to_project_yaml("agents", entry_name, entry)
    else:
        registry["agents"][entry_name] = entry
        save_registry(registry)
        print(f"✅ Added to registry.yaml: agents.{entry_name}")

    # Auto rebuild + validate
    cmd_rebuild(argparse.Namespace())
    cmd_validate(argparse.Namespace(strict=False))


def _add_to_project_yaml(section, name, entry):
    """Add an entry to project.yaml."""
    project = load_project() or {}
    if section not in project:
        project[section] = {}
    project[section][name] = entry
    with open(PROJECT_FILE, "w") as f:
        yaml.dump(
            project,
            f,
            default_flow_style=False,
            allow_unicode=True,
            sort_keys=False,
            width=120,
        )
    print(f"✅ Added to project.yaml: {section}.{name}")


# ---------------------------------------------------------------------------
# Subcommand: add-skill
# ---------------------------------------------------------------------------
def cmd_add_skill(args):
    """Add a new skill entry to the registry + scaffold file."""
    registry = load_registry()
    name = args.name
    scope = args.scope
    category = args.category
    keywords = parse_list(args.keywords)
    keywords_es = parse_list(args.keywords_es) if args.keywords_es else []

    # Determine path
    if scope == "project":
        rel_path = f"skills/project/{name}/SKILL.md"
        yaml_target = "project"
        entry_name = f"project/{name}"
    elif category == "domains":
        rel_path = f"skills/domains/{name}/SKILL.md"
        yaml_target = "core"
        entry_name = name
    elif category == "kit":
        rel_path = f"skills/{name}/SKILL.md"
        yaml_target = "core"
        entry_name = name
    elif category == "roles":
        rel_path = f"skills/roles/{name}/SKILL.md"
        yaml_target = "core"
        entry_name = name
    else:
        rel_path = f"skills/utils/{name}/SKILL.md"
        yaml_target = "core"
        entry_name = name

    # Check duplicates in target category
    if yaml_target == "core":
        cat_data = registry.get("skills", {}).get(category, {})
        if isinstance(cat_data, dict) and entry_name in cat_data:
            print(f"❌ Skill '{entry_name}' already exists in skills.{category}")
            sys.exit(1)

    # Scaffold
    full_path = AGENT_DIR / rel_path
    if not full_path.exists():
        full_path.parent.mkdir(parents=True, exist_ok=True)
        title = name.replace("-", " ").title()
        content = SKILL_SCAFFOLD.format(
            name=name,
            title=title,
            description=args.description or f"{title} skill",
        )
        full_path.write_text(content)
        print(f"✅ Scaffolded: {full_path}")
    else:
        print(f"ℹ️  File already exists: {full_path}")

    # Add entry
    entry = {"path": rel_path, "keywords_any": keywords, "keywords_es": keywords_es}

    if yaml_target == "project":
        _add_to_project_yaml("skills", entry_name, entry)
    else:
        if category not in registry["skills"]:
            registry["skills"][category] = {}
        registry["skills"][category][entry_name] = entry
        save_registry(registry)
        print(f"✅ Added to registry.yaml: skills.{category}.{entry_name}")

    cmd_rebuild(argparse.Namespace())
    cmd_validate(argparse.Namespace(strict=False))


# ---------------------------------------------------------------------------
# Subcommand: register
# ---------------------------------------------------------------------------
def cmd_register(args):
    """Register an existing file into the registry."""
    registry = load_registry()
    file_path = Path(args.path)

    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        sys.exit(1)

    # Determine if agent or skill from path
    rel = (
        str(file_path)
        .replace(str(AGENT_DIR) + "/", "")
        .replace(str(AGENT_DIR) + os.sep, "")
    )
    if not rel.startswith(("agents/", "skills/")):
        # Try as relative to .agent/
        rel = str(file_path)
        if rel.startswith(".agent/"):
            rel = rel[len(".agent/") :]

    scope = args.scope or "kit"
    keywords = parse_list(args.keywords) if args.keywords else []
    keywords_es = parse_list(args.keywords_es) if args.keywords_es else []

    # Extract metadata from frontmatter if available
    content = file_path.read_text()
    fm_name, fm_desc = _extract_frontmatter(content)

    if rel.startswith("agents/"):
        # It's an agent
        name = Path(rel).stem
        if "project/" in rel:
            scope = "project"
            name = f"project/{Path(rel).stem}"

        if name in registry.get("agents", {}):
            print(f"⚠️  Agent '{name}' already registered — skipping")
            return

        entry = {
            "path": rel,
            "scope": scope,
            "keywords_any": keywords,
            "keywords_es": keywords_es,
            "negative_keywords": [],
            "domains": [],
            "activation_mode": "auto",
            "priority": 70,
        }

        if scope == "project":
            _add_to_project_yaml("agents", name, entry)
        else:
            registry["agents"][name] = entry
            save_registry(registry)
        print(f"✅ Registered agent: {name}")

    elif rel.startswith("skills/"):
        # Determine category
        if "domains/project/" in rel:
            category = "domains"
            scope = "project"
            name = f"project/{Path(rel).parent.name}"
        elif "domains/" in rel:
            category = "domains"
            name = rel.split("domains/")[1].split("/")[0]
        elif "roles/" in rel:
            category = "roles"
            name = rel.split("roles/")[1].split("/")[0]
        elif "utils/" in rel:
            category = "utils"
            name = rel.split("utils/")[1].split("/")[0]
        else:
            category = "kit"
            parts = rel.replace("skills/", "").split("/")
            name = parts[0]

        entry = {"path": rel, "keywords_any": keywords, "keywords_es": keywords_es}

        if scope == "project":
            _add_to_project_yaml("skills", name, entry)
        else:
            if category not in registry["skills"]:
                registry["skills"][category] = {}
            cat_data = registry["skills"][category]
            if isinstance(cat_data, dict):
                if name in cat_data:
                    print(f"⚠️  Skill '{name}' already registered — skipping")
                    return
                cat_data[name] = entry
            save_registry(registry)
        print(f"✅ Registered skill: {category}/{name}")
    else:
        print(f"❌ Cannot determine type from path: {rel}")
        print("   Expected: agents/*.md or skills/**/SKILL.md")
        sys.exit(1)

    cmd_rebuild(argparse.Namespace())
    cmd_validate(argparse.Namespace(strict=False))


def _extract_frontmatter(content):
    """Extract name and description from YAML frontmatter."""
    if not content.startswith("---"):
        return None, None
    parts = content.split("---", 2)
    if len(parts) < 3:
        return None, None
    try:
        fm = yaml.safe_load(parts[1])
        return fm.get("name"), fm.get("description")
    except Exception:
        return None, None


# ---------------------------------------------------------------------------
# Subcommand: rebuild
# ---------------------------------------------------------------------------
def cmd_rebuild(args):
    """Regenerate all view files from registry.yaml (+project.yaml)."""
    registry = load_registry()
    project = load_project()

    # Merge project into registry (in-memory only)
    merged = _merge_project(registry, project)

    VIEWS_DIR.mkdir(parents=True, exist_ok=True)

    # Generate each view
    _gen_full_view(merged)
    _gen_agents_view(merged)
    _gen_skills_view(merged)
    _gen_combos_view(merged)
    _gen_fallbacks_view(merged)

    print(f"✅ Rebuilt {len(list(VIEWS_DIR.glob('*.md')))} views in {VIEWS_DIR}/")


def _merge_project(registry, project):
    """Merge project.yaml into registry (in-memory copy).

    Guards: agents and skills must use 'project/' namespace prefix.
    Issue combos are exempt (project combos can have any name).
    """
    import copy

    merged = copy.deepcopy(registry)
    if not project:
        return merged

    for section in ("agents", "skills", "issue_combos"):
        if section not in project or not isinstance(project[section], dict):
            continue
        target = merged.get(section, {})
        if not isinstance(target, dict):
            continue

        if section == "issue_combos":
            # Combos can have any name
            target.update(project[section])
        elif section == "agents":
            # Agents must use project/ namespace
            for key, value in project[section].items():
                if not key.startswith("project/"):
                    print(
                        f"⚠️  Skipping project agent '{key}': must use 'project/' prefix"
                    )
                    continue
                target[key] = value
        elif section == "skills":
            # Skills must use project/ namespace
            for key, value in project[section].items():
                if not key.startswith("project/"):
                    print(
                        f"⚠️  Skipping project skill '{key}': must use 'project/' prefix"
                    )
                    continue
                target[key] = value

        merged[section] = target
    return merged


def _gen_full_view(data):
    """Generate REGISTRY.md — full human-readable view."""
    lines = [
        "# 📋 Agent Registry",
        "",
        "> **Auto-generated** — Run `python3 .agent/scripts/registry_cli.py rebuild` to update",
        f"> **Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        "",
        "---",
        "",
    ]

    # Agents section
    agents = data.get("agents", {})
    lines.append(f"## Agents ({len(agents)})")
    lines.append("")
    lines.append("| # | Agent | Scope | Domains | Priority | Keywords (EN) |")
    lines.append("|---|-------|-------|---------|----------|---------------|")
    for i, (name, info) in enumerate(agents.items(), 1):
        kw = ", ".join(info.get("keywords_any", [])[:5])
        domains = ", ".join(info.get("domains", [])) or "—"
        lines.append(
            f"| {i} | `{name}` | {info.get('scope', 'kit')} | {domains} | {info.get('priority', 70)} | {kw} |"
        )
    lines.append("")

    # Skills section
    skills = data.get("skills", {})
    for category in ("domains", "kit", "roles", "utils"):
        cat_data = skills.get(category, {})
        if isinstance(cat_data, dict):
            lines.append(f"## Skills — {category.title()} ({len(cat_data)})")
            lines.append("")
            lines.append("| Skill | Path | Keywords (EN) |")
            lines.append("|-------|------|---------------|")
            for name, info in cat_data.items():
                kw = (
                    ", ".join(info.get("keywords_any", [])[:5])
                    if isinstance(info, dict)
                    else "—"
                )
                path = info.get("path", "—") if isinstance(info, dict) else "—"
                lines.append(f"| `{name}` | `{path}` | {kw} |")
            lines.append("")

    # Universal
    universal = skills.get("universal", {})
    if universal and isinstance(universal, dict):
        lines.append(f"## Skills — Universal ({len(universal)})")
        lines.append("")
        lines.append("| Skill | Path |")
        lines.append("| ----- | ---- |")
        for name, info in sorted(universal.items()):
            path = info.get("path", "—") if isinstance(info, dict) else "—"
            lines.append(f"| `{name}` | `{path}` |")
        lines.append("")

    # Project skills (from merged project.yaml)
    project_skills = {
        k: v
        for k, v in skills.items()
        if k not in ("domains", "kit", "roles", "universal", "utils")
        and isinstance(v, dict)
        and "path" in v
    }
    if not project_skills:
        # Also check flat project/ entries at top level of skills
        project_skills = {
            k: v
            for k, v in data.get("agents", {}).items()
            if k.startswith("project/") and False  # agents are separate
        }
    # Check for project/ prefixed entries in the merged data
    proj_entries = {
        k: v
        for k, v in skills.items()
        if isinstance(v, dict) and k.startswith("project/")
    }
    if proj_entries:
        lines.append(f"## Skills — Project ({len(proj_entries)})")
        lines.append("")
        lines.append("| Skill | Path | Keywords (EN) |")
        lines.append("|-------|------|---------------|")
        for name, info in proj_entries.items():
            kw = (
                ", ".join(info.get("keywords_any", [])[:5])
                if isinstance(info, dict)
                else "—"
            )
            path = info.get("path", "—") if isinstance(info, dict) else "—"
            lines.append(f"| `{name}` | `{path}` | {kw} |")
        lines.append("")

    # Routing policy summary
    rp = data.get("routing_policy", {})
    if rp:
        lines.append("## Routing Policy")
        lines.append("")
        prec = rp.get("precedence", {})
        for level, name in sorted(prec.items(), key=lambda x: str(x[0])):
            lines.append(f"{level}. `{name}`")
        lines.append("")
        caps = rp.get("caps", {})
        if caps:
            lines.append(
                f"**Caps:** max {caps.get('max_agents_per_issue', 3)} agents, max {caps.get('max_skills_per_issue', 5)} skills per issue"
            )
            lines.append("")

    lines.append("---")
    lines.append("")
    lines.append("_Auto-generated from registry.yaml_")

    (VIEWS_DIR / "REGISTRY.md").write_text("\n".join(lines))


def _gen_agents_view(data):
    """Generate agents.md — agents catalog + relationships."""
    lines = [
        "# Agents Registry",
        "",
        "> **Auto-generated** — Agents slice for `/implement`",
        "",
        "---",
        "",
    ]
    agents = data.get("agents", {})
    lines.append(f"## Catalog ({len(agents)} agents)")
    lines.append("")
    lines.append("| Agent | Scope | Domains | Priority | Activation |")
    lines.append("|-------|-------|---------|----------|------------|")
    for name, info in agents.items():
        domains = ", ".join(info.get("domains", [])) or "—"
        lines.append(
            f"| `{name}` | {info.get('scope', 'kit')} | {domains} | {info.get('priority', 70)} | {info.get('activation_mode', 'auto')} |"
        )
    lines.append("")

    # Relationships
    rels = data.get("routing_policy", {}).get("agent_relationships", {})
    if rels:
        lines.append("## Relationships")
        lines.append("")
        lines.append("| Agent | Relationship | Target |")
        lines.append("|-------|-------------|--------|")
        for agent, rel_info in rels.items():
            for rel_type, target in rel_info.items():
                lines.append(f"| `{agent}` | {rel_type} | `{target}` |")
        lines.append("")

    lines.append("---")
    lines.append("")
    lines.append("_Auto-generated from registry.yaml_")
    (VIEWS_DIR / "agents.md").write_text("\n".join(lines))


def _gen_skills_view(data):
    """Generate skills.md — skills slice for /backlog."""
    lines = [
        "# Skills Registry",
        "",
        "> **Auto-generated** — Skills slice for `/backlog`",
        "",
        "---",
        "",
    ]
    skills = data.get("skills", {})

    # Domains — keywords EN/ES
    for category in ("domains",):
        cat_data = skills.get(category, {})
        if isinstance(cat_data, dict):
            lines.append(f"## {category.title()} ({len(cat_data)})")
            lines.append("")
            lines.append("| Skill | Keywords (EN) | Keywords (ES) |")
            lines.append("|-------|---------------|---------------|")
            for name, info in cat_data.items():
                kw_en = ", ".join(info.get("keywords_any", [])[:6])
                kw_es = ", ".join(info.get("keywords_es", [])[:6])
                lines.append(f"| `{name}` | {kw_en} | {kw_es} |")
            lines.append("")

    # Kit — keywords EN/ES + activation mode
    cat_data = skills.get("kit", {})
    if isinstance(cat_data, dict):
        lines.append(f"## Kit ({len(cat_data)})")
        lines.append("")
        lines.append("| Skill | Keywords (EN) | Keywords (ES) | Mode |")
        lines.append("|-------|---------------|---------------|------|")
        for name, info in cat_data.items():
            kw_en = ", ".join(info.get("keywords_any", [])[:6])
            kw_es = ", ".join(info.get("keywords_es", [])[:6])
            mode = info.get("activation_mode", "auto")
            lines.append(f"| `{name}` | {kw_en} | {kw_es} | {mode} |")
        lines.append("")

    # Roles — path + workflow
    cat_data = skills.get("roles", {})
    if isinstance(cat_data, dict):
        lines.append(f"## Roles ({len(cat_data)})")
        lines.append("")
        lines.append("| Skill | Path | Workflow |")
        lines.append("|-------|------|----------|")
        for name, info in sorted(cat_data.items()):
            path = info.get("path", "—") if isinstance(info, dict) else "—"
            workflow = info.get("workflow", "—") if isinstance(info, dict) else "—"
            lines.append(f"| `{name}` | `{path}` | {workflow} |")
        lines.append("")

    # Universal — path only
    cat_data = skills.get("universal", {})
    if isinstance(cat_data, dict):
        lines.append(f"## Universal ({len(cat_data)})")
        lines.append("")
        lines.append("| Skill | Path |")
        lines.append("|-------|------|")
        for name, info in sorted(cat_data.items()):
            path = info.get("path", "—") if isinstance(info, dict) else "—"
            lines.append(f"| `{name}` | `{path}` |")
        lines.append("")

    # Utils — path only
    cat_data = skills.get("utils", {})
    if isinstance(cat_data, dict):
        lines.append(f"## Utils ({len(cat_data)})")
        lines.append("")
        lines.append("| Skill | Path |")
        lines.append("|-------|------|")
        for name, info in sorted(cat_data.items()):
            path = info.get("path", "—") if isinstance(info, dict) else "—"
            lines.append(f"| `{name}` | `{path}` |")
        lines.append("")

    lines.append("---")
    lines.append("")
    lines.append("_Auto-generated from registry.yaml_")
    (VIEWS_DIR / "skills.md").write_text("\n".join(lines))


def _gen_combos_view(data):
    """Generate combos.md — issue combos for /backlog add."""
    lines = [
        "# Issue Combos",
        "",
        "> **Auto-generated** — Issue assignment combos for `/backlog add`",
        "",
        "---",
        "",
    ]
    combos = data.get("issue_combos", {})
    combo_entries = {k: v for k, v in combos.items() if k != "resolution_algorithm"}
    lines.append(f"## Combos ({len(combo_entries)})")
    lines.append("")
    lines.append("| Combo | Match (any) | Dimension | Agents | Skills |")
    lines.append("|-------|-------------|-----------|--------|--------|")
    for name, info in combo_entries.items():
        match_any = ", ".join(info.get("match", {}).get("any", [])[:5])
        dim = info.get("dimension", "—")
        agents_list = ", ".join(f"`{a}`" for a in info.get("agents", []))
        skills_list = ", ".join(f"`{s}`" for s in info.get("skills", []))
        lines.append(
            f"| `{name}` | {match_any} | {dim} | {agents_list} | {skills_list} |"
        )
    lines.append("")

    # Resolution algorithm
    ra = combos.get("resolution_algorithm", {})
    if ra:
        lines.append("## Resolution Algorithm")
        lines.append("")
        steps = ra.get("steps", {})
        for num, desc in sorted(steps.items(), key=lambda x: str(x[0])):
            lines.append(f"{num}. `{desc}`")
        lines.append("")
        vr = ra.get("validation_rule", "")
        if vr:
            lines.append(f"> {vr}")
            lines.append("")

    lines.append("---")
    lines.append("")
    lines.append("_Auto-generated from registry.yaml_")
    (VIEWS_DIR / "combos.md").write_text("\n".join(lines))


def _gen_fallbacks_view(data):
    """Generate fallbacks.md — fallback rules for /implement."""
    lines = [
        "# Fallback Policy",
        "",
        "> **Auto-generated** — Fallback rules for `/implement`",
        "",
        "---",
        "",
    ]
    fb = data.get("fallback_policy", {})
    lines.append(f"**Independent evaluation:** `{fb.get('independent', True)}`")
    lines.append("")

    # Contextual
    ctx = fb.get("contextual", [])
    if ctx:
        lines.append(f"## Contextual Detectors ({len(ctx)})")
        lines.append("")
        lines.append("| Keywords | Agents | Skills |")
        lines.append("|----------|--------|--------|")
        for detector in ctx:
            kw = ", ".join(detector.get("detect", {}).get("keywords_any", [])[:5])
            agents_list = ", ".join(f"`{a}`" for a in detector.get("agents", []))
            skills_list = ", ".join(f"`{s}`" for s in detector.get("skills", []))
            lines.append(f"| {kw} | {agents_list} | {skills_list} |")
        lines.append("")

    # Generic
    gen = fb.get("generic", {})
    if gen:
        lines.append("## Generic Fallback")
        lines.append("")
        lines.append(
            f"- **Agents:** {', '.join(f'`{a}`' for a in gen.get('agents', []))}"
        )
        lines.append(
            f"- **Skills:** {', '.join(f'`{s}`' for s in gen.get('skills', []))}"
        )
        lines.append("")

    lines.append("---")
    lines.append("")
    lines.append("_Auto-generated from registry.yaml_")
    (VIEWS_DIR / "fallbacks.md").write_text("\n".join(lines))


# ---------------------------------------------------------------------------
# Subcommand: validate
# ---------------------------------------------------------------------------
def cmd_validate(args):
    """Validate registry integrity. Errors block --strict, warnings don't."""
    registry = load_registry()
    project = load_project()
    errors = []
    warnings = []

    # --- ERRORS (❌) ---

    # 1. Check all agent paths exist
    for name, info in registry.get("agents", {}).items():
        path = info.get("path", "")
        if not check_path_exists(path):
            errors.append(f"Agent '{name}': path not found → .agent/{path}")

    # 2. Check all skill paths exist
    for category in ("domains", "kit", "roles", "utils"):
        cat_data = registry.get("skills", {}).get(category, {})
        if isinstance(cat_data, dict):
            for name, info in cat_data.items():
                path = info.get("path", "")
                if not check_path_exists(path):
                    errors.append(
                        f"Skill '{category}/{name}': path not found → .agent/{path}"
                    )
                # Validate activation_mode for kit skills
                if category == "kit":
                    mode = info.get("activation_mode")
                    if mode is not None and mode not in VALID_ACTIVATION_MODES:
                        errors.append(
                            f"Skill 'kit/{name}': invalid activation_mode '{mode}' "
                            f"(valid: {', '.join(VALID_ACTIVATION_MODES)})"
                        )

    # 3. Check refs in issue_combos
    all_agents = set(registry.get("agents", {}).keys())
    all_skills = set()
    for cat in ("domains", "kit", "roles", "utils"):
        cat_data = registry.get("skills", {}).get(cat, {})
        if isinstance(cat_data, dict):
            for name in cat_data:
                all_skills.add(f"{cat}/{name}" if cat != "kit" else f"kit/{name}")
                all_skills.add(f"domains/{name}" if cat == "domains" else "")
    # Add domains shorthand
    for name in registry.get("skills", {}).get("domains", {}):
        all_skills.add(f"domains/{name}")

    combos = registry.get("issue_combos", {})
    for combo_name, combo in combos.items():
        if combo_name == "resolution_algorithm":
            continue
        for agent in combo.get("agents", []):
            if agent not in all_agents:
                errors.append(f"Combo '{combo_name}': agent '{agent}' not in registry")
        for skill in combo.get("skills", []):
            # Normalize: accept both "domains/x" and "kit/x"
            if skill not in all_skills and not any(
                skill.endswith(f"/{s}")
                for s in [
                    n
                    for cat in ("domains", "kit", "roles", "utils")
                    for n in (
                        registry.get("skills", {}).get(cat, {}).keys()
                        if isinstance(registry.get("skills", {}).get(cat, {}), dict)
                        else []
                    )
                ]
            ):
                # Try direct match
                parts = skill.split("/")
                if len(parts) == 2:
                    cat, name = parts
                    cat_data = registry.get("skills", {}).get(cat, {})
                    if isinstance(cat_data, dict) and name not in cat_data:
                        errors.append(
                            f"Combo '{combo_name}': skill '{skill}' not in registry"
                        )

    # 4. Check workflow refs
    for wf_name, wf in registry.get("workflow_defaults", {}).items():
        for agent in wf.get("agents_always", []):
            if agent not in all_agents:
                errors.append(
                    f"Workflow '{wf_name}': agents_always ref '{agent}' not in registry"
                )
        for cond in wf.get("agents_conditional", []):
            agent = cond.get("agent", "")
            if agent and agent not in all_agents:
                errors.append(
                    f"Workflow '{wf_name}': agents_conditional ref '{agent}' not in registry"
                )

    # 5. Check project namespace
    if project and isinstance(project, dict):
        for name in project.get("agents", {}).keys():
            if not name.startswith("project/"):
                errors.append(
                    f"Project agent '{name}': must use 'project/' namespace prefix"
                )
        for name in project.get("skills", {}).keys():
            if not name.startswith("project/"):
                errors.append(
                    f"Project skill '{name}': must use 'project/' namespace prefix"
                )

        # 5b. Check project agent/skill paths exist
        for name, info in (project.get("agents", {}) or {}).items():
            path = info.get("path", "") if isinstance(info, dict) else ""
            if path and not check_path_exists(path):
                errors.append(f"Project agent '{name}': path not found → .agent/{path}")
        for name, info in (project.get("skills", {}) or {}).items():
            path = info.get("path", "") if isinstance(info, dict) else ""
            if path and not check_path_exists(path):
                errors.append(f"Project skill '{name}': path not found → .agent/{path}")

        # 5c. Check project combo refs resolve (against merged registry)
        merged = _merge_project(registry, project)
        merged_agents = set(merged.get("agents", {}).keys())
        merged_skills = set()
        for cat in ("domains", "kit", "roles", "utils"):
            cat_data = merged.get("skills", {}).get(cat, {})
            if isinstance(cat_data, dict):
                for sname in cat_data:
                    merged_skills.add(f"{cat}/{sname}")
        # Add project/ flat keys (inserted by _merge_project as flat entries)
        for sk_key in merged.get("skills", {}).keys():
            if sk_key.startswith("project/"):
                merged_skills.add(sk_key)
        for combo_name, combo in (project.get("issue_combos", {}) or {}).items():
            if not isinstance(combo, dict):
                continue
            for agent in combo.get("agents", []):
                if agent not in merged_agents:
                    errors.append(
                        f"Project combo '{combo_name}': agent '{agent}' not in merged registry"
                    )
            for skill in combo.get("skills", []):
                if skill in merged_skills:
                    continue  # Already validated (includes project/ flat keys)
                parts = skill.split("/")
                if len(parts) == 2:
                    cat, sname = parts
                    cat_data = merged.get("skills", {}).get(cat, {})
                    if isinstance(cat_data, dict) and sname not in cat_data:
                        errors.append(
                            f"Project combo '{combo_name}': skill '{skill}' not in merged registry"
                        )

    # --- WARNINGS (⚠️) ---

    # 1. Orphan detection (files without registry entries)

    # 1a. Orphan agents
    agent_paths = {info["path"] for info in registry.get("agents", {}).values()}
    for md_file in (AGENT_DIR / "agents").glob("*.md"):
        rel = f"agents/{md_file.name}"
        if rel not in agent_paths and md_file.name not in (
            "README.md",
            "AGENTS_MAPPING.md",
            "AGENTS_MAPPING_BACKUP.md",
        ):
            warnings.append(f"Orphan agent file: {rel} (no registry entry)")

    # 1b. Orphan skills — collect all registered skill paths (core + project)
    registered_skill_paths = set()
    skills_data = registry.get("skills", {})
    for category in ("domains", "kit", "roles", "universal", "utils"):
        cat = skills_data.get(category, {})
        if isinstance(cat, dict):
            for info in cat.values():
                if isinstance(info, dict) and "path" in info:
                    registered_skill_paths.add(info["path"])
    # Include project.yaml skill paths
    if project and isinstance(project, dict):
        for info in (project.get("skills", {}) or {}).values():
            if isinstance(info, dict) and "path" in info:
                registered_skill_paths.add(info["path"])

    # Known non-registered SKILL.md files to exclude
    skill_exclusions = {
        "README.md",
    }
    # game-development sub-skills are registered via parent, not individually
    game_dev_sub_dirs = {
        "2d-games",
        "3d-games",
        "game-art",
        "game-audio",
        "game-design",
        "mobile-games",
        "multiplayer",
        "pc-games",
        "vr-ar",
        "web-games",
    }

    # Also collect project agent paths to avoid false orphan warnings
    if project and isinstance(project, dict):
        for info in (project.get("agents", {}) or {}).values():
            if isinstance(info, dict) and "path" in info:
                agent_paths.add(info["path"])

    for skill_file in (AGENT_DIR / "skills").rglob("SKILL.md"):
        rel = str(skill_file.relative_to(AGENT_DIR))
        # Skip game-development sub-skills
        parts = skill_file.relative_to(AGENT_DIR / "skills").parts
        if (
            len(parts) >= 2
            and parts[0] == "game-development"
            and parts[1] in game_dev_sub_dirs
        ):
            continue
        # Skip SKILL.md inside templates/ subdirectories
        if "templates" in parts:
            continue
        if rel not in registered_skill_paths:
            warnings.append(f"Orphan skill file: {rel} (no registry entry)")

    # 2. Keyword overlap detection
    agents_list = list(registry.get("agents", {}).items())
    for i in range(len(agents_list)):
        for j in range(i + 1, len(agents_list)):
            name_a, info_a = agents_list[i]
            name_b, info_b = agents_list[j]
            kw_a = set(k.lower() for k in info_a.get("keywords_any", []))
            kw_b = set(k.lower() for k in info_b.get("keywords_any", []))
            if kw_a and kw_b:
                overlap = kw_a & kw_b
                ratio = (
                    len(overlap) / min(len(kw_a), len(kw_b))
                    if min(len(kw_a), len(kw_b)) > 0
                    else 0
                )
                if ratio > 0.8:
                    warnings.append(
                        f"Keyword overlap >80%: '{name_a}' ↔ '{name_b}' ({len(overlap)} shared)"
                    )

    # 3. Unused entries (not in any combo or workflow)
    used_agents = set()
    used_skills = set()
    for wf in registry.get("workflow_defaults", {}).values():
        used_agents.update(wf.get("agents_always", []))
        for c in wf.get("agents_conditional", []):
            used_agents.add(c.get("agent", ""))
        used_skills.update(wf.get("skills_always", []))
    for combo in combos.values():
        if isinstance(combo, dict):
            used_agents.update(combo.get("agents", []))
            used_skills.update(combo.get("skills", []))

    # Report
    print("")
    print("=" * 50)
    print("  Registry Validation Report")
    print("=" * 50)

    # Taxonomy counts
    agent_count = len(registry.get("agents", {}))
    domain_count = len(registry.get("skills", {}).get("domains", {}))
    kit_count = len(registry.get("skills", {}).get("kit", {}))
    role_count = len(registry.get("skills", {}).get("roles", {}))
    universal_count = len(registry.get("skills", {}).get("universal", {}))
    utils_count = len(registry.get("skills", {}).get("utils", {}))
    print(
        f"\n📊 Taxonomy (core): {agent_count} agents, {domain_count} domains, {kit_count} kit, {role_count} roles, {universal_count} universal, {utils_count} utils"
    )

    # Project-specific counts
    if project and isinstance(project, dict):
        proj_agents = len(project.get("agents", {}) or {})
        proj_skills = len(project.get("skills", {}) or {})
        proj_combos = len(project.get("issue_combos", {}) or {})
        if proj_agents or proj_skills or proj_combos:
            parts = []
            if proj_agents:
                parts.append(f"{proj_agents} project agents")
            if proj_skills:
                parts.append(f"{proj_skills} project skills")
            if proj_combos:
                parts.append(f"{proj_combos} project combos")
            print(f"📦 Project: + {', '.join(parts)}")
            print(
                f"📊 Total: {agent_count + proj_agents} agents, "
                f"{domain_count + kit_count + role_count + universal_count + utils_count + proj_skills} skills"
            )

    # Validate TAXONOMY_COUNTS vs actual
    actual = {
        "agents": agent_count,
        "domain_skills": domain_count,
        "kit_skills": kit_count,
        "role_skills": role_count,
        "universal_skills": universal_count,
        "utils_skills": utils_count,
    }
    for key, declared in TAXONOMY_COUNTS.items():
        real = actual.get(key, 0)
        if declared != real:
            warnings.append(
                f"TAXONOMY_COUNTS['{key}'] declares {declared} but actual is {real}"
            )

    if errors:
        print(f"\n❌ Errors ({len(errors)}):")
        for e in errors:
            print(f"  ❌ {e}")
    else:
        print("\n✅ No errors found")

    if warnings:
        print(f"\n⚠️  Warnings ({len(warnings)}):")
        for w in warnings:
            print(f"  ⚠️  {w}")
    else:
        print("\n✅ No warnings found")

    print("")

    if errors and getattr(args, "strict", False):
        print("🛑 --strict mode: blocking due to errors")
        sys.exit(1)

    return len(errors) == 0


# ---------------------------------------------------------------------------
# Subcommand: resolve-fallback
# ---------------------------------------------------------------------------
def cmd_resolve_fallback(args):
    """Resolve fallback agents/skills for an issue.

    Uses a simplified version of the 8-step resolution algorithm:
      1. Combo detection (match issue_combos keywords against issue content)
      2. Select primary combo (highest match count)
      3. Allow one complement (different dimension)
      4. Apply agent_relationships (narrows, excludes)
      5. Dedupe + apply caps (max 3 agents, max 5 skills)
      6. Contextual fallback (if combos found nothing)
      7. Generic fallback (last resort)
    """
    registry = load_registry()
    project = load_project()
    merged = _merge_project(registry, project)

    # Read issue content
    issue_path = Path(args.issue)
    if not issue_path.exists():
        print("SKILLS=")
        print("AGENTS=")
        return

    content = issue_path.read_text().lower()

    found_agents = []
    found_skills = []

    # --- Step 1: Combo detection ---
    combos = merged.get("issue_combos", {})
    scored_combos = []
    for combo_name, combo in combos.items():
        if combo_name == "resolution_algorithm" or not isinstance(combo, dict):
            continue
        match_any = combo.get("match", {}).get("any", [])
        match_all = combo.get("match", {}).get("all", [])
        # Count keyword matches
        any_hits = sum(1 for kw in match_any if kw.lower() in content)
        if any_hits == 0:
            continue
        # If match.all is specified, ALL must be present
        if match_all and not all(kw.lower() in content for kw in match_all):
            continue
        scored_combos.append((any_hits, combo_name, combo))

    if scored_combos:
        # --- Step 2: Select primary combo (highest match count) ---
        scored_combos.sort(key=lambda x: x[0], reverse=True)
        primary_score, primary_name, primary = scored_combos[0]
        primary_dim = primary.get("dimension", "")
        found_agents.extend(primary.get("agents", []))
        found_skills.extend(primary.get("skills", []))

        # --- Step 3: Allow one complement (different dimension) ---
        for score, name, combo in scored_combos[1:]:
            if combo.get("dimension", "") != primary_dim:
                found_agents.extend(combo.get("agents", []))
                found_skills.extend(combo.get("skills", []))
                break  # Only one complement allowed

    # --- Step 4: Apply agent_relationships ---
    rels = merged.get("routing_policy", {}).get("agent_relationships", {})
    agents_to_remove = set()
    for agent_name, rel_info in rels.items():
        # narrows: if the narrower is present, remove the broader
        narrows_target = rel_info.get("narrows")
        if (
            narrows_target
            and agent_name in found_agents
            and narrows_target in found_agents
        ):
            agents_to_remove.add(narrows_target)
        # excludes: if the excluder is present, remove the excluded
        excludes_target = rel_info.get("excludes")
        if (
            excludes_target
            and agent_name in found_agents
            and excludes_target in found_agents
        ):
            agents_to_remove.add(excludes_target)
    found_agents = [a for a in found_agents if a not in agents_to_remove]

    # --- Step 5: Dedupe + caps ---
    seen_a = set()
    agents = [a for a in found_agents if not (a in seen_a or seen_a.add(a))]
    seen_s = set()
    skills = [s for s in found_skills if not (s in seen_s or seen_s.add(s))]

    caps = merged.get("routing_policy", {}).get("caps", {})
    max_agents = caps.get("max_agents_per_issue", 3)
    max_skills = caps.get("max_skills_per_issue", 5)
    agents = agents[:max_agents]
    skills = skills[:max_skills]

    # --- Step 6: Contextual fallback (if combos found nothing) ---
    if not agents and not skills:
        fb = merged.get("fallback_policy", {})
        for detector in fb.get("contextual", []):
            keywords = detector.get("detect", {}).get("keywords_any", [])
            if any(kw.lower() in content for kw in keywords):
                agents.extend(detector.get("agents", []))
                skills.extend(detector.get("skills", []))
        # Dedupe again
        seen_a = set()
        agents = [a for a in agents if not (a in seen_a or seen_a.add(a))]
        seen_s = set()
        skills = [s for s in skills if not (s in seen_s or seen_s.add(s))]

    # --- Step 7: Generic fallback (last resort) ---
    if not agents and not skills:
        fb = merged.get("fallback_policy", {})
        generic = fb.get("generic", {})
        agents = generic.get("agents", [])
        skills = generic.get("skills", [])

    # Output KEY=value format (consumed by while/read in bash)
    print(f"SKILLS={','.join(skills)}")
    print(f"AGENTS={','.join(agents)}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description="Agent Registry CLI — manage agents and skills registry",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # add-agent
    p_add_agent = subparsers.add_parser(
        "add-agent", help="Add a new agent to the registry"
    )
    p_add_agent.add_argument("--name", required=True, help="Agent name (kebab-case)")
    p_add_agent.add_argument(
        "--scope", choices=VALID_SCOPES, default="kit", help="kit or project"
    )
    p_add_agent.add_argument(
        "--keywords", required=True, help="Comma-separated EN keywords"
    )
    p_add_agent.add_argument("--keywords-es", help="Comma-separated ES keywords")
    p_add_agent.add_argument("--negative", help="Comma-separated negative keywords")
    p_add_agent.add_argument("--domain", help="Comma-separated domains")
    p_add_agent.add_argument(
        "--priority", type=int, help="Priority 0-100 (default: 70)"
    )
    p_add_agent.add_argument(
        "--activation-mode", choices=VALID_ACTIVATION_MODES, default="auto"
    )
    p_add_agent.add_argument("--description", help="Agent description")
    p_add_agent.add_argument("--complements", help="Agent this complements")
    p_add_agent.set_defaults(func=cmd_add_agent)

    # add-skill
    p_add_skill = subparsers.add_parser(
        "add-skill", help="Add a new skill to the registry"
    )
    p_add_skill.add_argument("--name", required=True, help="Skill name (kebab-case)")
    p_add_skill.add_argument(
        "--category",
        choices=VALID_SKILL_CATEGORIES,
        default="kit",
        help="Skill category",
    )
    p_add_skill.add_argument(
        "--scope", choices=VALID_SCOPES, default="kit", help="kit or project"
    )
    p_add_skill.add_argument(
        "--keywords", required=True, help="Comma-separated EN keywords"
    )
    p_add_skill.add_argument("--keywords-es", help="Comma-separated ES keywords")
    p_add_skill.add_argument("--description", help="Skill description")
    p_add_skill.set_defaults(func=cmd_add_skill)

    # register
    p_register = subparsers.add_parser(
        "register", help="Register an existing file into the registry"
    )
    p_register.add_argument("--path", required=True, help="Path to existing .md file")
    p_register.add_argument("--scope", choices=VALID_SCOPES, help="Scope override")
    p_register.add_argument("--keywords", help="Comma-separated EN keywords")
    p_register.add_argument("--keywords-es", help="Comma-separated ES keywords")
    p_register.set_defaults(func=cmd_register)

    # rebuild
    p_rebuild = subparsers.add_parser("rebuild", help="Regenerate all view files")
    p_rebuild.set_defaults(func=cmd_rebuild)

    # validate
    p_validate = subparsers.add_parser("validate", help="Validate registry integrity")
    p_validate.add_argument(
        "--strict", action="store_true", help="Exit with error code if errors found"
    )
    p_validate.set_defaults(func=cmd_validate)

    # resolve-fallback
    p_resolve = subparsers.add_parser(
        "resolve-fallback", help="Resolve fallback agents/skills for an issue"
    )
    p_resolve.add_argument("--issue", required=True, help="Path to issue .md file")
    p_resolve.set_defaults(func=cmd_resolve_fallback)

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(1)

    # Ensure we're in project root (where .agent/ exists)
    if not AGENT_DIR.exists():
        print(f"Must run from project root (where .agent/ exists)")
        sys.exit(1)

    args.func(args)


if __name__ == "__main__":
    main()
