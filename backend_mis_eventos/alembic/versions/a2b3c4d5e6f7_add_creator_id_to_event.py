"""add creator_id to event

Revision ID: a2b3c4d5e6f7
Revises: f1a2b3c4d5e6
Create Date: 2026-05-14

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a2b3c4d5e6f7"
down_revision: Union[str, None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Agrega columna creator_id a la tabla event.

    nullable=True para compatibilidad con eventos existentes (sin propietario).
    ondelete=SET NULL: si el usuario creador se elimina, el evento no se borra.
    """
    op.add_column("event", sa.Column("creator_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_event_creator_id",
        "event",
        "user",
        ["creator_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    """Elimina creator_id de la tabla event."""
    op.drop_constraint("fk_event_creator_id", "event", type_="foreignkey")
    op.drop_column("event", "creator_id")
