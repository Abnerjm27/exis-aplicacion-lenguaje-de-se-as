"""Servicio POO de Repaso Espaciado (SRS · Sistema de Cajas de Leitner) para Manitas LSC."""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


class SRSService:
    """Calcula intervalos Leitner y prioriza señas pendientes de repaso (inmutable)."""

    BOX_INTERVAL_HOURS: Dict[int, int] = {
        1: 4,
        2: 24,
        3: 72,
        4: 168,
        5: 336,
    }

    @staticmethod
    def _iso_from_ts(ts: float) -> str:
        return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    @staticmethod
    def _parse_iso_ts(iso_str: Optional[str]) -> Optional[float]:
        if not iso_str or not isinstance(iso_str, str):
            return None
        clean = iso_str.strip()
        if clean.endswith("Z"):
            clean = clean[:-1] + "+00:00"
        try:
            return datetime.fromisoformat(clean).timestamp()
        except ValueError:
            return None

    @classmethod
    def sanitize_sign_stats(
        cls, raw_stats: Any, valid_sign_ids: List[str]
    ) -> Dict[str, Dict[str, Any]]:
        """Normaliza y filtra el diccionario signStats recibido desde cliente o almacenamiento."""
        if not isinstance(raw_stats, dict):
            return {}
        valid_set = set(valid_sign_ids)
        clean: Dict[str, Dict[str, Any]] = {}
        for sign_id, entry in raw_stats.items():
            sid = str(sign_id).strip().upper()
            if sid not in valid_set or not isinstance(entry, dict):
                continue
            try:
                box = max(1, min(int(entry.get("box", 1)), 5))
            except (TypeError, ValueError):
                box = 1
            try:
                attempts = max(0, int(entry.get("attempts", 0)))
            except (TypeError, ValueError):
                attempts = 0
            try:
                successes = max(0, min(int(entry.get("successes", 0)), attempts if attempts > 0 else 100000))
            except (TypeError, ValueError):
                successes = 0
            mastery_pct = round((successes / attempts) * 100) if attempts > 0 else 0
            clean[sid] = {
                "box": box,
                "attempts": attempts,
                "successes": successes,
                "lastPracticedIso": str(entry.get("lastPracticedIso", ""))[:40],
                "nextReviewIso": str(entry.get("nextReviewIso", ""))[:40],
                "masteryPct": mastery_pct,
            }
        return clean

    def record_review(
        self,
        sign_stats: Optional[Dict[str, Dict[str, Any]]],
        sign_id: str,
        passed: bool,
        now_ts: Optional[float] = None,
    ) -> Dict[str, Dict[str, Any]]:
        """Retorna una nueva copia de sign_stats actualizando la caja Leitner de sign_id."""
        sid = str(sign_id or "").strip().upper()
        if not sid:
            raise ValueError("sign_id inválido")

        current_ts = float(now_ts) if now_ts is not None else time.time()
        next_stats = {k: dict(v) for k, v in (sign_stats or {}).items()}
        prev = next_stats.get(sid, {})

        prev_box = int(prev.get("box", 1) or 1)
        prev_attempts = int(prev.get("attempts", 0) or 0)
        prev_successes = int(prev.get("successes", 0) or 0)

        new_box = min(5, prev_box + 1) if passed else 1
        new_attempts = prev_attempts + 1
        new_successes = prev_successes + (1 if passed else 0)
        interval_hours = self.BOX_INTERVAL_HOURS.get(new_box, 4)
        next_review_ts = current_ts + (interval_hours * 3600)

        next_stats[sid] = {
            "box": new_box,
            "attempts": new_attempts,
            "successes": new_successes,
            "lastPracticedIso": self._iso_from_ts(current_ts),
            "nextReviewIso": self._iso_from_ts(next_review_ts),
            "masteryPct": round((new_successes / new_attempts) * 100),
        }
        return next_stats

    def get_due_signs(
        self,
        sign_stats: Optional[Dict[str, Dict[str, Any]]],
        valid_sign_ids: List[str],
        limit: int = 3,
        now_ts: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        """Prioriza señas vencidas con menor caja/dominio; completa con nuevas si faltan."""
        current_ts = float(now_ts) if now_ts is not None else time.time()
        stats = sign_stats or {}
        max_items = max(1, min(int(limit), len(valid_sign_ids) or 1))

        due_entries: List[Dict[str, Any]] = []
        upcoming_entries: List[Dict[str, Any]] = []
        unseen_entries: List[Dict[str, Any]] = []

        for idx, sid in enumerate(valid_sign_ids):
            st = stats.get(sid)
            if not st:
                unseen_entries.append({
                    "signId": sid,
                    "box": 1,
                    "attempts": 0,
                    "successes": 0,
                    "masteryPct": 0,
                    "isDue": True,
                    "reason": "Sin practicar aún",
                    "nextReviewIso": "",
                    "_sortKey": (2, 1, 0.0, idx),
                })
                continue

            box = int(st.get("box", 1) or 1)
            attempts = int(st.get("attempts", 0) or 0)
            successes = int(st.get("successes", 0) or 0)
            mastery = round((successes / attempts) * 100) if attempts > 0 else 0
            next_iso = str(st.get("nextReviewIso", ""))
            next_ts = self._parse_iso_ts(next_iso)
            is_due = next_ts is None or next_ts <= current_ts

            item = {
                "signId": sid,
                "box": box,
                "attempts": attempts,
                "successes": successes,
                "masteryPct": mastery,
                "isDue": is_due,
                "reason": (
                    f"Vencida (Nivel {box} · {mastery}%)"
                    if is_due
                    else f"Refuerzo Nivel {box} ({mastery}%)"
                ),
                "nextReviewIso": next_iso,
                "_sortKey": (0 if is_due else 1, box, mastery, next_ts or 0.0, idx),
            }
            if is_due:
                due_entries.append(item)
            else:
                upcoming_entries.append(item)

        due_entries.sort(key=lambda x: x["_sortKey"])
        upcoming_entries.sort(key=lambda x: x["_sortKey"])

        combined = (due_entries + unseen_entries + upcoming_entries)[:max_items]
        for entry in combined:
            entry.pop("_sortKey", None)
        return combined
