"""add unique constraint registration user event

Revision ID: e3f2a1b5c8d0
Revises: d9717679c952
Create Date: 2026-05-14

"""
from typing import Sequence, Union

from alembic import op

revision: str = "e3f2a1b5c8d0"
down_revision: Union[str, None] = "d9717679c952"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Garantiza a nivel DB que un usuario no puede registrarse dos veces al mismo evento."""
    op.create_unique_constraint(
        "uq_registration_user_event",
        "registration",
        ["user_id", "event_id"],
    )


def downgrade() -> None:
    """Elimina el unique constraint de la tabla registration."""
    op.drop_constraint("uq_registration_user_event", "registration", type_="unique")
