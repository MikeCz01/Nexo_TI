
from getpass import getpass
from sqlalchemy import select

from database import SessionLocal
from models import User
from security import verify_password

email = input("Correo del usuario: ").strip().lower()
password = getpass("Contraseña que intentas usar: ")

with SessionLocal() as db:
    user = db.scalar(select(User).where(User.email == email))

    if user is None:
        print("Usuario no encontrado")
    else:
        print("Usuario activo:", user.is_active)
        print(
            "Contraseña correcta:",
            verify_password(password, user.password_hash),
        )
