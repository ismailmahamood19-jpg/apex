#!/bin/bash
# Run from project root: bash scripts/fetch-assets.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p assets/{brand,home,hygenix,clients,docs}

PAGES=(
  "https://apexglobalint.com/"
  "https://apexglobalint.com/about/"
  "https://apexglobalint.com/apex_signage/"
  "https://apexglobalint.com/apex_hygenix/"
  "https://apexglobalint.com/contact/"
)

URLS=$(mktemp)
for page in "${PAGES[@]}"; do
  curl -sL "$page" | grep -oE 'https?://apexglobalint\.com/wp-content/uploads/[^"'\''<> )]+' >> "$URLS" || true
  curl -sL "$page" | grep -oE '/wp-content/uploads/[^"'\''<> )]+' | sed 's|^|https://apexglobalint.com|' >> "$URLS" || true
done

sort -u "$URLS" -o "$URLS"

while IFS= read -r url; do
  [[ -z "$url" ]] && continue
  fname=$(basename "${url%%\?*}")
  fname=$(python3 -c "import urllib.parse; print(urllib.parse.unquote('$fname').replace(' ', '-'))")
  lower=$(echo "$fname" | tr '[:upper:]' '[:lower:]')
  if [[ "$lower" == *screenshot* ]] || [[ "$lower" == *hadi* ]]; then
    dir="clients"
  elif [[ "$lower" == *logo* ]] || [[ "$lower" == *cropped* ]]; then
    dir="brand"
  elif [[ "$lower" == *signage* ]] || [[ "$lower" == *sign-* ]]; then
    dir="home"
  elif [[ "$lower" == *hygen* ]] || [[ "$lower" == *hygien* ]]; then
    dir="hygenix"
  elif [[ "$lower" == *founder* ]] || [[ "$lower" == *hari* ]] || [[ "$lower" == *chairman* ]]; then
    dir="home"
  else
    dir="home"
  fi
  dest="assets/$dir/$fname"
  if [[ ! -f "$dest" ]]; then
    echo "Downloading $url -> $dest"
    curl -sL "$url" -o "$dest" || echo "  failed: $url"
  fi
done < "$URLS"

curl -sL "https://apexglobalint.com/wp-content/uploads/2026/01/apex_global_signage.pdf" -o assets/docs/apex_global_signage.pdf || true
rm -f "$URLS"
echo "Done. See assets/ folders."
