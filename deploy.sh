#!/usr/bin/env bash
# Build for GitHub Pages (served at /ondine/) and publish dist/ to the gh-pages branch.
set -euo pipefail
cd "$(dirname "$0")"
rm -rf dist
BASE_PATH=/ondine/ npx vite build
touch dist/.nojekyll
cd dist
git init -q -b gh-pages
git add -A
git -c user.name=Asad -c user.email=asadblum@gmail.com commit -qm "Deploy $(date -u +%Y-%m-%dT%H:%MZ)"
git -c http.postBuffer=524288000 push -f https://github.com/asadbl/ondine.git gh-pages
rm -rf .git
echo "live at https://asadbl.github.io/ondine/ in a minute or two"
