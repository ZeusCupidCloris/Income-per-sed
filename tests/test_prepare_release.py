from __future__ import annotations

import hashlib
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
            ]
            self.assertEqual([match.group(0) for match in HASH_PATTERN.finditer(document_xml)], expected)

            first_digest = hashlib.sha256(manual.read_bytes()).hexdigest()
            self.assertFalse(sync_manual_hashes(manual, develop, push))
            self.assertEqual(hashlib.sha256(manual.read_bytes()).hexdigest(), first_digest)


if __name__ == "__main__":
    unittest.main()
