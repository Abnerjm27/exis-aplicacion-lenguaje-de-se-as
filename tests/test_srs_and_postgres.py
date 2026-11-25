"""Pruebas unitarias para SRSService, PostgresUserRepository (mock) y fallback JSON."""

import json
import os
import sys
import tempfile
import unittest
from datetime import datetime, timezone

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from db import PostgresUserRepository, SRSService, create_user_repository, handle_srs_get, handle_srs_post
from server import VALID_SIGN_IDS, UserRepository


class FakeCursor:
    def __init__(self, state):
        self.state = state
        self.queries = []
        self._rows = []

    def execute(self, sql, params=None):
        self.queries.append((sql, params))
        norm = " ".join(sql.split()).upper()
        if norm.startswith("SELECT ID, USERNAME"):
            self._rows = [
                (
                    u["id"],
                    u["username"],
                    u["display_name"],
                    u["level"],
                    u["xp"],
                    u["streak"],
                    json.dumps(u["mastered_signs"]),
                    datetime(2026, 11, 24, 12, 0, tzinfo=timezone.utc),
                )
                for u in self.state["users"].values()
            ]
        elif norm.startswith("SELECT USER_ID, PLAN_UID"):
            self._rows = [
                (p["user_id"], p["plan_uid"], p["title"], p["rationale"], json.dumps(p["signs"]))
                for p in self.state["plans"]
            ]
        elif norm.startswith("SELECT USER_ID, PLAN_TITLE"):
            self._rows = [
                (e["user_id"], e["plan_title"], e["score_pct"], e["correct_cnt"], e["total_cnt"], e["date_iso"])
                for e in self.state["exams"]
            ]
        elif norm.startswith("SELECT USER_ID, SIGN_ID"):
            self._rows = [
                (s["user_id"], s["sign_id"], s["box"], s["attempts"], s["successes"], s["last"], s["next"])
                for s in self.state["progress"]
            ]
        elif norm.startswith("INSERT INTO USERS"):
            uname, dname, lvl, xp, streak, mastered_json = params
            existing = next((u for u in self.state["users"].values() if u["username"] == uname), None)
            if existing:
                uid = existing["id"]
            else:
                uid = len(self.state["users"]) + 1
            self.state["users"][uid] = {
                "id": uid,
                "username": uname,
                "display_name": dname,
                "level": lvl,
                "xp": xp,
                "streak": streak,
                "mastered_signs": json.loads(mastered_json),
            }
            self._rows = [(uid,)]
        elif norm.startswith("DELETE FROM CUSTOM_PLANS"):
            uid = params[0]
            self.state["plans"] = [p for p in self.state["plans"] if p["user_id"] != uid]
        elif norm.startswith("INSERT INTO CUSTOM_PLANS"):
            uid, puid, title, rationale, signs_json = params
            self.state["plans"].append({
                "user_id": uid, "plan_uid": puid, "title": title,
                "rationale": rationale, "signs": json.loads(signs_json),
            })
        elif norm.startswith("DELETE FROM EXAM_ATTEMPTS"):
            uid = params[0]
            self.state["exams"] = [e for e in self.state["exams"] if e["user_id"] != uid]
        elif norm.startswith("INSERT INTO EXAM_ATTEMPTS"):
            uid, ptitle, score, corr, tot, diso = params
            self.state["exams"].append({
                "user_id": uid, "plan_title": ptitle, "score_pct": score,
                "correct_cnt": corr, "total_cnt": tot, "date_iso": diso,
            })
        elif norm.startswith("INSERT INTO USER_SIGN_PROGRESS"):
            uid, sid, box, att, succ, _mastered, last_p, next_r = params
            self.state["progress"] = [
                p for p in self.state["progress"] if not (p["user_id"] == uid and p["sign_id"] == sid)
            ]
            self.state["progress"].append({
                "user_id": uid, "sign_id": sid, "box": box, "attempts": att,
                "successes": succ, "last": last_p, "next": next_r,
            })
        else:
            self._rows = []

    def fetchall(self):
        return list(self._rows)

    def fetchone(self):
        return self._rows[0] if self._rows else None

    def close(self):
        pass


class FakeConnection:
    def __init__(self, state):
        self.state = state
        self.committed = False
        self.rolled_back = False

    def cursor(self):
        return FakeCursor(self.state)

    def commit(self):
        self.committed = True

    def rollback(self):
        self.rolled_back = True

    def close(self):
        pass


class TestSRSAndPostgres(unittest.TestCase):
    def test_valid_sign_ids_has_24_letters_and_10_words(self):
        self.assertEqual(len(VALID_SIGN_IDS), 34)
        for letter in ["F", "G", "H", "J", "K", "M", "N", "P", "Q", "R", "S", "T", "W", "Z"]:
            self.assertIn(letter, VALID_SIGN_IDS)

    def test_schema_sql_contains_expected_tables(self):
        schema_path = os.path.join(ROOT_DIR, "db", "schema.sql")
        with open(schema_path, "r", encoding="utf-8") as f:
            sql = f.read()
        for table in ["users", "user_sign_progress", "exam_attempts", "custom_plans"]:
            self.assertIn(f"CREATE TABLE IF NOT EXISTS {table}", sql)

    def test_srs_service_leitner_and_due_priority(self):
        srs = SRSService()
        t0 = 1_795_000_000.0
        stats = {}
        stats = srs.record_review(stats, "K", False, now_ts=t0)
        self.assertEqual(stats["K"]["box"], 1)
        self.assertEqual(stats["K"]["masteryPct"], 0)

        stats = srs.record_review(stats, "K", True, now_ts=t0 + 10)
        self.assertEqual(stats["K"]["box"], 2)
        self.assertEqual(stats["K"]["masteryPct"], 50)

        # 25 hours later, box 2 (24h) is due
        due = srs.get_due_signs(stats, ["A", "K", "M"], limit=3, now_ts=t0 + 25 * 3600)
        self.assertEqual(due[0]["signId"], "K")
        self.assertTrue(due[0]["isDue"])

    def test_postgres_repository_roundtrip_with_mock_connection(self):
        state = {"users": {}, "plans": [], "exams": [], "progress": []}
        repo = PostgresUserRepository(
            dsn="postgresql://mock/test",
            valid_sign_ids=VALID_SIGN_IDS,
            connection_factory=lambda: FakeConnection(state),
        )
        repo.ensure_schema()

        saved = repo.save_user({
            "username": "abner_test",
            "displayName": "Abner",
            "xp": 120,
            "streak": 4,
            "masteredSigns": ["A", "F", "INVALID"],
            "customPlans": [{"id": "p1", "title": "Abecedario", "rationale": "Base", "signs": ["A", "F"]}],
            "examHistory": [{"planTitle": "Reto", "scorePct": 90, "correct": 9, "total": 10, "dateIso": "2026-11-24T12:00:00Z"}],
            "signStats": {"F": {"box": 2, "attempts": 3, "successes": 2}},
        })
        self.assertEqual(saved["masteredSigns"], ["A", "F"])

        res = repo.record_srs_review("abner_test", "M", True)
        self.assertEqual(res["stat"]["box"], 2)

        all_users = repo.get_all_users()["users"]
        self.assertEqual(len(all_users), 1)
        self.assertEqual(all_users[0]["username"], "abner_test")
        self.assertIn("M", all_users[0]["signStats"])

    def test_factory_falls_back_to_json_without_database_url(self):
        old_dsn = os.environ.pop("DATABASE_URL", None)
        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                db_file = os.path.join(tmpdir, "users.json")
                repo = create_user_repository(UserRepository, db_file, VALID_SIGN_IDS)
                self.assertIsInstance(repo, UserRepository)

                status, post_body = handle_srs_post(
                    {"username": "sol_user", "signId": "G", "passed": True},
                    repo,
                    VALID_SIGN_IDS,
                )
                self.assertEqual(status, 200)
                self.assertEqual(post_body["stat"]["box"], 2)

                get_status, get_body = handle_srs_get(
                    "/api/srs/due?username=sol_user&limit=3",
                    repo,
                    VALID_SIGN_IDS,
                )
                self.assertEqual(get_status, 200)
                self.assertEqual(len(get_body["due"]), 3)
        finally:
            if old_dsn is not None:
                os.environ["DATABASE_URL"] = old_dsn


if __name__ == "__main__":
    unittest.main(verbosity=2)
