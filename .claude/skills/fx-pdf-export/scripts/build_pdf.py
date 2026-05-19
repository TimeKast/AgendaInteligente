#!/usr/bin/env python3
"""
TimeKast PDF Builder — Generates styled PDFs from Markdown documents.

Auto-reads metadata from the document header and project config.
Supports logos, TOC, cover page, and appendices — all optional.

Usage:
  python3 build_pdf.py INPUT.md [options]

Options:
  --output PATH       Output PDF path (default: INPUT.pdf)
  --no-logos           Omit logos from cover page
  --no-toc             Omit table of contents
  --no-cover           Skip cover page entirely
  --appendix "T:F"     Add appendix (Title:filepath), repeatable
  --skip-lines N       Header lines to skip from main doc (default: 9)
  --css PATH           Custom CSS file

Part of: .claude/skills/fx-pdf-export/
"""

import argparse
import base64
import glob
import json
import os
import re
import subprocess
import sys


def find_project_root():
    """Walk up to find .claude/ directory (kit SSOT)."""
    path = os.getcwd()
    for _ in range(10):
        if os.path.isdir(os.path.join(path, ".claude")):
            return path
        path = os.path.dirname(path)
    return os.getcwd()


def resolve_path(path, root):
    """Resolve relative path against project root."""
    if os.path.isabs(path):
        return path
    return os.path.join(root, path)


def extract_metadata(filepath):
    """Extract title, date, version, stakeholders, author from MD header."""
    meta = {
        "title": os.path.splitext(os.path.basename(filepath))[0],
        "subtitle": "",
        "date": "",
        "version": "",
        "stakeholders": "",
        "author": "TimeKast",
    }

    with open(filepath, "r") as f:
        lines = f.readlines()[:20]

    for line in lines:
        line = line.strip()
        # Title from H1: "# Discovery Brief — Kuen"
        if line.startswith("# "):
            meta["title"] = line[2:].strip()
        # Bold metadata: "**Fecha:** 2026-02-17"
        m = re.match(r"\*\*(.+?):\*\*\s*(.+)", line)
        if m:
            key = m.group(1).lower().strip()
            val = m.group(2).strip()
            if "fecha" in key or "date" in key:
                meta["date"] = val
            elif "versi" in key or "version" in key:
                meta["version"] = val
            elif "stakeholder" in key or "cliente" in key:
                meta["stakeholders"] = val
            elif "elaborado" in key or "author" in key or "autor" in key:
                meta["author"] = val

    return meta


def find_logos(root):
    """Auto-detect logos in project root."""
    timekast_logo = None
    client_logo = None

    # Check project-config.md first
    config_path = os.path.join(root, "docs", "planning", "project-config.md")
    if os.path.exists(config_path):
        with open(config_path, "r") as f:
            content = f.read()
        # Look for logo paths in config
        for line in content.split("\n"):
            if "timekast_logo" in line.lower() or "company_logo" in line.lower():
                m = re.search(r'[`"]?([^\s`"]+\.(png|jpg|svg|webp))[`"]?', line)
                if m:
                    timekast_logo = resolve_path(m.group(1), root)
            if "client_logo" in line.lower() or "project_logo" in line.lower():
                m = re.search(r'[`"]?([^\s`"]+\.(png|jpg|svg|webp))[`"]?', line)
                if m:
                    client_logo = resolve_path(m.group(1), root)

    # Fallback: search root directory
    if not timekast_logo:
        candidates = glob.glob(os.path.join(root, "*timekast*"))
        candidates += glob.glob(os.path.join(root, "unnamed.png"))
        for c in candidates:
            if c.lower().endswith((".png", ".jpg", ".svg", ".webp")):
                timekast_logo = c
                break

    if not client_logo:
        # Look for project logo (not timekast, not unnamed)
        for ext in ["*.webp", "*.png", "*.svg", "*.jpg"]:
            for c in glob.glob(os.path.join(root, ext)):
                basename = os.path.basename(c).lower()
                if "timekast" not in basename and "unnamed" not in basename:
                    client_logo = c
                    break
            if client_logo:
                break

    return timekast_logo, client_logo


def image_to_base64(path):
    """Convert image to base64 data URI, converting webp to png if needed."""
    ext = os.path.splitext(path)[1].lower()

    if ext == ".webp":
        png_path = "/tmp/pdf_export_logo_converted.png"
        subprocess.run(
            ["sips", "-s", "format", "png", path, "--out", png_path],
            capture_output=True,
        )
        path = png_path
        ext = ".png"

    mime_map = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".svg": "image/svg+xml",
    }
    mime = mime_map.get(ext, "image/png")

    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()

    return f"data:{mime};base64,{b64}"


def build_cover(meta, logo_left_uri=None, logo_right_uri=None):
    """Generate HTML cover page."""
    # Build logos section
    if logo_left_uri and logo_right_uri:
        logos_html = f"""<div class="cover-logos">
    <img src="{logo_left_uri}" alt="Company" />
    <div class="cover-divider-dot"></div>
    <img src="{logo_right_uri}" alt="Project" />
  </div>"""
    elif logo_left_uri:
        logos_html = f"""<div class="cover-logos">
    <img src="{logo_left_uri}" alt="Logo" />
  </div>"""
    elif logo_right_uri:
        logos_html = f"""<div class="cover-logos">
    <img src="{logo_right_uri}" alt="Logo" />
  </div>"""
    else:
        logos_html = ""

    # Build meta lines
    meta_lines = []
    if meta.get("date"):
        meta_lines.append(f'<strong>Fecha:</strong> {meta["date"]}')
    if meta.get("version"):
        meta_lines.append(f'<strong>Versión:</strong> {meta["version"]}')
    if meta.get("stakeholders"):
        meta_lines.append(f'<strong>Stakeholders:</strong> {meta["stakeholders"]}')
    if meta.get("author"):
        meta_lines.append(f'<strong>Elaborado por:</strong> {meta["author"]}')
    meta_html = "<br/>\n    ".join(meta_lines)

    # Domain
    domain = meta.get("domain", "")
    footer = f"{domain} · TimeKast Factory" if domain else "TimeKast Factory"

    return f"""<div class="cover-page">
  {logos_html}
  <h1 class="cover-title" style="border:none; margin:0; padding:0;">{meta["title"]}</h1>
  <p class="cover-subtitle">{meta.get("subtitle", "")}</p>
  <div class="cover-line"></div>
  <div class="cover-meta">
    {meta_html}
  </div>
  <div class="cover-badge">Confidencial</div>
  <p class="cover-footer">{footer}</p>
</div>

"""


def build_toc(content):
    """Auto-generate TOC from H2 headers in the markdown."""
    rows = ""
    count = 0
    for line in content.split("\n"):
        if line.startswith("## "):
            title = line[3:].strip()
            # Clean emoji prefixes
            title = re.sub(r"^[📊📋📖📍🔄🧩🎨📱🗂️]+\s*", "", title)
            count += 1
            rows += f"| {count} | {title} |\n"

    if not rows:
        return ""

    return f"""<div class="toc-page">
<h2 style="text-align:center; color:#5B2D8E; border-bottom:none; margin-bottom:30px; font-size:22px;">Índice</h2>

| # | Sección |
|---|---------|
{rows}
</div>

"""


def build_appendix(title, filepath, root, skip=1):
    """Generate appendix separator + content."""
    full_path = resolve_path(filepath, root)
    with open(full_path, "r") as f:
        lines = f.readlines()
    content = "".join(lines[skip:])

    return f"""
<div class="appendix-break">
<h1 style="border-bottom:3px solid #4DB6AC; display:inline-block; padding-bottom:8px;">{title}</h1>
</div>

{content}"""


def main():
    parser = argparse.ArgumentParser(description="TimeKast PDF Builder")
    parser.add_argument("input", help="Input markdown file")
    parser.add_argument("--output", help="Output PDF path")
    parser.add_argument("--no-logos", action="store_true", help="Omit logos")
    parser.add_argument("--no-toc", action="store_true", help="Omit TOC")
    parser.add_argument("--no-cover", action="store_true", help="Skip cover page")
    parser.add_argument(
        "--appendix", action="append", help="Title:filepath (repeatable)"
    )
    parser.add_argument(
        "--skip-lines", type=int, default=9, help="Header lines to skip"
    )
    parser.add_argument("--css", help="Custom CSS path")

    args = parser.parse_args()
    root = find_project_root()

    # Resolve paths
    input_path = resolve_path(args.input, root)
    output_path = args.output or input_path.rsplit(".", 1)[0] + ".pdf"
    output_path = resolve_path(output_path, root)

    skill_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    default_css = os.path.join(skill_dir, "resources", "timekast-style.css")
    css_path = resolve_path(args.css, root) if args.css else default_css

    print(f"📄 Building PDF: {input_path}")

    # Extract metadata from document
    meta = extract_metadata(input_path)
    print(f"  📝 Title: {meta['title']}")

    # Read main document
    with open(input_path, "r") as f:
        all_lines = f.readlines()
    main_content = "".join(all_lines[args.skip_lines :])
    print(f"  📝 Content: {len(all_lines)} lines (skipping first {args.skip_lines})")

    # Build combined markdown
    combined = ""

    # Cover page
    if not args.no_cover:
        logo_left_uri = None
        logo_right_uri = None

        if not args.no_logos:
            tk_logo, client_logo = find_logos(root)
            if tk_logo:
                print(f"  📷 TimeKast logo: {os.path.basename(tk_logo)}")
                logo_left_uri = image_to_base64(tk_logo)
            if client_logo:
                print(f"  📷 Client logo: {os.path.basename(client_logo)}")
                logo_right_uri = image_to_base64(client_logo)

            if not tk_logo and not client_logo:
                print(f"  ⚠️  No logos found (use --no-logos to suppress)")

        combined += build_cover(meta, logo_left_uri, logo_right_uri)

    # TOC
    if not args.no_toc and not args.no_cover:
        toc = build_toc(main_content)
        if toc:
            combined += toc
            print(f"  📑 TOC generated")

    # Main content
    combined += main_content

    # Appendices
    if args.appendix:
        for app_str in args.appendix:
            if ":" in app_str:
                title, filepath = app_str.split(":", 1)
                combined += build_appendix(title.strip(), filepath.strip(), root)
                print(f"  📎 Appendix: {title.strip()}")
            else:
                print(f"  ⚠️  Invalid appendix format (use 'Title:filepath'): {app_str}")

    # Write temp file
    tmp_md = "/tmp/pdf_build_combined.md"
    with open(tmp_md, "w") as f:
        f.write(combined)
    print(f"  📦 Combined: {len(combined):,} chars")

    # Generate PDF
    print(f"  🖨️  Generating PDF...")
    result = subprocess.run(
        [
            "npx",
            "-y",
            "md-to-pdf",
            "--stylesheet",
            css_path,
            "--pdf-options",
            json.dumps(
                {
                    "format": "A4",
                    "margin": {
                        "top": "20mm",
                        "bottom": "20mm",
                        "left": "20mm",
                        "right": "20mm",
                    },
                    "printBackground": True,
                }
            ),
            "--document-title",
            meta["title"],
            tmp_md,
        ],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        print(f"  ❌ Error: {result.stderr}")
        sys.exit(1)

    # Copy to final location
    tmp_pdf = tmp_md.rsplit(".", 1)[0] + ".pdf"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    subprocess.run(["cp", tmp_pdf, output_path])

    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"  ✅ PDF saved: {output_path} ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
