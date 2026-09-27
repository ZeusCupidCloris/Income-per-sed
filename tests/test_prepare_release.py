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

from prepare_release import DOCUMENT_XML, sync_manual_hashes
from manual_checksums import MARKERS, WORD_NS, read_manual_hashes, replace_manual_hashes


def marked_document(order=None, split=False):
    markers = list(MARKERS) if order is None else order
    paragraphs = []
    for index, marker in enumerate(markers):
        value = '<w:r><w:t>' + '0' * 64 + '</w:t></w:r>'
        if split:
            value = '<w:r><w:t>' + '0' * 32 + '</w:t></w:r><w:r><w:t>' + '0' * 32 + '</w:t></w:r>'
        paragraphs.append(f'<w:p><w:bookmarkStart w:id="{index}" w:name="{marker}"/>{value}<w:bookmarkEnd w:id="{index}"/></w:p>')
    return (f'<w:document xmlns:w="{WORD_NS}"><w:body>' + ''.join(paragraphs) + '</w:body></w:document>').encode()


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

    def test_unmarked_legacy_manual_fails_without_overwrite(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp = Path(temp_dir)
            manual, develop, push = (temp / name for name in ('manual.docx','Develop.html','Push.html'))
            develop.write_bytes(b'develop')
            push.write_bytes(b'push')
            with zipfile.ZipFile(manual, 'w') as archive:
                archive.writestr(DOCUMENT_XML, b'<doc>' + b'0'*64 + b' ' + b'1'*64 + b'</doc>')
            original = manual.read_bytes()
            with self.assertRaisesRegex(RuntimeError, 'Missing checksum markers'):
                sync_manual_hashes(manual, develop, push)
            self.assertEqual(manual.read_bytes(), original)

    def test_manual_hash_update_is_correct_and_idempotent(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp = Path(temp_dir)
            manual = temp / "manual.docx"
            develop = temp / "Develop.html"
            push = temp / "Push.html"
            shutil.copy2(ROOT / "docs/Income-per-sed（说明文档）.docx", manual)
            with zipfile.ZipFile(manual) as archive:
                original = {name: archive.read(name) for name in archive.namelist()}
            develop.write_bytes(b"develop fixture\n")
            push.write_bytes(b"push fixture\n")

            self.assertTrue(sync_manual_hashes(manual, develop, push))
            with zipfile.ZipFile(manual) as archive:
                document_xml = archive.read(DOCUMENT_XML)
                self.assertIsNone(archive.testzip())
                self.assertEqual({name: archive.read(name) for name in archive.namelist() if name != DOCUMENT_XML},
                                 {name: data for name, data in original.items() if name != DOCUMENT_XML})

            expected = {
                'Income-per-sed-Develop.html': hashlib.sha256(develop.read_bytes()).hexdigest(),
                'Income-per-sed-Push.html': hashlib.sha256(push.read_bytes()).hexdigest(),
                'IncomeWidget.js': hashlib.sha256((ROOT / "IncomeWidget.js").read_bytes()).hexdigest(),
            }
            self.assertEqual(read_manual_hashes(document_xml), expected)
            self.assertEqual(replace_manual_hashes(document_xml, read_manual_hashes(original[DOCUMENT_XML])), original[DOCUMENT_XML])

            first_digest = hashlib.sha256(manual.read_bytes()).hexdigest()
            self.assertFalse(sync_manual_hashes(manual, develop, push))
            self.assertEqual(hashlib.sha256(manual.read_bytes()).hexdigest(), first_digest)

    def test_reordered_paragraphs_and_split_runs_use_file_markers(self):
        expected = {filename: hashlib.sha256(filename.encode()).hexdigest() for filename in MARKERS.values()}
        for split in [False, True]:
            source = marked_document(list(reversed(MARKERS)), split)
            updated = replace_manual_hashes(source, expected)
            self.assertEqual(read_manual_hashes(updated), expected)
            self.assertEqual(replace_manual_hashes(updated, expected), updated)

    def test_unrelated_hashes_and_bookmarks_are_preserved(self):
        extra = b'<w:p><w:bookmarkStart w:id="90" w:name="chapter"/><w:r><w:t>' + b'F' * 64 + b'</w:t></w:r><w:bookmarkEnd w:id="90"/></w:p>'
        source = marked_document().replace(b'</w:body>', extra + b'</w:body>')
        updated = replace_manual_hashes(source, {filename: 'a' * 64 for filename in MARKERS.values()})
        self.assertIn(extra, updated)

    def test_invalid_markers_fail_closed(self):
        valid = marked_document()
        cases = {
            'missing': marked_document(list(MARKERS)[:-1]),
            'duplicate': marked_document(list(MARKERS) + [next(iter(MARKERS))]),
            'unknown': valid.replace(b'income_sha256_push', b'income_sha256_unknown'),
            'unclosed': valid.replace(b'<w:bookmarkEnd w:id="2"/>', b''),
            'invalid hash': valid.replace(b'0' * 64, b'0' * 63, 1),
            'multiple hashes': valid.replace(b'0' * 64, b'0' * 128, 1),
            'entity': valid.replace(b'0' * 64, b'&#48;' + b'0' * 63, 1),
        }
        for label, source in cases.items():
            with self.subTest(label=label), self.assertRaises(RuntimeError):
                read_manual_hashes(source)


if __name__ == "__main__":
    unittest.main()
