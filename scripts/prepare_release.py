#!/usr/bin/env python3
"""Prepare all release artifacts from the canonical Develop source."""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import zipfile

from validate_release import CHECKSUM_FILE, MANIFEST_FILE, RELEASE_FILES, ROOT, digest


TEXT_ARTIFACTS = (RELEASE_FILES[1], RELEASE_FILES[2], MANIFEST_FILE.relative_to(ROOT))
DOCUMENT_XML = "word/document.xml"
HASH_PATTERN = re.compile(rb"(?<![0-9A-Fa-f])[0-9A-Fa-f]{64}(?![0-9A-Fa-f])")


def normalize_lf(relative: Path) -> bool:
    path = ROOT / relative
    original = path.read_bytes()
    normalized = original.replace(b"\r\n", b"\n").replace(b"\r", b"\n")
    if normalized == original:
        return False
    normalized.decode("utf-8")
    path.write_bytes(normalized)
    return True


def run(command: list[str]) -> None:
    subprocess.run(command, cwd=ROOT, check=True)


def sync_manual_hashes(
    manual_path: Path = ROOT / RELEASE_FILES[-1],
    develop_path: Path = ROOT / RELEASE_FILES[1],
    push_path: Path = ROOT / RELEASE_FILES[0],
) -> bool:
    expected = [
        digest(develop_path).upper().encode("ascii"),
        digest(push_path).upper().encode("ascii"),
    ]

    with zipfile.ZipFile(manual_path) as archive:
        infos = archive.infolist()
        payload = {info.filename: archive.read(info.filename) for info in infos}

    document_xml = payload.get(DOCUMENT_XML)
    if document_xml is None:
        raise RuntimeError(f"{manual_path.name} is missing {DOCUMENT_XML}")
    matches = list(HASH_PATTERN.finditer(document_xml))
    if len(matches) != len(expected):
        raise RuntimeError(
            f"Expected exactly two HTML SHA-256 values in {manual_path.name}; found {len(matches)}"
        )
    current = [match.group(0).upper() for match in matches]
    if current == expected:
        return False

    chunks: list[bytes] = []
    cursor = 0
    for match, replacement in zip(matches, expected, strict=True):
        chunks.extend((document_xml[cursor : match.start()], replacement))
        cursor = match.end()
    chunks.append(document_xml[cursor:])
    payload[DOCUMENT_XML] = b"".join(chunks)

    temp_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            dir=manual_path.parent,
            prefix=f".{manual_path.stem}-",
            suffix=".tmp",
            delete=False,
        ) as handle:
            temp_path = Path(handle.name)
        with zipfile.ZipFile(temp_path, "w") as output:
            for info in infos:
                output.writestr(info, payload[info.filename])
        os.replace(temp_path, manual_path)
    finally:
        if temp_path and temp_path.exists():
            temp_path.unlink()
    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--release-tag", help="Validate an existing release tag after preparation.")
    args = parser.parse_args()

    try:
        normalized = [relative.as_posix() for relative in TEXT_ARTIFACTS if normalize_lf(relative)]
        run(["node", "scripts/build_push.mjs", "--write"])
        manual_updated = sync_manual_hashes()

        validation = [sys.executable, "scripts/validate_release.py"]
        if args.release_tag:
            validation.extend(["--release-tag", args.release_tag])
        run([*validation, "--write-checksums"])
        run(validation)
    except (OSError, RuntimeError, subprocess.CalledProcessError, zipfile.BadZipFile) as exc:
        print(f"ERROR: release preparation failed: {exc}", file=sys.stderr)
        return 1

    print("Release preparation complete.")
    print(f"  Normalized LF files: {', '.join(normalized) if normalized else 'none'}")
    print(f"  Word manual hashes updated: {'yes' if manual_updated else 'no'}")
    print(f"  Checksums: {CHECKSUM_FILE.relative_to(ROOT).as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
