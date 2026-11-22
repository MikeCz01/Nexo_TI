
from getpass import getpass
from sqlalchemy import select

from database import SessionLocal
from models import User
from security import hash_password

email = "tecnico@nexoti.local"
password = getpass("Nueva contraseña para el técnico: ")

if len(password) < 8:
    raise SystemExit("La contraseña debe tener al menos 8 caracteres.")

with SessionLocal() as db:
    user = db.scalar(select(User).where(User.email == email))

    if user is None:
        raise SystemExit("No existe el usuario técnico.")

    user.password_hash = hash_password(password)
    db.commit()

print("Contraseña actualizada correctamente.")
