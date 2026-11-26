"""Repositorio PostgreSQL POO para Manitas (Proyecto EXIS · Tutor LSC)."""

from __future__ import annotations

import importlib
import json
import logging
import os
import re
import threading
import time
from typing import Any, Callable, Dict, List, Optional

from .srs_service import SRSService

logger = logging.getLogger("server")


class PostgresUserRepository:
    """Repositorio POO que persiste usuarios, historial y SRS en PostgreSQL."""

    def __init__(
        self,
        dsn: str,
        valid_sign_ids: List[str],
        connection_factory: Optional[Callable[[], Any]] = None,
        schema_path: Optional[str] = None,
    ):
        self.dsn = dsn
        self.valid_sign_ids = list(valid_sign_ids)
        self._lock = threading.Lock()
        self._srs = SRSService()
        self._connection_factory = connection_factory
        self._schema_path = schema_path or os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "schema.sql"
        )
        self._driver_name: Optional[str] = None
        if self._connection_factory is None:
            self._driver_name, self._driver_mod = self._load_driver()
        else:
            self._driver_name, self._driver_mod = "custom", None

    @staticmethod
    def _load_driver():
        for mod_name in ("psycopg", "psycopg2"):
            try:
                mod = importlib.import_module(mod_name)
                return mod_name, mod
            except ImportError:
                continue
        raise RuntimeError(
            "No hay driver PostgreSQL instalado. Instala 'psycopg[binary]' o 'psycopg2'."
        )

    def _connect(self):
        if self._connection_factory is not None:
            return self._connection_factory()
        return self._driver_mod.connect(self.dsn)

    def ensure_schema(self) -> None:
        """Ejecuta db/schema.sql de forma idempotente."""
        with open(self._schema_path, "r", encoding="utf-8") as f:
            schema_sql = f.read()
        with self._lock:
            conn = self._connect()
            try:
                cur = conn.cursor()
                cur.execute(schema_sql)
                conn.commit()
                cur.close()
            finally:
                conn.close()

    def _sanitize_user(self, user_data: dict) -> dict:
        if not isinstance(user_data, dict) or not user_data.get("username"):
            raise ValueError("Datos de usuario inválidos: requiere campo 'username'")

        username = str(user_data.get("username")).strip().lower()
        if not re.match(r"^[a-z0-9._@-]{2,64}$", username):
            raise ValueError(
                "Nombre de usuario inválido (2-64 caracteres alfanuméricos o ._@-)"
            )

        try:
            xp_val = max(0, min(int(user_data.get("xp", 0)), 1_000_000))
        except (TypeError, ValueError):
            xp_val = 0
        try:
            streak_val = max(0, min(int(user_data.get("streak", 1)), 10_000))
        except (TypeError, ValueError):
            streak_val = 1

        valid_set = set(self.valid_sign_ids)
        raw_plans = user_data.get("customPlans", [])
        clean_plans = []
        if isinstance(raw_plans, list):
            for plan in raw_plans[:20]:
                if isinstance(plan, dict):
                    raw_signs = plan.get("signs", [])
                    clean_signs = (
                        [str(s) for s in raw_signs if s in valid_set][:20]
                        if isinstance(raw_signs, list)
                        else []
                    )
                    clean_plans.append({
                        "id": str(plan.get("id", ""))[:64],
                        "title": str(plan.get("title", "Plan LSC"))[:100],
                        "rationale": str(plan.get("rationale", ""))[:300],
                        "signs": clean_signs,
                    })

        raw_history = user_data.get("examHistory", [])
        clean_history = []
        if isinstance(raw_history, list):
            for entry in raw_history[:50]:
                if isinstance(entry, dict):
                    try:
                        score_pct = max(0, min(int(entry.get("scorePct", 0)), 100))
                        correct_cnt = max(0, int(entry.get("correct", 0)))
                        total_cnt = max(0, int(entry.get("total", 0)))
                    except (TypeError, ValueError):
                        continue
                    clean_history.append({
                        "planTitle": str(entry.get("planTitle", "Examen LSC"))[:100],
                        "scorePct": score_pct,
                        "correct": correct_cnt,
                        "total": total_cnt,
                        "dateIso": str(entry.get("dateIso", ""))[:40],
                    })

        raw_mastered = user_data.get("masteredSigns", [])
        clean_mastered = (
            [str(s) for s in raw_mastered if s in valid_set][: len(valid_set)]
            if isinstance(raw_mastered, list)
            else []
        )
        clean_stats = SRSService.sanitize_sign_stats(
            user_data.get("signStats", {}), self.valid_sign_ids
        )

        return {
            "username": username,
            "displayName": str(user_data.get("displayName") or username).strip()[:100],
            "level": str(user_data.get("level", "Principiante")).strip()[:50],
            "xp": xp_val,
            "streak": streak_val,
            "masteredSigns": clean_mastered,
            "customPlans": clean_plans,
            "examHistory": clean_history,
            "signStats": clean_stats,
            "lastUpdated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

    def get_all_users(self) -> dict:
        """Retorna todos los usuarios con sus planes, exámenes y progreso SRS."""
        with self._lock:
            conn = self._connect()
            try:
                cur = conn.cursor()
                cur.execute(
                    "SELECT id, username, display_name, level, xp, streak, "
                    "mastered_signs, last_updated FROM users ORDER BY id ASC"
                )
                user_rows = cur.fetchall()

                users_by_id: Dict[int, dict] = {}
                for row in user_rows:
                    uid, uname, dname, lvl, xp, streak, mastered, last_upd = row
                    if isinstance(mastered, str):
                        mastered = json.loads(mastered)
                    last_iso = (
                        last_upd.strftime("%Y-%m-%dT%H:%M:%SZ")
                        if hasattr(last_upd, "strftime")
                        else str(last_upd or "")
                    )
                    users_by_id[uid] = {
                        "username": uname,
                        "displayName": dname,
                        "level": lvl,
                        "xp": int(xp or 0),
                        "streak": int(streak or 1),
                        "masteredSigns": list(mastered or []),
                        "customPlans": [],
                        "examHistory": [],
                        "signStats": {},
                        "lastUpdated": last_iso,
                    }

                if users_by_id:
                    cur.execute(
                        "SELECT user_id, plan_uid, title, rationale, signs "
                        "FROM custom_plans ORDER BY id ASC"
                    )
                    for uid, puid, title, rationale, signs in cur.fetchall():
                        if uid in users_by_id:
                            if isinstance(signs, str):
                                signs = json.loads(signs)
                            users_by_id[uid]["customPlans"].append({
                                "id": puid,
                                "title": title,
                                "rationale": rationale,
                                "signs": list(signs or []),
                            })

                    cur.execute(
                        "SELECT user_id, plan_title, score_pct, correct_cnt, total_cnt, date_iso "
                        "FROM exam_attempts ORDER BY id ASC"
                    )
                    for uid, ptitle, score, corr, tot, diso in cur.fetchall():
                        if uid in users_by_id:
                            users_by_id[uid]["examHistory"].append({
                                "planTitle": ptitle,
                                "scorePct": int(score),
                                "correct": int(corr),
                                "total": int(tot),
                                "dateIso": diso,
                            })

                    cur.execute(
                        "SELECT user_id, sign_id, box, attempts, successes, "
                        "last_practiced_at, next_review_at FROM user_sign_progress"
                    )
                    for uid, sid, box, att, succ, last_p, next_r in cur.fetchall():
                        if uid in users_by_id:
                            att_i = int(att or 0)
                            succ_i = int(succ or 0)
                            users_by_id[uid]["signStats"][sid] = {
                                "box": int(box or 1),
                                "attempts": att_i,
                                "successes": succ_i,
                                "lastPracticedIso": (
                                    last_p.strftime("%Y-%m-%dT%H:%M:%SZ")
                                    if hasattr(last_p, "strftime")
                                    else str(last_p or "")
                                ),
                                "nextReviewIso": (
                                    next_r.strftime("%Y-%m-%dT%H:%M:%SZ")
                                    if hasattr(next_r, "strftime")
                                    else str(next_r or "")
                                ),
                                "masteryPct": round((succ_i / att_i) * 100) if att_i > 0 else 0,
                            }

                cur.close()
                return {"users": list(users_by_id.values())}
            finally:
                conn.close()

    def save_user(self, user_data: dict) -> dict:
        """Inserta o actualiza un usuario y sus colecciones en PostgreSQL."""
        clean = self._sanitize_user(user_data)
        with self._lock:
            conn = self._connect()
            try:
                cur = conn.cursor()
                cur.execute(
                    "INSERT INTO users (username, display_name, level, xp, streak, mastered_signs, last_updated) "
                    "VALUES (%s, %s, %s, %s, %s, %s::jsonb, NOW()) "
                    "ON CONFLICT (username) DO UPDATE SET "
                    "display_name = EXCLUDED.display_name, "
                    "level = EXCLUDED.level, "
                    "xp = EXCLUDED.xp, "
                    "streak = EXCLUDED.streak, "
                    "mastered_signs = EXCLUDED.mastered_signs, "
                    "last_updated = NOW() "
                    "RETURNING id",
                    (
                        clean["username"],
                        clean["displayName"],
                        clean["level"],
                        clean["xp"],
                        clean["streak"],
                        json.dumps(clean["masteredSigns"]),
                    ),
                )
                user_id = cur.fetchone()[0]

                cur.execute("DELETE FROM custom_plans WHERE user_id = %s", (user_id,))
                for plan in clean["customPlans"]:
                    cur.execute(
                        "INSERT INTO custom_plans (user_id, plan_uid, title, rationale, signs) "
                        "VALUES (%s, %s, %s, %s, %s::jsonb)",
                        (
                            user_id,
                            plan["id"],
                            plan["title"],
                            plan["rationale"],
                            json.dumps(plan["signs"]),
                        ),
                    )

                cur.execute("DELETE FROM exam_attempts WHERE user_id = %s", (user_id,))
                for entry in clean["examHistory"]:
                    cur.execute(
                        "INSERT INTO exam_attempts (user_id, plan_title, score_pct, correct_cnt, total_cnt, date_iso) "
                        "VALUES (%s, %s, %s, %s, %s, %s)",
                        (
                            user_id,
                            entry["planTitle"],
                            entry["scorePct"],
                            entry["correct"],
                            entry["total"],
                            entry["dateIso"],
                        ),
                    )

                mastered_set = set(clean["masteredSigns"])
                for sid, st in clean["signStats"].items():
                    cur.execute(
                        "INSERT INTO user_sign_progress "
                        "(user_id, sign_id, box, attempts, successes, mastered, last_practiced_at, next_review_at) "
                        "VALUES (%s, %s, %s, %s, %s, %s, NULLIF(%s, '')::timestamptz, NULLIF(%s, '')::timestamptz) "
                        "ON CONFLICT (user_id, sign_id) DO UPDATE SET "
                        "box = EXCLUDED.box, "
                        "attempts = EXCLUDED.attempts, "
                        "successes = EXCLUDED.successes, "
                        "mastered = EXCLUDED.mastered, "
                        "last_practiced_at = EXCLUDED.last_practiced_at, "
                        "next_review_at = EXCLUDED.next_review_at",
                        (
                            user_id,
                            sid,
                            st["box"],
                            st["attempts"],
                            st["successes"],
                            sid in mastered_set,
                            st["lastPracticedIso"],
                            st["nextReviewIso"],
                        ),
                    )

                conn.commit()
                cur.close()
                return clean
            except Exception:
                conn.rollback()
                raise
            finally:
                conn.close()

    def record_srs_review(self, username: str, sign_id: str, passed: bool) -> dict:
        """Actualiza el progreso SRS de una seña para username y devuelve el nuevo estado."""
        uname = str(username or "").strip().lower()
        sid = str(sign_id or "").strip().upper()
        if sid not in set(self.valid_sign_ids):
            raise ValueError(f"Seña inválida para SRS: {sid}")

        users = self.get_all_users().get("users", [])
        user = next((u for u in users if u.get("username") == uname), None)
        if not user:
            user = {
                "username": uname,
                "displayName": uname,
                "level": "Principiante",
                "xp": 0,
                "streak": 1,
                "masteredSigns": [],
                "customPlans": [],
                "examHistory": [],
                "signStats": {},
            }

        updated_stats = self._srs.record_review(user.get("signStats", {}), sid, bool(passed))
        user["signStats"] = updated_stats
        if passed and sid not in user["masteredSigns"]:
            user["masteredSigns"] = [*user["masteredSigns"], sid]
        saved = self.save_user(user)
        return {
            "username": uname,
            "signId": sid,
            "stat": saved["signStats"].get(sid),
            "due": self._srs.get_due_signs(saved["signStats"], self.valid_sign_ids, limit=3),
        }

    def get_due_reviews(self, username: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Obtiene las señas recomendadas para repaso hoy según Leitner."""
        uname = str(username or "").strip().lower()
        users = self.get_all_users().get("users", [])
        user = next((u for u in users if u.get("username") == uname), None)
        stats = user.get("signStats", {}) if user else {}
        return self._srs.get_due_signs(stats, self.valid_sign_ids, limit=limit)
