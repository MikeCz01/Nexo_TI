
from getpass import getpass

from sqlalchemy import select

from database import SessionLocal
from models import Role, User
from security import hash_password


def get_or_create_user(
    db,
    role_name: str,
    full_name: str,
    email: str,
    password: str,
    client_id: int | None,
):
    role = db.scalar(select(Role).where(Role.name == role_name))

    if role is None:
        raise ValueError(f"No existe el rol: {role_name}")

    user = db.scalar(select(User).where(User.email == email))

    if user is not None:
        print(f"El usuario {email} ya existe; no se modificó.")
        return

    user = User(
        full_name=full_name,
        email=email,
        password_hash=hash_password(password),
        role_id=role.id,
        client_id=client_id,
        is_active=True,
    )

    db.add(user)
    db.flush()
    print(f"Creado: {email} | rol: {role_name} | ID: {user.id}")


admin_password = getpass("Nueva contraseña para el administrador: ")
tech_password = getpass("Nueva contraseña para el técnico: ")

if len(admin_password) < 8 or len(tech_password) < 8:
    raise SystemExit("Las contraseñas deben tener al menos 8 caracteres.")

with SessionLocal() as db:
    try:
        get_or_create_user(
            db,
            role_name="admin",
            full_name="Administrador de Prueba",
            email="admin@nexoti.local",
            password=admin_password,
            client_id=None,
        )

        get_or_create_user(
            db,
            role_name="technician",
            full_name="Técnico de Prueba",
            email="tecnico@nexoti.local",
            password=tech_password,
            client_id=1,
        )

        db.commit()
    except Exception:
        db.rollback()
        raise

print("Proceso finalizado.")
