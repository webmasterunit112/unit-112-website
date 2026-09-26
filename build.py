#!/usr/bin/env python3
"""Assemble src/ into one self-contained page.

  python3 build.py        -> public/index.html  (the real website file)
                           -> preview/preview.html (same page, body-only, for a hosted preview)
"""
from pathlib import Path

ROOT = Path(__file__).parent
src = ROOT / "src"
css = (src / "styles.css").read_text()
data = (src / "default-data.js").read_text()
app = (src / "app.js").read_text().replace("  /*@ADMIN@*/", (src / "admin.js").read_text())

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Literata:opsz,wght@7..72,600;7..72,700;7..72,800&display=swap">')

BODY = """<a class="skip" href="#main" data-act="skip">Skip to main content</a>
<div id="adminbar"></div>
<div id="alert"></div>
<header>
  <div class="topbar" id="topbar"></div>
  <div class="masthead" id="masthead"></div>
  <nav class="main" id="nav" aria-label="Main menu"></nav>
</header>
<main id="main" tabindex="-1"><div class="wrap" id="view"><p>Loading…</p></div></main>
<footer class="site" id="footer"></footer>
<div id="lb"></div>
<noscript><p style="padding:16px;font-size:20px">This site needs JavaScript turned on. Unit 112 results are also at <a href="https://live.acbl.org">live.acbl.org</a>.</p></noscript>
"""
SCRIPTS = f"<script>\n{data}\n</script>\n<script>\n{app}\n</script>\n"

full = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>ACBL Unit 112</title>
<meta name="description" content="ACBL Unit 112: duplicate bridge tournaments, results and clubs across Central and Western New York.">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#1C4966">
<link rel="canonical" href="/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ACBL Unit 112">
<meta property="og:title" content="ACBL Unit 112">
<meta property="og:description" content="Duplicate bridge tournaments, results and clubs across Central and Western New York.">
<meta property="og:url" content="/">
<meta property="og:image" content="/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
{FONTS}
<style>
{css}
</style>
</head>
<body>
{BODY}{SCRIPTS}</body>
</html>
"""
(ROOT / "public").mkdir(exist_ok=True)
(ROOT / "public" / "index.html").write_text(full)

preview = f"""<title>ACBL Unit 112</title>
{FONTS}
<style>
{css}
</style>
{BODY}{SCRIPTS}"""
(ROOT / "preview").mkdir(exist_ok=True)
(ROOT / "preview" / "preview.html").write_text(preview)
print("built", len(full), "bytes")
