from datetime import datetime
from pydantic import BaseModel, ConfigDict
from pydantic import BaseModel, ConfigDict, Field, field_validator


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    client_id: int = Field(gt=0)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        value = value.strip().lower()
        if "@" not in value or value.startswith("@") or value.endswith("@"):
            raise ValueError("El correo electrónico no es válido")
        return value


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    client_id: int | None
    role_id: int
    full_name: str
    email: str
    is_active: bool

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class TicketCreate(BaseModel):
    title: str = Field(min_length=5, max_length=150)
    description: str = Field(min_length=10, max_length=5000)
    priority: Literal["low", "medium", "high"] = "medium"


class TicketStatusUpdate(BaseModel):
    status: Literal["open", "in_progress", "resolved", "closed"]


class TicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    client_id: int
    created_by: int
    assigned_to: int | None
    title: str
    description: str
    status: str
    priority: str
    created_at: datetime
    updated_at: datetime


class TicketEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ticket_id: int
    actor_id: int
    event_type: str
    old_value: str | None
    new_value: str | None
    created_at: datetime
