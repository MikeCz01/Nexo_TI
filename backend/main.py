
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import admin
from routers.users import router as users_router
from routers.auth import router as auth_router
from routers.profile import router as profile_router
from routers import tickets

app = FastAPI(
    title="Nexo TI API",
    description="Sistema de gestión de soporte técnico para múltiples clientes",
    version="0.3.0",
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar las rutas
app.include_router(users_router)
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(admin.router)
app.include_router(tickets.router)


@app.get("/")
def root():
    return {
        "message": "Bienvenido a Nexo TI",
        "status": "online",
    }


@app.get("/health")
def health():
    return {"status": "ok"}

