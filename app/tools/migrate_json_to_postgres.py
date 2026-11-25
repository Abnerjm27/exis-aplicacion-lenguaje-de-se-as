"""Migrador POO idempotente desde app/data/users_db.json hacia PostgreSQL."""

from __future__ import annotations

import json
import os
import sys

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from db.postgres_repository import PostgresUserRepository  # noqa: E402
from server import USERS_DB_PATH, VALID_SIGN_IDS  # noqa: E402


class JsonToPostgresMigrator:
    """Migra usuarios, planes, historial de exámenes y signStats desde JSON a PostgreSQL."""

    def __init__(self, dsn: str, json_path: str = USERS_DB_PATH):
        if not dsn:
            raise ValueError("Se requiere DATABASE_URL para migrar a PostgreSQL.")
        self.json_path = json_path
        self.repo = PostgresUserRepository(dsn=dsn, valid_sign_ids=VALID_SIGN_IDS)

    def run(self) -> int:
        if not os.path.exists(self.json_path):
            print(f"[INFO] No existe {self.json_path}; nada que migrar.")
            return 0

        self.repo.ensure_schema()
        with open(self.json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        users = data.get("users", []) if isinstance(data, dict) else []
        migrated = 0
        for user in users:
            if isinstance(user, dict) and user.get("username"):
                self.repo.save_user(user)
                migrated += 1
        print(f"[OK] Migrados {migrated} usuario(s) hacia PostgreSQL.")
        return migrated


def main() -> None:
    dsn = os.environ.get("DATABASE_URL", "").strip()
    if not dsn:
        print("Error: define la variable de entorno DATABASE_URL.", file=sys.stderr)
        sys.exit(1)
    migrator = JsonToPostgresMigrator(dsn=dsn)
    migrator.run()


if __name__ == "__main__":
    main()
