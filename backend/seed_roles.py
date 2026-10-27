
from sqlalchemy import select

from database import SessionLocal
from models import Role


INITIAL_ROLES = [
    {
        "name": "admin",
        "description": "Administrador general del sistema",
    },
    {
        "name": "supervisor",
        "description": "Supervisa y asigna tickets de soporte",
    },
    {
        "name": "technician",
        "description": "Atiende y resuelve tickets asignados",
    },
    {
        "name": "client",
        "description": "Usuario de una organización cliente",
    },
]


def seed_roles():
    with SessionLocal() as session:
        for role_data in INITIAL_ROLES:
            existing_role = session.scalar(
                select(Role).where(
                    Role.name == role_data["name"]
                )
            )

            if existing_role is None:
                session.add(Role(**role_data))
                print(f"Rol creado: {role_data['name']}")
            else:
                print(f"El rol ya existe: {role_data['name']}")

        session.commit()


if __name__ == "__main__":
    seed_roles()
