
from typing import Annotated
from pydantic import BaseModel, Field
from models import Role
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth import get_current_user, get_db
from models import Ticket, TicketEvent, User
from permissions import require_roles
from schemas import (
    TicketCreate,
    TicketEventResponse,
    TicketResponse,
    TicketStatusUpdate,
)

router = APIRouter(prefix="/tickets", tags=["Tickets"])


def add_ticket_event(
    db: Session,
    ticket_id: int,
    actor_id: int,
    event_type: str,
    old_value: str | None,
    new_value: str | None,
) -> None:
    db.add(
        TicketEvent(
            ticket_id=ticket_id,
            actor_id=actor_id,
            event_type=event_type,
            old_value=old_value,
            new_value=new_value,
        )
    )


@router.post(
    "/",
    response_model=TicketResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_ticket(
    ticket_data: TicketCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[
        User, Depends(require_roles("client"))
    ],
):
    if current_user.client_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario no tiene un cliente asociado",
        )

    ticket = Ticket(
        client_id=current_user.client_id,
        created_by=current_user.id,
        title=ticket_data.title,
        description=ticket_data.description,
        priority=ticket_data.priority,
    )

    db.add(ticket)
    db.flush()

    add_ticket_event(
        db,
        ticket_id=ticket.id,
        actor_id=current_user.id,
        event_type="created",
        old_value=None,
        new_value="open",
    )

    db.commit()
    db.refresh(ticket)

    return ticket


@router.get("/", response_model=list[TicketResponse])
def list_tickets(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    query = select(Ticket).order_by(Ticket.created_at.desc())

    if current_user.role is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario no tiene un rol asignado",
        )

    if current_user.role.name == "client":
        query = query.where(
            Ticket.client_id == current_user.client_id
        )
    elif current_user.role.name == "technician":
        query = query.where(
            Ticket.assigned_to == current_user.id
        )
    elif current_user.role.name not in ("admin", "supervisor"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para consultar tickets",
        )

    return db.scalars(query).all()

class TicketAssignment(BaseModel):
    technician_id: int = Field(gt=0)


@router.patch("/{ticket_id}/assign", response_model=TicketResponse)
def assign_ticket(
    ticket_id: int,
    assignment: TicketAssignment,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[
        User, Depends(require_roles("admin", "supervisor"))
    ],
):
    ticket = db.get(Ticket, ticket_id)

    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket no encontrado",
        )

    technician = db.get(User, assignment.technician_id)

    if (
        technician is None
        or not technician.is_active
        or technician.role is None
        or technician.role.name != "technician"
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario asignado debe ser un técnico activo",
        )

    if technician.client_id != ticket.client_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El técnico debe pertenecer al mismo cliente que el ticket",
        )

    previous_assignee = ticket.assigned_to

    if previous_assignee != technician.id:
        add_ticket_event(
            db,
            ticket_id=ticket.id,
            actor_id=current_user.id,
            event_type="assigned",
            old_value=(
                str(previous_assignee)
                if previous_assignee is not None
                else None
            ),
            new_value=str(technician.id),
        )

    ticket.assigned_to = technician.id
    db.commit()
    db.refresh(ticket)

    return ticket


@router.patch("/{ticket_id}/status", response_model=TicketResponse)
def update_ticket_status(
    ticket_id: int,
    status_update: TicketStatusUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[
        User, Depends(require_roles("admin", "supervisor", "technician"))
    ],
):
    ticket = db.get(Ticket, ticket_id)

    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket no encontrado",
        )

    if (
        current_user.role.name == "technician"
        and ticket.assigned_to != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes modificar tickets asignados a ti",
        )

    previous_status = ticket.status

    if previous_status != status_update.status:
        add_ticket_event(
            db,
            ticket_id=ticket.id,
            actor_id=current_user.id,
            event_type="status_changed",
            old_value=previous_status,
            new_value=status_update.status,
        )

    ticket.status = status_update.status
    db.commit()
    db.refresh(ticket)

    return ticket


@router.get(
    "/{ticket_id}/history",
    response_model=list[TicketEventResponse],
)
def list_ticket_history(
    ticket_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    if current_user.role is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario no tiene un rol asignado",
        )

    role_name = current_user.role.name

    if role_name not in ("client", "technician", "admin", "supervisor"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para consultar tickets",
        )

    ticket = db.get(Ticket, ticket_id)

    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket no encontrado",
        )

    if role_name == "client" and ticket.client_id != current_user.client_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket no encontrado",
        )

    if (
        role_name == "technician"
        and ticket.assigned_to != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket no encontrado",
        )

    query = (
        select(TicketEvent)
        .where(TicketEvent.ticket_id == ticket.id)
        .order_by(TicketEvent.created_at.asc(), TicketEvent.id.asc())
    )

    return db.scalars(query).all()
