"""Verify that an already prepared release is unchanged by two rebuilds."""

import hashlib
import subprocess
import sys

from validate_delivery import ROOT, RELEASE_FILES, CHECKSUM_FILE, MANIFEST_FILE


def snapshot():
    paths = [ROOT / item for item in RELEASE_FILES] + [CHECKSUM_FILE, MANIFEST_FILE]
    return {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}


def main():
    baseline = snapshot()
    for iteration in (1, 2):
        subprocess.run([sys.executable, str(ROOT / 'scripts/prepare_delivery.py')], cwd=ROOT, check=True)
        current = snapshot()
        changed = [name for name in baseline if baseline[name] != current[name]]
        if changed:
            raise RuntimeError(f'Rebuild {iteration} changed prepared artifacts: {changed}')
        print(f'Rebuild {iteration}: all {len(current)} files identical.', flush=True)
    return 0


if __name__ == '__main__':
    sys.exit(main())
