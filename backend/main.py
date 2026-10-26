from fastapi import FastAPI

app = FastAPI(
    title="Nexo TI API",
    description="Sistema de gestión de soporte técnico para múltiples clientes",
    version="0.1.0",
)

@app.get("/")
def root():
    return {
        "message": "Bienvenido a Nexo TI",
        "status": "online",
    }

@app.get("/health")
def health():
    return {"status": "ok"}
