
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Client, Role, User
from schemas import UserCreate, UserResponse
from security import hash_password

router = APIRouter(prefix="/users", tags=["Users"])


def get_db():
    with SessionLocal() as session:
        yield session


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    data: UserCreate,
    db: Session = Depends(get_db),
):
    client = db.get(Client, data.client_id)

    if client is None or not client.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El cliente no existe o está inactivo",
        )

    existing_user = db.scalar(
        select(User).where(User.email == data.email)
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un usuario con ese correo",
        )

    client_role = db.scalar(
        select(Role).where(Role.name == "client")
    )

    if client_role is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No existe el rol client. Ejecuta seed_roles.py",
        )

    user = User(
        full_name=data.full_name.strip(),
        email=data.email,
        password_hash=hash_password(data.password),
        client_id=client.id,
        role_id=client_role.id,
    )

    db.add(user)

    try:
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo crear el usuario",
        )

    return user
