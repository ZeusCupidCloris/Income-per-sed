#!/usr/bin/env python3
"""Validate the single-file release artifacts without changing application code."""

from __future__ import annotations

import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
import sys
import zipfile


ROOT = Path(__file__).resolve().parents[1]
RELEASE_FILES = (
    Path("Income-per-sed-Push.html"),
    Path("Income-per-sed-Develop.html"),
    Path("IncomeWidget.js"),
    Path("docs/Income-per-sed（说明文档）.docx"),
)
CHECKSUM_FILE = ROOT / "SHA256SUMS.txt"
MANIFEST_FILE = ROOT / "release-manifest.json"
PACKAGE_FILE = ROOT / "package.json"
CHECKSUM_TARGETS = RELEASE_FILES + (Path("release-manifest.json"),)
LEGACY_MANUAL = ROOT / "docs/Income-per-sed（说明文档）"
REQUIRED_IDS = (
    "incomeMainCard",
    "historyQuickOpen",
    "historyQuickPanel",
    "incomeDial",
    "incomeSettingsCard",
    "monthSummaryCard",
    "funSummaryCard",
    "taskStopwatchPanel",
    "themeCycle",
)
RELEASE_FIELDS = (
    "version",
    "productVersion",
    "sourceTag",
    "buildId",
    "releaseDate",
)


class InlineScriptParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=False)
        self._capture = False
        self._parts: list[str] = []
        self.scripts: list[tuple[str, str]] = []
        self._kind = "classic"

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "script":
            return
        values = {key.lower(): value for key, value in attrs}
        script_type = (values.get("type") or "text/javascript").lower()
        self._capture = "src" not in values and script_type in {
            "text/javascript",
            "application/javascript",
            "module",
        }
        self._kind = "module" if script_type == "module" else "classic"
        self._parts = []

    def handle_data(self, data: str) -> None:
        if self._capture:
            self._parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "script" and self._capture:
            self.scripts.append((self._kind, "".join(self._parts)))
            self._capture = False
            self._parts = []


def fail(message: str) -> None:
    raise RuntimeError(message)


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            hasher.update(block)
    return hasher.hexdigest()


def checksum_text() -> str:
    return "".join(
        f"{digest(ROOT / relative)}  {relative.as_posix()}\n"
        for relative in CHECKSUM_TARGETS
    )


def read_json(path: Path) -> dict[str, object]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        raise RuntimeError(f"Invalid JSON in {path.relative_to(ROOT)}: {exc}") from exc


def extract_release_fields(path: Path) -> dict[str, str]:
    text = path.read_text(encoding="utf-8")
    fields: dict[str, str] = {}
    for field in RELEASE_FIELDS:
        match = re.search(rf"\b{re.escape(field)}\s*:\s*['\"]([^'\"]+)['\"]", text)
        if not match:
            fail(f"{path.name}: APP_RELEASE is missing {field}")
        fields[field] = match.group(1)
    return fields


def validate_manifest(release_tag: str | None) -> None:
    manifest = read_json(MANIFEST_FILE)
    package = read_json(PACKAGE_FILE)
    product_version = str(manifest.get("productVersion", ""))
    expected_tag = f"v{product_version}"
    if package.get("version") != product_version:
        fail("package.json version does not match release-manifest.json")
    if manifest.get("releaseTag") != expected_tag:
        fail("release-manifest.json releaseTag must equal v + productVersion")
    if release_tag and release_tag != expected_tag:
        fail(f"Release tag {release_tag} does not match manifest tag {expected_tag}")
    if manifest.get("canonicalSource") != RELEASE_FILES[1].as_posix():
        fail("Develop HTML must remain the canonical source")
    if manifest.get("derivedArtifacts") != [RELEASE_FILES[0].as_posix()]:
        fail("Push HTML must remain the declared derived artifact")

    expected_artifacts = [path.as_posix() for path in RELEASE_FILES] + [
        CHECKSUM_FILE.name,
        MANIFEST_FILE.name,
    ]
    if manifest.get("releaseArtifacts") != expected_artifacts:
        fail("release-manifest.json releaseArtifacts is incomplete or out of order")

    expected_fields = {
        "version": str(manifest.get("internalVersion", "")),
        "productVersion": product_version,
        "sourceTag": expected_tag,
        "buildId": str(manifest.get("buildId", "")),
        "releaseDate": str(manifest.get("releaseDate", "")),
    }
    for relative in RELEASE_FILES[:2]:
        actual_fields = extract_release_fields(ROOT / relative)
        if actual_fields != expected_fields:
            fail(f"{relative.name}: APP_RELEASE does not match release-manifest.json")


def validate_files() -> None:
    missing = [str(path) for path in RELEASE_FILES if not (ROOT / path).is_file()]
    if missing:
        fail(f"Missing release files: {', '.join(missing)}")
    if LEGACY_MANUAL.exists():
        fail(f"Legacy extensionless manual still exists: {LEGACY_MANUAL.relative_to(ROOT)}")
    if (ROOT / RELEASE_FILES[0]).stat().st_size >= (ROOT / RELEASE_FILES[1]).stat().st_size:
        fail("Push HTML should remain smaller than the Develop HTML")


def validate_html(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    if '<html lang="zh-CN"' not in text:
        fail(f"{path.name}: missing zh-CN document language")
    if 'name="viewport"' not in text:
        fail(f"{path.name}: missing responsive viewport metadata")
    for element_id in REQUIRED_IDS:
        if f'id="{element_id}"' not in text:
            fail(f"{path.name}: missing required element #{element_id}")
    if path.name.endswith("Push.html"):
        if 'name="income-per-sed-channel" content="push"' not in text:
            fail(f"{path.name}: missing push channel metadata")
        for marker in ("__incomeClockDiagnostics", "运行诊断", "DEVELOP REGRESSION EXPORT"):
            if marker in text:
                fail(f"{path.name}: Develop-only marker leaked into Push: {marker}")

    parser = InlineScriptParser()
    parser.feed(text)
    if not parser.scripts:
        fail(f"{path.name}: no inline JavaScript found")

    for index, (kind, script) in enumerate(parser.scripts, start=1):
        command = ["node", "--check"]
        if kind == "module":
            command.append("--input-type=module")
        command.append("-")
        result = subprocess.run(
            command,
            input=script,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        if result.returncode:
            fail(
                f"{path.name}: inline script {index} failed syntax validation\n"
                f"{result.stderr.strip()}"
            )


def validate_widget() -> None:
    result = subprocess.run(
        ["node", "--check", str(ROOT / "IncomeWidget.js")],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if result.returncode:
        fail(f"IncomeWidget.js failed syntax validation\n{result.stderr.strip()}")


def validate_docx() -> None:
    path = ROOT / RELEASE_FILES[-1]
    required_members = {"[Content_Types].xml", "word/document.xml"}
    try:
        with zipfile.ZipFile(path) as archive:
            names = set(archive.namelist())
            missing = required_members - names
            if missing:
                fail(f"DOCX is missing required entries: {', '.join(sorted(missing))}")
            bad_member = archive.testzip()
            if bad_member:
                fail(f"DOCX contains a corrupt entry: {bad_member}")
            document_xml = archive.read("word/document.xml")
    except zipfile.BadZipFile as exc:
        raise RuntimeError(f"DOCX is not a valid OOXML ZIP package: {exc}") from exc

    embedded_hashes = [
        match.group(0).decode("ascii").lower()
        for match in re.finditer(
            rb"(?<![0-9A-Fa-f])[0-9A-Fa-f]{64}(?![0-9A-Fa-f])",
            document_xml,
        )
    ]
    expected_hashes = [
        digest(ROOT / RELEASE_FILES[1]),
        digest(ROOT / RELEASE_FILES[0]),
    ]
    if embedded_hashes != expected_hashes:
        fail(
            "Word manual HTML hashes are stale; run npm run release:prepare "
            f"(expected Develop {expected_hashes[0]} and Push {expected_hashes[1]})"
        )


def validate_checksums(write: bool) -> None:
    expected = checksum_text()
    if write:
        CHECKSUM_FILE.write_text(expected, encoding="utf-8", newline="\n")
        print(f"Wrote {CHECKSUM_FILE.relative_to(ROOT)}")
        return
    if not CHECKSUM_FILE.is_file():
        fail("SHA256SUMS.txt is missing; run npm run checksums")
    actual = CHECKSUM_FILE.read_text(encoding="utf-8")
    if actual != expected:
        fail("SHA256SUMS.txt is stale; run npm run checksums")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--write-checksums",
        action="store_true",
        help="Regenerate SHA256SUMS.txt after validating all artifacts.",
    )
    parser.add_argument(
        "--release-tag",
        help="Validate an existing release tag against release-manifest.json.",
    )
    args = parser.parse_args()

    try:
        validate_files()
        validate_manifest(args.release_tag)
        validate_widget()
        validate_html(ROOT / RELEASE_FILES[0])
        validate_html(ROOT / RELEASE_FILES[1])
        validate_docx()
        validate_checksums(args.write_checksums)
    except (OSError, RuntimeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    print("Release validation passed.")
    for relative in RELEASE_FILES:
        path = ROOT / relative
        print(f"  {relative.as_posix()}: {path.stat().st_size} bytes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
