# VaultBank — Digital Banking Platform

A full-stack digital banking platform built with React 18 + FastAPI.

## Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6
- **Backend**: Python FastAPI, SQLAlchemy ORM, PostgreSQL
- **Auth**: JWT (Bearer tokens), bcrypt password hashing

## Quick Start

### 1. Database
```bash
# Create PostgreSQL database
createdb vaultbank
```

### 2. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env       # Edit DATABASE_URL and SECRET_KEY

# Start the server (tables are auto-created on startup)
uvicorn app.main:app --reload --port 8000

# Seed demo data (in a separate terminal with venv active)
python -m app.seed
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
```

## Demo Accounts

| Email | Password | Tier |
|---|---|---|
| demo@vaultbank.com | demo1234 | Silver |
| alex.morgan@example.com | demo1234 | Platinum |
| sarah.chen@example.com | demo1234 | Gold |

## API Docs

Visit `http://localhost:8000/docs` for the interactive Swagger UI.

## Project Structure

```
app/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, router registration
│   │   ├── database.py      # SQLAlchemy engine and session
│   │   ├── config.py        # Pydantic settings from .env
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── routers/         # Route handlers (auth, accounts, transactions, loans, beneficiaries)
│   │   ├── services/        # Auth helpers (JWT, bcrypt)
│   │   └── seed.py          # Demo data seeder
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/           # Landing, Login, Register, Dashboard, Transactions, Transfer, Settings
        ├── components/      # Layout, Sidebar, Navbar
        ├── context/         # AuthContext (JWT state management)
        └── services/        # Axios API client
```
