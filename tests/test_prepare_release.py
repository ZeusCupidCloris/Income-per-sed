from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
import shutil
import sys
import tempfile
import unittest
import zipfile


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from prepare_release import DOCUMENT_XML, HASH_PATTERN, sync_manual_hashes


class PrepareReleaseTests(unittest.TestCase):
    def test_delivery_revision_matches_manual_and_widget(self) -> None:
        manifest = json.loads((ROOT / 'release-manifest.json').read_text(encoding='utf-8'))
        revision = manifest['deliveryRevision']
        self.assertRegex(revision, r'^\d{4}-\d{2}-\d{2}-r[1-9]\d*$')
        self.assertEqual(manifest['manualRevision'], revision)
        widget = (ROOT / 'IncomeWidget.js').read_text(encoding='utf-8')
        version = re.search(r'const APP = \{\s*version: "([^"]+)"', widget)
        self.assertIsNotNone(version)
        self.assertEqual(manifest['widgetVersion'], version.group(1))
        with zipfile.ZipFile(ROOT / 'docs/Income-per-sed（说明文档）.docx') as archive:
            manual = archive.read(DOCUMENT_XML).decode('utf-8')
        self.assertIn(revision, manual)
        self.assertIn(manifest['productVersion'], manual)
        self.assertIn(manifest['widgetVersion'], manual)

    def test_legacy_two_hash_manual_remains_supported(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp = Path(temp_dir)
            manual, develop, push = (temp / name for name in ('manual.docx','Develop.html','Push.html'))
            develop.write_bytes(b'develop')
            push.write_bytes(b'push')
            with zipfile.ZipFile(manual, 'w') as archive:
                archive.writestr(DOCUMENT_XML, b'<doc>' + b'0'*64 + b' ' + b'1'*64 + b'</doc>')
            self.assertTrue(sync_manual_hashes(manual, develop, push))
            self.assertFalse(sync_manual_hashes(manual, develop, push))

    def test_manual_hash_update_is_correct_and_idempotent(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp = Path(temp_dir)
            manual = temp / "manual.docx"
            develop = temp / "Develop.html"
            push = temp / "Push.html"
            shutil.copy2(ROOT / "docs/Income-per-sed（说明文档）.docx", manual)
            develop.write_bytes(b"develop fixture\n")
            push.write_bytes(b"push fixture\n")

            self.assertTrue(sync_manual_hashes(manual, develop, push))
            with zipfile.ZipFile(manual) as archive:
                document_xml = archive.read(DOCUMENT_XML)
                self.assertIsNone(archive.testzip())

            expected = [
                hashlib.sha256(develop.read_bytes()).hexdigest().upper().encode("ascii"),
                hashlib.sha256(push.read_bytes()).hexdigest().upper().encode("ascii"),
                hashlib.sha256((ROOT / "IncomeWidget.js").read_bytes()).hexdigest().upper().encode("ascii"),
            ]
            self.assertEqual([match.group(0) for match in HASH_PATTERN.finditer(document_xml)], expected)

            first_digest = hashlib.sha256(manual.read_bytes()).hexdigest()
            self.assertFalse(sync_manual_hashes(manual, develop, push))
            self.assertEqual(hashlib.sha256(manual.read_bytes()).hexdigest(), first_digest)


if __name__ == "__main__":
    unittest.main()
