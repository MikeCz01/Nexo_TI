
from fastapi import APIRouter, Depends

from models import User
from permissions import require_roles

router = APIRouter(prefix="/admin", tags=["Administration"])


@router.get("/test")
def admin_test(
    current_user: User = Depends(require_roles("admin")),
):
    return {
        "message": "Acceso autorizado al módulo de administración",
        "user_id": current_user.id,
        "role": current_user.role.name,
    }
