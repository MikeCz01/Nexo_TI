
from getpass import getpass
from sqlalchemy import select

from database import SessionLocal
from models import User
from security import hash_password

email = input("Correo del usuario: ").strip().lower()
password = getpass("Nueva contraseña (mínimo 8 caracteres): ")

if len(password) < 8:
    print("Error: la contraseña debe tener al menos 8 caracteres.")
    raise SystemExit(1)

with SessionLocal() as db:
    user = db.scalar(select(User).where(User.email == email))

    if user is None:
        print("Usuario no encontrado.")
    else:
        user.password_hash = hash_password(password)
        db.commit()
        print("Contraseña actualizada correctamente.")
