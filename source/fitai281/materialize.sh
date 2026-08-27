#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
dest="${1:-$repo_root/build/fitai281}"
base_sha="1dee386bbc3e1a5204fd81e2f592b926ff81c555b2fcbf135bd3cd6c68953555"
target_sha="8b1c356bfabf478ca8f0c96707964166e2dc60c447083b72192572e9da5d6cfa"
chunks="$repo_root/source/fitai28/chunks"
overlay="$repo_root/source/fitai281/overlay"
sha256_file(){ python3 - "$1" <<'PY'
import hashlib,pathlib,sys
print(hashlib.sha256(pathlib.Path(sys.argv[1]).read_bytes()).hexdigest())
PY
}
rm -rf "$dest" && mkdir -p "$dest/extracted"
parts=(
  "$chunks/fitai28.zip.b64.00" "$chunks/fitai28.zip.b64.01" "$chunks/fitai28.zip.b64.02" "$chunks/fitai28.zip.b64.03"
  "$chunks/fitai28.zip.b64.04" "$chunks/fitai28.zip.b64.05" "$chunks/fitai28.zip.b64.06" "$chunks/fitai28.zip.b64.07"
  "$chunks/fitai28.zip.b64.08" "$chunks/fitai28.zip.b64.09" "$chunks/fitai28.zip.b64.10" "$chunks/fitai28.zip.b64.11"
  "$chunks/fitai28.zip.b64.12" "$chunks/fitai28.zip.b64.13a" "$chunks/fitai28.zip.b64.13b"
)
for part in "${parts[@]}"; do test -s "$part" || { echo "Missing chunk: $part" >&2; exit 70; }; done
base_zip="$dest/FitAI-Pro-2.8-ProductionCandidate-Android-Source.zip"
python3 - "$base_zip" "${parts[@]}" <<'PY'
import base64,pathlib,sys
out=pathlib.Path(sys.argv[1]); encoded=b''.join(pathlib.Path(p).read_bytes() for p in sys.argv[2:])
out.write_bytes(base64.b64decode(encoded,validate=True))
PY
actual_base="$(sha256_file "$base_zip")"
echo "base_source_sha256=$actual_base"
[[ "$actual_base" = "$base_sha" ]] || { echo "Base SHA mismatch expected=$base_sha actual=$actual_base" >&2; exit 71; }
unzip -tq "$base_zip" >/dev/null
unzip -q "$base_zip" -d "$dest/extracted"
settings="$(find "$dest/extracted" -type f \( -name settings.gradle -o -name settings.gradle.kts \) -print -quit)"
test -n "$settings" || { echo "Android settings file not found" >&2; exit 72; }
project_dir="$(dirname "$settings")"
cp -a "$overlay"/. "$project_dir"/
target_zip="$dest/FitAI-Pro-2.8.1-QA-Hardened-Android-Source.zip"
python3 - "$project_dir" "$target_zip" <<'PY'
from pathlib import Path
import sys,zipfile
root=Path(sys.argv[1]); out=Path(sys.argv[2])
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for p in sorted(root.rglob('*')):
        if not p.is_file(): continue
        rel=Path('FitAI-Pro-2.8.1-QA-Hardened')/p.relative_to(root)
        i=zipfile.ZipInfo(str(rel).replace('\\','/'),date_time=(2026,8,27,0,0,0))
        i.compress_type=zipfile.ZIP_DEFLATED; i.external_attr=(0o100644 & 0xFFFF)<<16
        z.writestr(i,p.read_bytes())
PY
actual_target="$(sha256_file "$target_zip")"
echo "hardened_source_sha256=$actual_target"
[[ "$actual_target" = "$target_sha" ]] || { echo "Hardened SHA mismatch expected=$target_sha actual=$actual_target" >&2; exit 73; }
unzip -tq "$target_zip" >/dev/null
printf 'base_sha256=%s\nhardened_sha256=%s\nproject_dir=%s\n' "$base_sha" "$target_sha" "$project_dir" > "$dest/provenance.txt"
if [[ -n "${GITHUB_ENV:-}" ]]; then
  echo "FITAI_SOURCE_ROOT=$project_dir" >> "$GITHUB_ENV"
  echo "FITAI_SOURCE_ZIP=$target_zip" >> "$GITHUB_ENV"
  echo "FITAI_SOURCE_SHA256=$target_sha" >> "$GITHUB_ENV"
fi
printf '%s\n' "$project_dir"
