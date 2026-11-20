"""
Tests de seguridad, endurecimiento HTTP, rate limiting, validación de esquema y marca Tito IA.
"""
import http.client
import json
import os
import sys
import tempfile
import unittest
import urllib.request

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from server import PedagogicalPlanner, RateLimiter, UserRepository


class TestSecurityAndHardeningUnit(unittest.TestCase):
    def test_user_repository_validation_clamping_and_sanitization(self):
        with tempfile.TemporaryDirectory() as tmp:
            db_path = os.path.join(tmp, "users.json")
            repo = UserRepository(db_path=db_path)

            with self.assertRaises(ValueError):
                repo.save_user({"username": "invalid user!!!"})

            saved = repo.save_user({
                "username": "Ana@UTP.edu.co",
                "displayName": "Ana",
                "xp": -50,
                "streak": 999999,
                "masteredSigns": ["HOLA", "INVALID_SIGN"],
                "customPlans": [{"id": "p1", "title": "Plan", "signs": ["A", "FAKE"], "extra": "ignored"}] * 25,
                "examHistory": [{"planTitle": "E1", "scorePct": 150, "correct": -2, "total": 5, "dateIso": "2026-11-20"}] * 55,
            })
            self.assertEqual(saved["username"], "ana@utp.edu.co")
            self.assertEqual(saved["xp"], 0)
            self.assertEqual(saved["streak"], 10_000)
            self.assertEqual(saved["masteredSigns"], ["HOLA"])
            self.assertEqual(len(saved["customPlans"]), 20)
            self.assertEqual(saved["customPlans"][0]["signs"], ["A"])
            self.assertNotIn("extra", saved["customPlans"][0])
            self.assertEqual(len(saved["examHistory"]), 50)
            self.assertEqual(saved["examHistory"][0]["scorePct"], 100)
            self.assertEqual(saved["examHistory"][0]["correct"], 0)

    def test_pedagogical_planner_uses_tito_brand_and_not_sol(self):
        planner = PedagogicalPlanner(ollama_url="http://127.0.0.1:9/unused", timeout=0.05)
        for goal in ["abecedario completo", "saludos iniciales", "vocabulario diario", "quiero empezar"]:
            res = planner.build_plan(goal, "beginner")
            self.assertIn("Tito IA", res["rationale"])
            self.assertNotIn("Sol ", res["rationale"])

    def test_rate_limiter_enforces_limit(self):
        limiter = RateLimiter(max_requests=3, window_seconds=60)
        self.assertTrue(limiter.allow("10.0.0.1"))
        self.assertTrue(limiter.allow("10.0.0.1"))
        self.assertTrue(limiter.allow("10.0.0.1"))
        self.assertFalse(limiter.allow("10.0.0.1"))
        self.assertTrue(limiter.allow("10.0.0.2"))


class TestSecurityAndHardeningLiveHTTP(unittest.TestCase):
    HOST = "127.0.0.1"
    PORT = 8000

    @classmethod
    def setUpClass(cls):
        try:
            with urllib.request.urlopen(f"http://{cls.HOST}:{cls.PORT}/api/users", timeout=0.8) as resp:
                cls.server_available = (resp.status == 200)
        except Exception:
            cls.server_available = False

    def setUp(self):
        if not getattr(self, "server_available", False):
            self.skipTest("Servidor HTTP local en puerto 8000 no activo.")

    def _raw_get(self, path, headers=None):
        conn = http.client.HTTPConnection(self.HOST, self.PORT, timeout=3)
        try:
            conn.request("GET", path, headers=headers or {})
            resp = conn.getresponse()
            resp.read()
            return resp.status, dict(resp.getheaders())
        finally:
            conn.close()

    def test_cors_blocks_lookalike_origins_and_allows_localhost(self):
        status_bad, hdrs_bad = self._raw_get("/api/users", {"Origin": "http://localhost.evil.com"})
        self.assertEqual(status_bad, 200)
        acao_bad = hdrs_bad.get("Access-Control-Allow-Origin")
        self.assertEqual(acao_bad, "http://localhost:8000")

        status_ok, hdrs_ok = self._raw_get("/api/users", {"Origin": "http://localhost:8000"})
        self.assertEqual(status_ok, 200)
        self.assertEqual(hdrs_ok.get("Access-Control-Allow-Origin"), "http://localhost:8000")

    def test_sensitive_paths_return_403_even_case_or_encoded(self):
        for restricted in [
            "/data/users_db.json",
            "/data/USERS_DB.JSON",
            "/data/users%5Fdb.json",
            "/tools/",
            "/tools_archive/",
            "/.env",
        ]:
            status, _ = self._raw_get(restricted)
            self.assertEqual(status, 403, f"Se esperaba 403 para {restricted}, obtenido {status}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
