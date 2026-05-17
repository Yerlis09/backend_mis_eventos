"""add role column to user

Revision ID: f1a2b3c4d5e6
Revises: e3f2a1b5c8d0
Create Date: 2026-05-14

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, None] = "e3f2a1b5c8d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Agrega columna role a la tabla user.

    server_default='attendee' garantiza que todos los usuarios existentes
    reciban el valor sin necesidad de un UPDATE adicional.
    Valores válidos: attendee | organizer | admin
    """
    op.add_column(
        "user",
        sa.Column(
            "role",
            sa.String(length=20),
            server_default="attendee",
            nullable=False,
        ),
    )


def downgrade() -> None:
    """Elimina la columna role de la tabla user."""
    op.drop_column("user", "role")
