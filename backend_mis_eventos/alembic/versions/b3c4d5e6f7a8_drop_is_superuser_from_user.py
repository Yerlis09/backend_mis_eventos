"""drop is_superuser from user

Revision ID: b3c4d5e6f7a8
Revises: a2b3c4d5e6f7
Create Date: 2026-05-15

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b3c4d5e6f7a8"
down_revision: Union[str, None] = "a2b3c4d5e6f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Elimina la columna is_superuser.

    La autorización admin se gestiona exclusivamente por role='admin' (RBAC).
    """
    op.drop_column("user", "is_superuser")


def downgrade() -> None:
    """Restaura is_superuser como columna nullable para rollback de emergencia."""
    op.add_column(
        "user",
        sa.Column("is_superuser", sa.Boolean(), nullable=False, server_default="false"),
    )
