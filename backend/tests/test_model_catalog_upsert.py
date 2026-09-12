"""카탈로그 동기화가 보존해야 할 컬럼을 덮어쓰지 않는지 실제 SQLite 로 확인한다.

INSERT OR REPLACE 시절에는 충돌 시 행을 지웠다 다시 넣어서 description_i18n 이 매주
NULL 이 되고, 최초 발견일을 남길 방법이 없었다.
"""
import importlib.util
import re
import sqlite3
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("batch", ROOT / "backend/scripts/model_d1_batch.py")
batch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(batch)

EXT = {"id": "openai/gpt-x", "name": "OpenAI: GPT-X", "description": "첫 설명", "context_length": 128000,
       "pricing": {"prompt": "0.000001", "completion": "0.000002"}, "architecture": {"modality": "text->text"}}


class CatalogUpsertTest(unittest.TestCase):
    def setUp(self):
        schema = (ROOT / "schema_d1.sql").read_text()
        self.db = sqlite3.connect(":memory:")
        self.db.executescript(re.search(r"CREATE TABLE IF NOT EXISTS models \(.*?\);", schema, re.S).group(0))
        cols = {r[1] for r in self.db.execute("PRAGMA table_info(models)")}
        for c in ("description_i18n", "source", "first_seen_at"):
            if c not in cols:
                self.db.execute(f"ALTER TABLE models ADD COLUMN {c} TEXT")
        self.db.executescript(batch.convert_model_to_sql(EXT))
        self.id = self.db.execute("SELECT id FROM models").fetchone()[0]
        self.db.execute("UPDATE models SET description_i18n='{\"en\":\"x\"}', "
                        "first_seen_at='2026-08-01 00:00:00' WHERE id=?", (self.id,))

    def row(self):
        return self.db.execute("SELECT description, description_i18n, first_seen_at FROM models WHERE id=?",
                               (self.id,)).fetchone()

    def test_resync_keeps_translation_and_first_seen(self):
        self.db.executescript(batch.convert_model_to_sql(EXT))
        _, i18n, first_seen = self.row()
        self.assertEqual(i18n, '{"en":"x"}')
        self.assertEqual(first_seen, "2026-08-01 00:00:00")

    def test_changed_description_clears_only_the_translation(self):
        self.db.executescript(batch.convert_model_to_sql(dict(EXT, description="바뀐 설명")))
        desc, i18n, first_seen = self.row()
        self.assertEqual(desc, "바뀐 설명")
        self.assertIsNone(i18n)                       # 번역 배치가 다시 채운다
        self.assertEqual(first_seen, "2026-08-01 00:00:00")

    def test_new_model_gets_a_first_seen_date(self):
        self.db.executescript(batch.convert_model_to_sql(dict(EXT, id="new/y", name="New: Y")))
        self.assertIsNotNone(self.db.execute("SELECT first_seen_at FROM models WHERE name='New: Y'").fetchone()[0])

    def test_resync_does_not_duplicate_rows(self):
        self.db.executescript(batch.convert_model_to_sql(EXT))
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM models").fetchone()[0], 1)


if __name__ == "__main__":
    unittest.main()
