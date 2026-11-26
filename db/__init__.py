"""Paquete de persistencia (PostgreSQL + fallback JSON) y SRS para Manitas LSC."""

from __future__ import annotations

import logging
import os
import urllib.parse
from typing import Any, List, Tuple

from .postgres_repository import PostgresUserRepository
from .srs_service import SRSService

logger = logging.getLogger("server")
srs_service = SRSService()


def create_user_repository(fallback_cls: Any, db_path: str, valid_sign_ids: List[str]):
    """Crea PostgresUserRepository si DATABASE_URL está activo; si no, usa fallback JSON."""
    dsn = os.environ.get("DATABASE_URL", "").strip()
    if not dsn:
        logger.info("DATABASE_URL no definido; usando UserRepository JSON (%s).", db_path)
        return fallback_cls(db_path)

    try:
        repo = PostgresUserRepository(dsn=dsn, valid_sign_ids=valid_sign_ids)
        repo.ensure_schema()
        logger.info("Conectado a PostgreSQL exitosamente.")
        return repo
    except Exception as exc:
        logger.warning(
            "PostgreSQL no disponible (%s); usando fallback JSON (%s).",
            exc,
            db_path,
        )
        return fallback_cls(db_path)


def _find_user(repo: Any, username: str) -> dict:
    uname = str(username or "").strip().lower()
    users = repo.get_all_users().get("users", [])
    return next((u for u in users if str(u.get("username", "")).strip().lower() == uname), None)


def handle_srs_get(path: str, repo: Any, valid_sign_ids: List[str]) -> Tuple[int, dict]:
    """Atiende GET /api/srs/due?username=...&limit=3."""
    parsed = urllib.parse.urlparse(path)
    params = urllib.parse.parse_qs(parsed.query)
    username = str((params.get("username") or ["invitado"])[0]).strip().lower() or "invitado"
    try:
        limit = max(1, min(int((params.get("limit") or ["3"])[0]), len(valid_sign_ids)))
    except ValueError:
        limit = 3

    if hasattr(repo, "get_due_reviews"):
        due = repo.get_due_reviews(username, limit=limit)
    else:
        user = _find_user(repo, username)
        stats = user.get("signStats", {}) if user else {}
        due = srs_service.get_due_signs(stats, valid_sign_ids, limit=limit)

    return 200, {"username": username, "due": due}


def handle_srs_post(payload: dict, repo: Any, valid_sign_ids: List[str]) -> Tuple[int, dict]:
    """Atiende POST /api/srs/review con {username, signId, passed}."""
    username = str(payload.get("username", "")).strip().lower()
    sign_id = str(payload.get("signId", "")).strip().upper()
    passed = bool(payload.get("passed", False))

    if not username:
        return 400, {"error": "Campo 'username' requerido"}
    if sign_id not in set(valid_sign_ids):
        return 400, {"error": f"Seña desconocida: {sign_id}"}

    if hasattr(repo, "record_srs_review"):
        result = repo.record_srs_review(username, sign_id, passed)
        return 200, {"status": "ok", **result}

    user = _find_user(repo, username) or {
        "username": username,
        "displayName": username,
        "level": "Principiante",
        "xp": 0,
        "streak": 1,
        "masteredSigns": [],
        "customPlans": [],
        "examHistory": [],
        "signStats": {},
    }
    updated_stats = srs_service.record_review(user.get("signStats", {}), sign_id, passed)
    user["signStats"] = updated_stats
    if passed and sign_id not in user.get("masteredSigns", []):
        user["masteredSigns"] = [*user.get("masteredSigns", []), sign_id]
    saved = repo.save_user(user)
    return 200, {
        "status": "ok",
        "username": username,
        "signId": sign_id,
        "stat": saved.get("signStats", {}).get(sign_id),
        "due": srs_service.get_due_signs(saved.get("signStats", {}), valid_sign_ids, limit=3),
    }


__all__ = [
    "PostgresUserRepository",
    "SRSService",
    "create_user_repository",
    "handle_srs_get",
    "handle_srs_post",
]
