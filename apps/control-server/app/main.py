from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI

from .auth import verify_api_key
from .db import init_db
from .routes import components, shadow, traces

_auth = [Depends(verify_api_key)]


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="probe-agent Control Server", version="0.1.0", lifespan=lifespan)

    @app.get("/health")
    def health() -> dict:
        return {"ok": True}

    app.include_router(traces.router, dependencies=_auth)
    app.include_router(components.router, dependencies=_auth)
    app.include_router(shadow.router, dependencies=_auth)
    return app


app = create_app()
