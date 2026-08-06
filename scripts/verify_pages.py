#!/usr/bin/env python3
"""Verify that GitHub Pages serves the committed Push artifact byte-for-byte."""

from __future__ import annotations

import argparse
import hashlib
from pathlib import Path
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urljoin, urlsplit, urlunsplit
from urllib.request import Request, urlopen


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def cache_busted(url: str, attempt: int) -> str:
    parts = urlsplit(url)
    query = urlencode({"verify": f"{int(time.time())}-{attempt}"})
    return urlunsplit((parts.scheme, parts.netloc, parts.path, query, parts.fragment))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True, help="Published GitHub Pages base URL")
    parser.add_argument("--expected", required=True, type=Path)
    parser.add_argument("--attempts", type=int, default=12)
    parser.add_argument("--delay", type=float, default=10.0)
    parser.add_argument("--timeout", type=float, default=20.0)
    args = parser.parse_args()

    expected_bytes = args.expected.read_bytes()
    expected_hash = digest(expected_bytes)
    published_url = urljoin(args.url.rstrip("/") + "/", "Income-per-sed-Push.html")
    last_error = "No request attempted"

    for attempt in range(1, args.attempts + 1):
        request = Request(
            cache_busted(published_url, attempt),
            headers={"User-Agent": "Income-per-sed-Pages-Verification/1.0"},
        )
        try:
            with urlopen(request, timeout=args.timeout) as response:
                actual_bytes = response.read()
            actual_hash = digest(actual_bytes)
            if actual_hash == expected_hash:
                print(f"Pages verification passed: {actual_hash}")
                return 0
            last_error = f"SHA-256 mismatch: expected {expected_hash}, received {actual_hash}"
        except (HTTPError, URLError, TimeoutError) as exc:
            last_error = str(exc)

        print(
            f"Attempt {attempt}/{args.attempts} did not match: {last_error}",
            file=sys.stderr,
        )
        if attempt < args.attempts:
            time.sleep(args.delay)

    print(f"Pages verification failed: {last_error}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
