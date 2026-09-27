"""Locate named Word checksum bookmarks without rewriting unrelated OOXML."""

from __future__ import annotations

import re
from xml.parsers import expat

WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
MARKERS = {
    "income_sha256_develop": "Income-per-sed-Develop.html",
    "income_sha256_push": "Income-per-sed-Push.html",
    "income_sha256_widget": "IncomeWidget.js",
}


def checksum_spans(document: bytes) -> dict[str, list[tuple[int, int]]]:
    parser = expat.ParserCreate(namespace_separator="}")
    prefix = WORD_NS + "}"
    stack: list[str] = []
    starts: dict[str, str] = {}
    ends: set[str] = set()
    spans: dict[str, list[tuple[int, int]]] = {}
    active: tuple[str, str] | None = None

    def start(name: str, attrs: dict[str, str]) -> None:
        nonlocal active
        stack.append(name)
        if name == prefix + "bookmarkStart":
            identifier = attrs.get(prefix + "id", "")
            marker = attrs.get(prefix + "name", "")
            if not identifier or identifier in starts:
                raise RuntimeError("Missing or duplicate Word bookmark id")
            starts[identifier] = marker
            if marker.startswith("income_sha256_"):
                if marker not in MARKERS:
                    raise RuntimeError(f"Unknown checksum marker: {marker}")
                filename = MARKERS[marker]
                if filename in spans or active:
                    raise RuntimeError(f"Duplicate or overlapping checksum marker: {marker}")
                spans[filename] = []
                active = (identifier, filename)
        elif name == prefix + "bookmarkEnd":
            identifier = attrs.get(prefix + "id", "")
            if identifier in ends:
                raise RuntimeError("Duplicate Word bookmark end")
            ends.add(identifier)
            if active and identifier == active[0]:
                active = None

    def text(value: str) -> None:
        if active and stack[-1] == prefix + "t":
            offset = parser.CurrentByteIndex
            encoded = value.encode("utf-8")
            if document[offset:offset + len(encoded)] != encoded:
                raise RuntimeError("Checksum text must contain literal hexadecimal characters")
            spans[active[1]].append((offset, offset + len(encoded)))

    def reject_doctype(*_args: object) -> None:
        raise RuntimeError("DOCTYPE is not supported in Word checksum XML")

    parser.StartElementHandler = start
    parser.EndElementHandler = lambda _name: stack.pop()
    parser.CharacterDataHandler = text
    parser.StartDoctypeDeclHandler = reject_doctype
    try:
        parser.Parse(document, True)
    except expat.ExpatError as exc:
        raise RuntimeError(f"Invalid Word checksum XML: {exc}") from exc
    if active:
        raise RuntimeError(f"Unclosed checksum marker: {active[1]}")
    missing = set(MARKERS.values()) - spans.keys()
    if missing:
        raise RuntimeError(f"Missing checksum markers: {', '.join(sorted(missing))}")
    for filename, ranges in spans.items():
        value = b"".join(document[left:right] for left, right in ranges)
        if not re.fullmatch(rb"[0-9A-Fa-f]{64}", value):
            raise RuntimeError(f"Expected exactly one SHA-256 inside marker for {filename}")
    return spans


def read_manual_hashes(document: bytes) -> dict[str, str]:
    return {filename: b"".join(document[a:b] for a, b in ranges).decode("ascii").lower()
            for filename, ranges in checksum_spans(document).items()}


def replace_manual_hashes(document: bytes, expected: dict[str, str]) -> bytes:
    if set(expected) != set(MARKERS.values()):
        raise RuntimeError("Checksum file mapping must contain exactly the three release sources")
    replacements = []
    for filename, ranges in checksum_spans(document).items():
        value = expected[filename].upper().encode("ascii")
        if not re.fullmatch(rb"[0-9A-F]{64}", value):
            raise RuntimeError(f"Invalid replacement SHA-256: {filename}")
        offset = 0
        for left, right in ranges:
            replacements.append((left, right, value[offset:offset + right - left]))
            offset += right - left
    # Expat offsets allow preserving namespaces, formatting, bookmarks and all other bytes.
    for left, right, value in sorted(replacements, reverse=True):
        document = document[:left] + value + document[right:]
    return document
