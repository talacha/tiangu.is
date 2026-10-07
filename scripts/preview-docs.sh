#!/bin/sh
# Vercel preview build until TG-001 adds the Vite app: publish the planning docs.
set -eu
rm -rf dist
mkdir -p dist
cp README.md north-star.md roadmap.md tasks.md dist/
cp -r docs dist/
cat > dist/index.html <<'HTML'
<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tianguis</title>
<h1>Tianguis</h1>
<p>Planning docs only; the app lands with TG-001.</p>
<ul>
  <li><a href="README.md">README</a></li>
  <li><a href="north-star.md">North star</a></li>
  <li><a href="roadmap.md">Roadmap</a></li>
  <li><a href="tasks.md">Tasks</a></li>
  <li><a href="docs/ARCHITECTURE.md">Architecture</a></li>
</ul>
HTML
