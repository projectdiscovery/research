import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from .database import Base, engine
from . import models  # ensure all models are registered
from .routers import auth, accounts, transactions, loans, beneficiaries
from .routers import admin, teller, manager, compliance, notifications_ws, statements
from .routers import loan_applications, scheduled_payments, currency, disputes, analytics, sessions
from .services.scheduler import scheduler_loop

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start background scheduler
    task = asyncio.create_task(scheduler_loop())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VaultBank API",
    description="Digital Banking Platform API",
    version="3.0.0",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Apply rate limits to sensitive auth endpoints via dependency
# (The limiter decorator is applied in the auth router directly)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(accounts.router, prefix="/api/v1")
app.include_router(transactions.router, prefix="/api/v1")
app.include_router(loans.router, prefix="/api/v1")
app.include_router(beneficiaries.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(teller.router, prefix="/api/v1")
app.include_router(manager.router, prefix="/api/v1")
app.include_router(compliance.router, prefix="/api/v1")
app.include_router(notifications_ws.router, prefix="/api/v1")
app.include_router(statements.router, prefix="/api/v1")
app.include_router(loan_applications.router, prefix="/api/v1")
app.include_router(scheduled_payments.router, prefix="/api/v1")
app.include_router(currency.router, prefix="/api/v1")
app.include_router(disputes.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(sessions.router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "VaultBank API v3.0", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "healthy"}
