# -*- coding: utf-8 -*-
"""
One-off: convert the entire site from slug.html to slug/index.html (clean,
extensionless URLs), rewriting every internal href/src and every absolute
canonical/OG/Twitter/JSON-LD URL to match. Site-wide, EN + ES, run once.

Algorithm:
  1. Build a rename map (old site-root-relative path -> new path) by walking
     the CURRENT tree for every *.html file that isn't already index.html or
     404.html.
  2. For every *.html file in the tree, read its CURRENT content, rewrite:
       - relative href/src attributes (resolved against the file's OLD
         location, looked up in the rename map, re-expressed as a path
         relative to the file's NEW location)
       - absolute https://breachfolio.com/... URLs (canonical, og:url,
         twitter, JSON-LD @id/url/item), same rename-map lookup
     then write the rewritten content to the file's NEW location.
  3. Delete now-orphaned old files.
  4. Also rewrite data/*.json (dynamic news feed paths) the same way.

Run: python tools/clean-urls-migrate.py
"""
import os, re, json, posixpath

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

SKIP_DIRS = {"_pagefind", "node_modules", ".git", "tools"}

def walk_html():
    for dirpath, dirnames, filenames in os.walk("."):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith(".")]
        for fn in filenames:
            if fn.endswith(".html"):
                rel = posixpath.normpath(posixpath.join(dirpath, fn).replace("\\", "/")).lstrip("./")
                yield rel

all_html = list(walk_html())
print(f"Found {len(all_html)} html files total")

# ---- 1. build rename map --------------------------------------------------
rename_map = {}
for rel in all_html:
    base = posixpath.basename(rel)
    if base in ("index.html", "404.html"):
        continue
    d = posixpath.dirname(rel)
    slug = base[:-5]  # strip .html
    new_rel = posixpath.join(d, slug, "index.html") if d else posixpath.join(slug, "index.html")
    rename_map[rel] = new_rel

print(f"{len(rename_map)} files will move")

def clean_form(abs_path):
    """abs_path is a site-root-relative path (post-rename). Return the
    'clean' representation: directories with trailing slash, no index.html."""
    if abs_path in ("", "index.html"):
        return ""
    if abs_path.endswith("/index.html"):
        return abs_path[: -len("index.html")]
    return abs_path

def resolve_target(old_file_dir, href):
    """href is the ORIGINAL relative href as written in the file (pre-move).
    Returns the clean-form site-root-relative target (post-rename)."""
    combined = posixpath.normpath(posixpath.join(old_file_dir, href)) if old_file_dir else posixpath.normpath(href)
    combined = combined.replace("\\", "/")
    if combined.startswith("../"):
        # would escape site root - leave untouched, caller keeps original href
        return None
    new_abs = rename_map.get(combined, combined)
    return clean_form(new_abs)

def rel_from(new_file_dir, clean_target):
    """clean_target is '' (root), 'dir/' (directory) or 'path/to/file.ext' (asset).
    new_file_dir is the file's NEW directory (post-move)."""
    is_dir = clean_target == "" or clean_target.endswith("/")
    base_dir = new_file_dir if new_file_dir else "."
    if is_dir:
        target_dir = clean_target.rstrip("/") or "."
        rel = posixpath.relpath(target_dir, base_dir)
        return (rel + "/") if rel != "." else "./"
    else:
        return posixpath.relpath(clean_target, base_dir)

HREF_RE = re.compile(r'((?:href|src)=")([^"]+)(")')
ABS_RE = re.compile(r'https://breachfolio\.tech/([^"\'\s)]*)')

def rewrite_content(rel, content):
    old_dir = posixpath.dirname(rel)
    new_rel = rename_map.get(rel, rel)
    new_dir = posixpath.dirname(new_rel)

    def href_sub(m):
        prefix, href, suffix = m.groups()
        if href.startswith(("http://", "https://", "#", "mailto:", "tel:", "data:", "/")):
            return m.group(0)
        target = resolve_target(old_dir, href)
        if target is None:
            return m.group(0)
        new_href = rel_from(new_dir, target)
        return prefix + new_href + suffix

    content = HREF_RE.sub(href_sub, content)

    def abs_sub(m):
        path = m.group(1)  # everything after https://breachfolio.com/
        if not path:
            return m.group(0)  # bare domain root, leave as-is
        new_abs = rename_map.get(path, path)
        clean = clean_form(new_abs)
        return "https://breachfolio.com/" + clean

    content = ABS_RE.sub(abs_sub, content)
    return new_rel, content

# ---- 2+3. rewrite and move -------------------------------------------------
written = 0
for rel in all_html:
    with open(rel, encoding="utf-8") as f:
        content = f.read()
    new_rel, new_content = rewrite_content(rel, content)
    if new_rel != rel:
        os.makedirs(posixpath.dirname(new_rel), exist_ok=True)
    with open(new_rel + ".NEW", "w", encoding="utf-8") as f:
        f.write(new_content)
    written += 1
print(f"Wrote {written} .NEW staged files")

# swap staged files into place, remove old originals that moved
for rel in all_html:
    new_rel = rename_map.get(rel, rel)
    staged = new_rel + ".NEW"
    if new_rel != rel:
        os.replace(staged, new_rel)
        os.remove(rel)
    else:
        os.replace(staged, new_rel)

# remove now-empty old directories left behind (e.g. old slug dirs w/ nothing else)
for dirpath, dirnames, filenames in os.walk(".", topdown=False):
    if any(sd in dirpath for sd in SKIP_DIRS) or "/." in dirpath.replace("\\", "/"):
        continue
    try:
        if not dirnames and not filenames and dirpath != ".":
            os.rmdir(dirpath)
    except OSError:
        pass

print("Move + rewrite complete.")

# ---- 4. data/*.json --------------------------------------------------------
for jf in ["data/latest.json", "data/news.json", "data/meta.json"]:
    if not os.path.exists(jf):
        continue
    with open(jf, encoding="utf-8") as f:
        raw = f.read()
    def json_path_sub(m):
        p = m.group(1)  # e.g. "/ai/prompt-injection-explained.html"
        site_path = p.lstrip("/")
        new_abs = rename_map.get(site_path, site_path)
        clean = clean_form(new_abs)
        return '"/' + clean.rstrip("/") + ('/' if clean and clean.endswith('/') else '') + '"' if clean else '"/"'
    new_raw = re.sub(r'"(/[a-zA-Z0-9_./-]+\.html)"', json_path_sub, raw)
    if new_raw != raw:
        with open(jf, "w", encoding="utf-8") as f:
            f.write(new_raw)
        print(f"Rewrote paths in {jf}")

print("Done.")
